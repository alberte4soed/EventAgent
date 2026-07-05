// Poll the platform Kalas mailbox for vendor replies across ALL users,
// extract quotes, pull attachments into Storage, and queue an Ava reply
// proposal for each new reply. Thread-id matching is the join key.

import { createAdminClient } from "@/lib/supabase/admin";
import { GmailNotConnectedError } from "./oauth";
import { getPlatformAccessToken } from "./platform";
import { saveReplyAttachments } from "./attachments";
import {
  extractQuote,
  quoteStatusFromExtraction,
  generateReplyProposal,
} from "@/lib/gemini/agent";
import type { EmailReplyRow, OutboundEmailRow } from "@/lib/db/types";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailMessageMeta {
  id: string;
  threadId: string;
}

interface GmailMessageFull {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: GmailPart;
}

interface GmailPart {
  mimeType?: string;
  filename?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string; size?: number; attachmentId?: string };
  parts?: GmailPart[];
}

function header(msg: GmailMessageFull, name: string): string | null {
  return (
    msg.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())
      ?.value ?? null
  );
}

/** Walk the MIME tree for the first text/plain part (fall back to text/html). */
function extractBody(part: GmailPart | undefined): string {
  if (!part) return "";
  const findByMime = (p: GmailPart, mime: string): string | null => {
    if (p.mimeType === mime && p.body?.data) {
      return Buffer.from(p.body.data, "base64url").toString("utf8");
    }
    for (const child of p.parts ?? []) {
      const found = findByMime(child, mime);
      if (found) return found;
    }
    return null;
  };
  const plain = findByMime(part, "text/plain");
  if (plain) return plain;
  const html = findByMime(part, "text/html");
  if (html) return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return "";
}

async function gmailGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API ${path} failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export interface PollSummary {
  checked: number;
  newReplies: number;
  attachmentsSaved: number;
  proposalsCreated: number;
  error?: string;
}

/**
 * One pass over the platform inbox: match new messages to outreach threads
 * (any user), persist replies + attachments, queue Ava's reply proposals.
 */
export async function pollPlatformReplies(): Promise<PollSummary> {
  const admin = createAdminClient();
  const summary: PollSummary = {
    checked: 0,
    newReplies: 0,
    attachmentsSaved: 0,
    proposalsCreated: 0,
  };

  // All in-flight outreach threads, across every user. The thread anchor is
  // the initial outreach row; the message-id set covers our replies too, so
  // we never re-ingest our own messages.
  const { data: outbound } = await admin
    .from("outbound_emails")
    .select("*")
    .in("status", ["sent", "replied"])
    .not("gmail_thread_id", "is", null);
  const outboundRows = (outbound ?? []) as OutboundEmailRow[];
  const outboundByThread = new Map<string, OutboundEmailRow>();
  const ourMessageIds = new Set<string>();
  for (const row of outboundRows) {
    if (row.gmail_message_id) ourMessageIds.add(row.gmail_message_id);
    if (row.kind === "outreach" && row.gmail_thread_id) {
      outboundByThread.set(row.gmail_thread_id, row);
    }
  }
  // Reply-kind rows whose thread has no outreach anchor loaded (shouldn't
  // happen, but anchor on them as fallback).
  for (const row of outboundRows) {
    if (row.gmail_thread_id && !outboundByThread.has(row.gmail_thread_id)) {
      outboundByThread.set(row.gmail_thread_id, row);
    }
  }
  if (outboundByThread.size === 0) return summary;

  let accessToken: string;
  try {
    accessToken = await getPlatformAccessToken();
  } catch (err) {
    if (err instanceof GmailNotConnectedError) {
      return { ...summary, error: "platform_mailbox_not_connected" };
    }
    throw err;
  }

  // Recent inbox messages; thread ids are matched against our outreach.
  const list = await gmailGet<{ messages?: GmailMessageMeta[] }>(
    accessToken,
    `/messages?q=${encodeURIComponent("in:inbox newer_than:7d")}&maxResults=100`
  );

  const candidates = (list.messages ?? []).filter(
    (m) => outboundByThread.has(m.threadId) && !ourMessageIds.has(m.id)
  );
  summary.checked = candidates.length;

  for (const meta of candidates) {
    const anchor = outboundByThread.get(meta.threadId)!;

    // Skip if already recorded.
    const { data: existing } = await admin
      .from("email_replies")
      .select("id")
      .eq("gmail_message_id", meta.id)
      .maybeSingle();
    if (existing) continue;

    const full = await gmailGet<GmailMessageFull>(
      accessToken,
      `/messages/${meta.id}?format=full`
    );
    if (full.labelIds?.includes("SENT")) continue; // sent by us, not a reply

    const body = extractBody(full.payload);
    const fromEmail =
      header(full, "From")?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
    const rfc822MessageId = header(full, "Message-ID");

    // Quote extraction is best-effort; store the reply even if it fails.
    let quote = null;
    let quoteStatus: string | null = null;
    try {
      const { data: venue } = await admin
        .from("venues")
        .select("name")
        .eq("id", anchor.venue_id)
        .single();
      const extraction = await extractQuote({
        venueName: venue?.name ?? "the venue",
        replyBody: body || full.snippet || "",
      });
      quote = extraction;
      quoteStatus = quoteStatusFromExtraction(extraction);
    } catch (err) {
      console.error(`Quote extraction failed for message ${meta.id}:`, err);
    }

    const { data: inserted, error: insertError } = await admin
      .from("email_replies")
      .insert({
        outbound_email_id: anchor.id,
        venue_id: anchor.venue_id,
        event_id: anchor.event_id,
        user_id: anchor.user_id,
        gmail_message_id: meta.id,
        from_email: fromEmail,
        snippet: full.snippet ?? null,
        body: body || null,
        received_at: full.internalDate
          ? new Date(Number(full.internalDate)).toISOString()
          : null,
        quote,
        quote_status: quoteStatus,
        rfc822_message_id: rfc822MessageId,
      })
      .select()
      .single();
    if (insertError || !inserted) {
      // Unique violation on gmail_message_id = concurrent poll; ignore.
      if (insertError && !insertError.message.includes("duplicate")) {
        console.error("Failed to insert reply:", insertError.message);
      }
      continue;
    }
    const reply = inserted as EmailReplyRow;

    await admin
      .from("outbound_emails")
      .update({ status: "replied" })
      .eq("id", anchor.id);
    summary.newReplies++;

    // Attachments → Storage (best-effort).
    summary.attachmentsSaved += await saveReplyAttachments(
      accessToken,
      admin,
      reply,
      full.payload
    );

    // Ava's proposed response (best-effort).
    const proposal = await generateReplyProposal(admin, reply);
    if (proposal) summary.proposalsCreated++;
  }

  await admin
    .from("platform_gmail_tokens")
    .update({ last_polled_at: new Date().toISOString() })
    .eq("id", 1);

  return summary;
}
