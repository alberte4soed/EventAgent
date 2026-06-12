import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessToken, GmailNotConnectedError } from "./oauth";
import { extractQuote, quoteStatusFromExtraction } from "@/lib/gemini/agent";
import type { OutboundEmailRow } from "@/lib/db/types";

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
  headers?: { name: string; value: string }[];
  body?: { data?: string; size?: number };
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
  userId: string;
  checked: number;
  newReplies: number;
  error?: string;
}

/**
 * Poll one user's inbox for replies to our outreach threads, extract quotes
 * with Gemini, and persist results. Thread-id matching is the join key.
 */
export async function pollUserReplies(userId: string): Promise<PollSummary> {
  const admin = createAdminClient();
  const summary: PollSummary = { userId, checked: 0, newReplies: 0 };

  // Outreach emails we have sent and not yet seen replies for (or watching for more).
  const { data: outbound } = await admin
    .from("outbound_emails")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["sent", "replied"])
    .not("gmail_thread_id", "is", null);
  const outboundByThread = new Map<string, OutboundEmailRow>(
    ((outbound ?? []) as OutboundEmailRow[]).map((o) => [o.gmail_thread_id as string, o])
  );
  if (outboundByThread.size === 0) return summary;

  let accessToken: string;
  try {
    accessToken = await getAccessToken(userId);
  } catch (err) {
    if (err instanceof GmailNotConnectedError) {
      return { ...summary, error: "gmail_not_connected" };
    }
    throw err;
  }

  // Recent inbox messages; thread ids are matched against our outreach.
  const list = await gmailGet<{ messages?: GmailMessageMeta[] }>(
    accessToken,
    `/messages?q=${encodeURIComponent("in:inbox newer_than:7d")}&maxResults=100`
  );

  const candidates = (list.messages ?? []).filter((m) =>
    outboundByThread.has(m.threadId)
  );
  summary.checked = candidates.length;

  for (const meta of candidates) {
    const outboundEmail = outboundByThread.get(meta.threadId)!;
    if (meta.id === outboundEmail.gmail_message_id) continue; // our own message

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

    // Quote extraction is best-effort; store the reply even if it fails.
    let quote = null;
    let quoteStatus: string | null = null;
    try {
      const { data: venue } = await admin
        .from("venues")
        .select("name")
        .eq("id", outboundEmail.venue_id)
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

    const { error: insertError } = await admin.from("email_replies").insert({
      outbound_email_id: outboundEmail.id,
      venue_id: outboundEmail.venue_id,
      event_id: outboundEmail.event_id,
      user_id: userId,
      gmail_message_id: meta.id,
      from_email: fromEmail,
      snippet: full.snippet ?? null,
      body: body || null,
      received_at: full.internalDate
        ? new Date(Number(full.internalDate)).toISOString()
        : null,
      quote,
      quote_status: quoteStatus,
    });
    if (insertError) {
      // Unique violation on gmail_message_id = concurrent poll; ignore.
      if (!insertError.message.includes("duplicate")) {
        console.error("Failed to insert reply:", insertError.message);
      }
      continue;
    }

    await admin
      .from("outbound_emails")
      .update({ status: "replied" })
      .eq("id", outboundEmail.id);
    summary.newReplies++;
  }

  await admin.from("poll_state").upsert({
    user_id: userId,
    last_polled_at: new Date().toISOString(),
  });

  return summary;
}

/** All users who have outreach in flight — the cron iterates these. */
export async function getUsersAwaitingReplies(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("outbound_emails")
    .select("user_id")
    .in("status", ["sent", "replied"]);
  return [...new Set(((data ?? []) as { user_id: string }[]).map((r) => r.user_id))];
}
