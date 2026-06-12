import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGmailConnection } from "@/lib/gmail/oauth";
import { EventWorkspace } from "@/components/workspace/EventWorkspace";
import type {
  ChatMessageRow,
  EmailDraftRow,
  EmailReplyRow,
  EventRow,
  OutboundEmailRow,
  VenueRow,
} from "@/lib/db/types";

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { eventId } = await params;
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) notFound();

  const [{ data: messages }, { data: venues }, { data: drafts }, { data: outbound }, { data: replies }, gmail] =
    await Promise.all([
      supabase
        .from("chat_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true }),
      supabase.from("venues").select("*").eq("event_id", eventId).order("created_at"),
      supabase.from("email_drafts").select("*").eq("event_id", eventId),
      supabase.from("outbound_emails").select("*").eq("event_id", eventId),
      supabase.from("email_replies").select("*").eq("event_id", eventId),
      getGmailConnection(user.id),
    ]);

  return (
    <EventWorkspace
      initialEvent={event as EventRow}
      initialMessages={(messages ?? []) as ChatMessageRow[]}
      initialVenues={(venues ?? []) as VenueRow[]}
      initialDrafts={(drafts ?? []) as EmailDraftRow[]}
      initialOutbound={(outbound ?? []) as OutboundEmailRow[]}
      initialReplies={(replies ?? []) as EmailReplyRow[]}
      gmailConnected={gmail.connected}
    />
  );
}
