import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseInviteConfig } from "@/kalas/invite/config";
import type { EventRow, ProfileRow, InvitationRow, GuestRow, AppLanguage } from "@/lib/db/types";
import { PublicInvite } from "./PublicInvite";

export const dynamic = "force-dynamic";

function coupleFrom(config: { names: string }, event: EventRow, profile: ProfileRow | null) {
  if (config.names.trim()) return config.names.trim();
  const a = (profile?.display_name ?? event.title).split(/\s+/)[0] || "";
  const b = profile?.partner_name?.split(/\s+/)[0] ?? "";
  return b ? `${a} & ${b}` : a;
}

export default async function PublicInvitationPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rsvp?: string }>;
}) {
  const { slug } = await params;
  const { rsvp: rsvpToken } = await searchParams;
  const admin = createAdminClient();

  const { data: inviteRow } = await admin
    .from("invitations").select("*").ilike("slug", slug).maybeSingle();
  const invite = inviteRow as InvitationRow | null;
  if (!invite || !invite.published) notFound();

  const [{ data: eventRow }, { data: profileRow }] = await Promise.all([
    admin.from("events").select("*").eq("id", invite.event_id).maybeSingle(),
    admin.from("profiles").select("*").eq("user_id", invite.user_id).maybeSingle(),
  ]);
  const event = eventRow as EventRow | null;
  if (!event) notFound();
  const profile = (profileRow as ProfileRow | null) ?? null;

  const config = parseInviteConfig(invite.config);
  const names = coupleFrom(config, event, profile);
  const lang: AppLanguage = profile?.language === "en" ? "en" : "da";

  // Personal link: resolve the guest so the envelope greets them and RSVP
  // prefills. rsvp_token is a unique uuid, scoped here to this event.
  let guestName: string | null = null;
  if (rsvpToken) {
    const { data: g } = await admin
      .from("guests").select("*").eq("event_id", invite.event_id).eq("rsvp_token", rsvpToken).maybeSingle();
    guestName = (g as GuestRow | null)?.name ?? null;
  }

  // Date: config override, else the event's date.
  const dateISO = config.dateISO || event.event_date || "";
  const dateLabel = config.dateLabel
    || (event.event_date
      ? new Date(event.event_date).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })
      : event.date_hint ?? "");

  // Sign the couple photo (private bucket) for this request.
  let photoUrl: string | null = null;
  if (config.photoPath) {
    const { data } = await admin.storage.from("invite-designs").createSignedUrl(config.photoPath, 3600);
    photoUrl = data?.signedUrl ?? null;
  }

  return (
    <PublicInvite
      slug={slug}
      config={config}
      names={names}
      dateISO={dateISO}
      dateLabel={dateLabel}
      photoUrl={photoUrl}
      guestName={guestName}
      rsvpToken={rsvpToken ?? null}
      lang={lang}
    />
  );
}
