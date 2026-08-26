import { randomBytes } from "crypto";

export { isPlausibleEmail } from "./email";

/* The partner invitation Ava sends from the Kalas mailbox.
 *
 * Composition lives here rather than in the route so the wording is testable
 * without a Gmail token, and so the two languages stay side by side where a
 * change to one is an obvious prompt to change the other. */

/** 32 chars of base64url — the whole security of the invite link. */
export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export function inviteUrl(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/+$/, "")}/invite/${token}`;
}

export interface PartnerInviteMessage {
  subject: string;
  body: string;
}

/**
 * What the partner reads. Deliberately promises only what Kalas can currently
 * do: an account of their own, and word that the wedding is being planned.
 * It must not say they will see the same plan — shared access does not exist
 * yet, and an email is a bad place to learn that. When membership lands, this
 * copy is the thing to revisit first.
 *
 * `inviterName` is a first name; `partnerName` may be empty, in which case the
 * greeting stays unaddressed rather than guessing at "Hi partner".
 */
export function buildPartnerInvite({
  inviterName,
  partnerName,
  url,
  lang,
}: {
  inviterName: string;
  partnerName: string;
  url: string;
  lang: "da" | "en";
}): PartnerInviteMessage {
  const who = inviterName.trim() || (lang === "da" ? "Din partner" : "Your partner");
  const greetName = partnerName.trim();

  if (lang === "en") {
    return {
      subject: `${who} has started planning your wedding on Kalas`,
      body: [
        greetName ? `Hi ${greetName},` : "Hi,",
        "",
        `${who} has started planning your wedding in Kalas — one place for the timeline, the budget, the guest list, and me writing to the vendors.`,
        "",
        "Create your own account here:",
        url,
        "",
        "Planning side by side in the same wedding is what we are building next. Until then, having an account means you are ready the moment it lands.",
        "",
        "Warmly,",
        "Ava",
      ].join("\n"),
    };
  }

  return {
    subject: `${who} er gået i gang med jeres bryllup på Kalas`,
    body: [
      greetName ? `Hej ${greetName},` : "Hej,",
      "",
      `${who} er begyndt at planlægge jeres bryllup i Kalas — ét sted til tidslinjen, budgettet, gæstelisten og mig, der skriver til leverandørerne.`,
      "",
      "Opret din egen adgang her:",
      url,
      "",
      "At planlægge side om side i det samme bryllup er det, vi bygger som det næste. Indtil da betyder en konto, at du er klar den dag det lander.",
      "",
      "Kærlig hilsen",
      "Ava",
    ].join("\n"),
  };
}
