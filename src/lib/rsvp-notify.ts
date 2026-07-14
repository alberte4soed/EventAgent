/* Email the couple when a guest RSVPs on the public site. Sent from the
   platform Kalas mailbox to the couple's login email — best-effort: callers
   wrap this in try/catch so a disconnected mailbox never breaks the guest's
   submission. */

import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformAccessToken, getPlatformEmail } from "@/lib/gmail/platform";
import { sendEmail } from "@/lib/gmail/send";
import type { SiteConfig } from "@/kalas/site/config";
import type { WeddingSiteRow } from "@/lib/db/types";

type GuestSummary = {
  name: string;
  rsvp: string;
  email: string | null;
  plus_one: boolean;
  plus_one_name: string | null;
  meal: string | null;
  dietary: string | null;
  notes: string | null;
  rsvp_events: Record<string, boolean>;
  custom_answers: Record<string, string>;
  children_count: number;
};

export async function notifyCoupleOfRsvp({
  site, config, guest,
}: {
  site: WeddingSiteRow;
  config: SiteConfig;
  guest: GuestSummary;
}): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(site.user_id);
  const coupleEmail = data?.user?.email;
  if (!coupleEmail) return;

  const attending = guest.rsvp === "ja";
  const lines: string[] = [
    `${guest.name} har svaret på jeres invitation: ${attending ? "Kommer" : "Kommer ikke"}.`,
    "",
  ];
  if (guest.email) lines.push(`E-mail: ${guest.email}`);
  for (const ev of config.rsvpEvents) {
    const answer = guest.rsvp_events[ev.id];
    if (typeof answer === "boolean") lines.push(`${ev.label}: ${answer ? "Ja" : "Nej"}`);
  }
  if (guest.plus_one) lines.push(`Ledsager: ${guest.plus_one_name || "Ja"}`);
  if (guest.children_count > 0) lines.push(`Børn: ${guest.children_count}`);
  if (guest.meal) lines.push(`Menu: ${guest.meal}`);
  if (guest.dietary) lines.push(`Allergier/hensyn: ${guest.dietary}`);
  for (const q of config.rsvpQuestions) {
    const answer = guest.custom_answers[q.id];
    if (answer) lines.push(`${q.label}: ${answer}`);
  }
  if (guest.notes) lines.push("", `Besked: ${guest.notes}`);
  lines.push("", "Se alle svar i jeres gæsteliste på Kalas.");

  const accessToken = await getPlatformAccessToken();
  const fromEmail = (await getPlatformEmail()) ?? undefined;
  await sendEmail(accessToken, {
    to: coupleEmail,
    subject: `Nyt RSVP-svar: ${guest.name} ${attending ? "kommer" : "kommer ikke"}`,
    body: lines.join("\n"),
    fromName: "Kalas",
    fromEmail,
  });
}
