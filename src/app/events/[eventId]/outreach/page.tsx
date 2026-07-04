import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OutreachInbox } from "@/components/outreach/OutreachInbox";
import { getPlatformEmail, plusAddress } from "@/lib/gmail/platform";
import type {
  EmailAttachmentRow,
  EmailReplyRow,
  EventRow,
  OutboundEmailRow,
  ReplyProposalRow,
  VenueRow,
} from "@/lib/db/types";

export default async function OutreachPage({
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

  const [
    { data: venues },
    { data: outbound },
    { data: replies },
    { data: attachments },
    { data: proposals },
    platformEmail,
  ] = await Promise.all([
    supabase.from("venues").select("*").eq("event_id", eventId).order("created_at"),
    supabase
      .from("outbound_emails")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at"),
    supabase.from("email_replies").select("*").eq("event_id", eventId).order("created_at"),
    supabase.from("email_attachments").select("*").eq("event_id", eventId),
    supabase
      .from("reply_proposals")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at"),
    getPlatformEmail(),
  ]);

  const eventRow = event as EventRow;
  const replyAddress =
    platformEmail && eventRow.reply_tag
      ? plusAddress(platformEmail, eventRow.reply_tag)
      : null;

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#F6F0E8] text-[#4A4E3C]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#D4D6C0] px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="font-[family-name:var(--font-fraunces)] text-[20px] font-semibold tracking-[-0.5px]"
          >
            kalas
          </Link>
          <span className="text-[#c4c8ae]">/</span>
          <h1 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-[-0.4px]">
            {eventRow.title} · Outreach
          </h1>
        </div>
        <Link
          href={`/events/${eventId}`}
          className="rounded-full px-3.5 py-2 text-sm text-[#656952] transition hover:bg-[#ece8db]"
        >
          ← Workspace
        </Link>
      </header>
      <OutreachInbox
        eventId={eventId}
        replyAddress={replyAddress}
        initialVenues={(venues ?? []) as VenueRow[]}
        initialOutbound={(outbound ?? []) as OutboundEmailRow[]}
        initialReplies={(replies ?? []) as EmailReplyRow[]}
        initialAttachments={(attachments ?? []) as EmailAttachmentRow[]}
        initialProposals={(proposals ?? []) as ReplyProposalRow[]}
      />
    </main>
  );
}
