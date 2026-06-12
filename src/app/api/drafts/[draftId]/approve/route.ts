import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessToken, GmailNotConnectedError } from "@/lib/gmail/oauth";
import { sendEmail } from "@/lib/gmail/send";
import { personalizeEmail, findVenueEmail } from "@/lib/gemini/agent";
import type { EmailDraftRow, VenueRow } from "@/lib/db/types";

export const maxDuration = 300; // personalize + send per venue, sequentially

interface VenueResult {
  venueId: string;
  venueName: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
}

/**
 * POST /api/drafts/[draftId]/approve — approve the master draft, then
 * personalize and send it to every liked venue with a contact email.
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

  const { data: venuesData } = await supabase
    .from("venues")
    .select("*")
    .eq("event_id", draft.event_id)
    .eq("swipe_status", "liked");
  const venues = (venuesData ?? []) as VenueRow[];
  if (venues.length === 0) {
    return Response.json({ error: "No liked venues to contact" }, { status: 400 });
  }

  // Verify Gmail connectivity before marking anything approved.
  let accessToken: string;
  try {
    accessToken = await getAccessToken(user.id);
  } catch (err) {
    if (err instanceof GmailNotConnectedError) {
      return Response.json(
        { error: "gmail_not_connected", message: err.message },
        { status: 412 }
      );
    }
    throw err;
  }

  await supabase.from("email_drafts").update({ status: "approved" }).eq("id", draftId);
  await supabase.from("events").update({ status: "sending" }).eq("id", draft.event_id);

  const results: VenueResult[] = [];
  for (const venue of venues) {
    // Last-chance email lookup for liked venues still missing one.
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

    let body: string;
    try {
      body = await personalizeEmail({
        template: draft.body_template,
        venueName: venue.name,
        venueDescription: venue.description,
      });
    } catch {
      body = draft.body_template.replaceAll("{{venue_name}}", venue.name);
    }

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
      })
      .select("id")
      .single();

    try {
      const sent = await sendEmail(accessToken, {
        to: toEmail,
        subject: draft.subject,
        body,
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
        ? `I've sent your quote request to ${sentCount} venue${sentCount === 1 ? "" : "s"}. I'll keep an eye on the replies and collect quotes in the dashboard.`
        : "I couldn't send any emails — check the venue contact details and your Gmail connection, then approve again.",
    payload: {
      kind: "send_report",
      sent: sentCount,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    },
  });

  return Response.json({ results });
}
