import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GmailNotConnectedError } from "@/lib/gmail/oauth";
import {
  getPlatformAccessToken,
  getPlatformEmail,
  ensureReplyTag,
  plusAddress,
} from "@/lib/gmail/platform";
import { sendEmail } from "@/lib/gmail/send";
import { labelOutreachThread } from "@/lib/gmail/labels";
import { composeOutreachEmail, findVenueEmail } from "@/lib/gemini/agent";
import type { EmailDraftRow, EventRow, VenueRow } from "@/lib/db/types";

export const maxDuration = 300; // compose + send per vendor, sequentially

interface VenueResult {
  venueId: string;
  venueName: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
}

/**
 * POST /api/drafts/[draftId]/approve — approve the master draft, then compose
 * and send an individual email to every liked vendor in the draft's category,
 * from the platform Kalas mailbox.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { draftId } = await params;
  const { data: draftData } = await supabase
    .from("email_drafts")
    .select("*")
    .eq("id", draftId)
    .single();
  const draft = draftData as EmailDraftRow | null;
  if (!draft) return Response.json({ error: "Draft not found" }, { status: 404 });
  if (draft.status !== "proposed") {
    return Response.json({ error: `Draft already ${draft.status}` }, { status: 409 });
  }

  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("id", draft.event_id)
    .single();
  const event = eventData as EventRow | null;
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

  // Liked vendors in this draft's category, minus those already contacted.
  const { data: venuesData } = await supabase
    .from("venues")
    .select("*")
    .eq("event_id", draft.event_id)
    .eq("swipe_status", "liked")
    .eq("category", draft.category);
  const { data: contactedData } = await supabase
    .from("outbound_emails")
    .select("venue_id")
    .eq("event_id", draft.event_id)
    .in("status", ["sent", "replied"]);
  const contacted = new Set(
    ((contactedData ?? []) as { venue_id: string }[]).map((r) => r.venue_id)
  );
  const venues = ((venuesData ?? []) as VenueRow[]).filter((v) => !contacted.has(v.id));
  if (venues.length === 0) {
    return Response.json(
      { error: `No uncontacted liked ${draft.category}s to reach out to` },
      { status: 400 }
    );
  }

  // Verify the platform mailbox before marking anything approved.
  let accessToken: string;
  let platformEmail: string | null;
  try {
    accessToken = await getPlatformAccessToken();
    platformEmail = await getPlatformEmail();
  } catch (err) {
    if (err instanceof GmailNotConnectedError) {
      return Response.json(
        {
          error: "outreach_unavailable",
          message: "Ava's outreach mailbox is being set up — try again shortly.",
        },
        { status: 503 }
      );
    }
    throw err;
  }

  const replyTag = await ensureReplyTag(supabase, event);
  const replyTo = platformEmail ? plusAddress(platformEmail, replyTag) : undefined;

  await supabase.from("email_drafts").update({ status: "approved" }).eq("id", draftId);
  await supabase.from("events").update({ status: "sending" }).eq("id", draft.event_id);

  const results: VenueResult[] = [];
  for (const venue of venues) {
    // Last-chance email lookup for liked vendors still missing one.
    let toEmail = venue.email;
    if (!toEmail) {
      try {
        toEmail = await findVenueEmail(venue.name, venue.website);
        await supabase
          .from("venues")
          .update({
            email: toEmail ?? undefined,
            email_lookup_status: toEmail ? "found" : "not_found",
          })
          .eq("id", venue.id);
      } catch {
        // fall through to skip
      }
    }
    if (!toEmail) {
      results.push({
        venueId: venue.id,
        venueName: venue.name,
        status: "skipped",
        reason: "No contact email found",
      });
      continue;
    }

    const body = await composeOutreachEmail({
      template: draft.body_template,
      event,
      venue,
    });

    const { data: outboundData } = await supabase
      .from("outbound_emails")
      .insert({
        event_id: draft.event_id,
        venue_id: venue.id,
        draft_id: draft.id,
        user_id: user.id,
        to_email: toEmail,
        subject: draft.subject,
        body,
        kind: "outreach",
      })
      .select("id")
      .single();

    try {
      const sent = await sendEmail(accessToken, {
        to: toEmail,
        subject: draft.subject,
        body,
        fromName: "Ava at Kalas",
        fromEmail: platformEmail ?? undefined,
        replyTo,
      });
      await supabase
        .from("outbound_emails")
        .update({
          gmail_message_id: sent.messageId,
          gmail_thread_id: sent.threadId,
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", outboundData!.id);
      await labelOutreachThread(accessToken, sent.threadId, replyTag);
      results.push({ venueId: venue.id, venueName: venue.name, status: "sent" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Send failed";
      await supabase
        .from("outbound_emails")
        .update({ status: "failed", error: reason })
        .eq("id", outboundData!.id);
      results.push({ venueId: venue.id, venueName: venue.name, status: "failed", reason });
    }
    // Gentle pacing between sends.
    await new Promise((r) => setTimeout(r, 500));
  }

  const sentCount = results.filter((r) => r.status === "sent").length;
  await supabase.from("email_drafts").update({ status: "sent" }).eq("id", draftId);
  await supabase
    .from("events")
    .update({ status: sentCount > 0 ? "awaiting_replies" : "drafting" })
    .eq("id", draft.event_id);

  // Drop a summary into the chat so the transcript reflects what happened.
  await supabase.from("chat_messages").insert({
    event_id: draft.event_id,
    user_id: user.id,
    role: "assistant",
    content:
      sentCount > 0
        ? `I've reached out to ${sentCount} ${draft.category}${sentCount === 1 ? "" : "s"} from my Kalas mailbox — replies come straight to me and I'll flag each one for you in the outreach inbox.`
        : "I couldn't send any emails — check the contact details and approve again.",
    payload: {
      kind: "send_report",
      sent: sentCount,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    },
  });

  return Response.json({ results });
}
