import type { EventRow } from "@/lib/db/types";
import { computeJourney, journeySummary } from "@/lib/journey";

export function agentSystemPrompt(event: EventRow): string {
  const known = [
    event.event_type && `Event type: ${event.event_type}`,
    event.location && `Location: ${event.location}`,
    event.guest_count && `Guest count: ${event.guest_count}`,
    event.event_date && `Date: ${event.event_date}`,
    !event.event_date && event.date_hint && `Rough timing: ${event.date_hint}`,
    event.budget && `Budget: ${event.budget}`,
    event.chosen_venue_id && `Venue: CHOSEN (id ${event.chosen_venue_id})`,
    Object.keys(event.requirements ?? {}).length > 0 &&
      `Other requirements: ${JSON.stringify(event.requirements)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const journey = journeySummary(
    computeJourney(event, { likedVenues: 0, quotesIn: 0 })
  );

  return `You are Ava, the friendly and efficient wedding planner at Kalas.
You help couples plan their wedding end-to-end: understand what they need, find real
venues and local vendors on the internet, and request quotes by email on their behalf.

Current wedding status: ${event.status}
Journey stages: ${journey}
What you know so far:
${known || "(nothing yet)"}

How to behave:
- Be conversational and concise. One question at a time.
- Whenever the user reveals wedding details (type, location, guest count, date,
  budget, special requirements), call update_event_details to save them.
- The journey runs venue-first: the venue fixes the location, and flowers,
  music, photography and catering are all local to it. Gently steer toward the
  current active stage; when a stage completes, suggest the natural next one
  (venue chosen → "want to start on flowers or photography?").
- Before searching venues, you need at minimum a location and a rough guest
  count. Ask for whatever is missing, then call search_venues. Do not invent
  venues yourself — only search_venues produces cards. Results are verified
  against Google Places (ratings, reviews, photos), so trust them over memory.
- For vendors (florist, photographer, musician, caterer), call search_venues
  with the matching category. Only search vendors once the venue is chosen or
  the user insists — vendors depend on the final location.
- When the user clearly commits to one venue ("we're going with X", "we booked
  X"), call mark_venue_chosen with that venue's id (or booked_externally if it
  happened outside the app). This unlocks the vendors and invites stages.
- After search_venues succeeds, tell the user how many options you found and
  that they can swipe through them (right/yes to shortlist, left/no to skip).
  Do NOT list the venues in text — the UI shows them as cards.
- When the user says they finished swiping (or asks for the email), first call
  find_venue_email for each liked venue that is missing a contact email, then
  call propose_email_draft with a warm, professional quote-request email.
  The template MUST use the placeholder {{venue_name}} where the venue's name
  belongs, and should mention wedding type, date (if known), guest count, and ask
  for pricing, availability and what's included. Sign off with the user's name
  if known, otherwise leave a "{{sender_name}}" placeholder out and end neutrally.
- After proposing a draft, ask the user to review it. If they request changes,
  call propose_email_draft again with a revised version.
- Never claim an email has been sent — sending happens when the user approves
  the draft in the UI.
- For invitations, use draft_invite_text once venue and date are known; the
  user reviews the wording card and orders prints from the invites page.`;
}

/** What to research per vendor category, beyond the shared basics. */
const CATEGORY_BRIEFS: Record<string, { noun: string; asks: string }> = {
  venue: {
    noun: "wedding venues",
    asks: `- Capacity (seated/standing if available)
- Any pricing hints (rental fee, per-person menus, minimum spend)`,
  },
  florist: {
    noun: "wedding florists",
    asks: `- Style (wild/garden, classic, minimalist…) and delivery area
- Any pricing hints (bouquet/centerpiece ranges, packages)`,
  },
  photographer: {
    noun: "wedding photographers and videographers",
    asks: `- Style (documentary, editorial, film…) and portfolio link if visible
- Any pricing hints (package ranges, hours included)`,
  },
  musician: {
    noun: "wedding musicians, bands and DJs",
    asks: `- Ensemble/genre (live band, string quartet, DJ, jazz trio…)
- Any pricing hints (set length, package ranges)`,
  },
  caterer: {
    noun: "wedding caterers",
    asks: `- Cuisine styles and whether tastings are offered
- Any pricing hints (per-person menus, minimums)`,
  },
};

export const VENDOR_SEARCH_PROMPT = (args: {
  category?: string | null;
  query: string;
  location: string;
  guestCount?: number | null;
  eventType?: string | null;
  vibes?: string[] | null;
  budget?: string | null;
}) => {
  const brief = CATEGORY_BRIEFS[args.category ?? "venue"] ?? CATEGORY_BRIEFS.venue;
  return `Search the web and find 8 to 12 REAL ${brief.noun} in or near ${args.location} for ${
    args.eventType ?? "a wedding"
  }${args.guestCount ? ` with about ${args.guestCount} guests` : ""}.
${args.vibes?.length ? `The couple's style: ${args.vibes.join(", ")}.` : ""}
${args.budget ? `Budget context: ${args.budget}.` : ""}
Additional context from the user: ${args.query}

Research each candidate properly — look at their own website, recent mentions,
and wedding directories — rather than copying one listicle.

For EACH one report, in plain text:
- Name
- Short description (what kind of place/business it is, atmosphere)
- One sentence on WHY it fits this couple specifically (style, size, budget)
- Address (as precise as you can find)
- Website URL
- Contact email if visible anywhere
- Phone number if visible
${brief.asks}

Only include businesses that actually exist with verifiable web presence.
Genuinely great, well-reviewed options only — skip filler to reach a count.`;
};

/** @deprecated kept for callers that predate vendor categories. */
export const VENUE_SEARCH_PROMPT = (args: {
  query: string;
  location: string;
  guestCount?: number | null;
  eventType?: string | null;
}) => VENDOR_SEARCH_PROMPT(args);

export const VENUE_EXTRACTION_PROMPT = (groundedText: string) =>
  `Extract the venues/vendors from the research notes below into structured JSON.
Only include real businesses with at least a name. Use null for unknown fields.
Put the "why it fits this couple" sentence into why_fit when present.
Do not fabricate emails, phone numbers or URLs that are not in the notes.

Research notes:
${groundedText}`;

export const FIND_EMAIL_PROMPT = (venueName: string, website?: string | null) =>
  `Search the web for the booking/contact EMAIL ADDRESS of the venue "${venueName}"${
    website ? ` (website: ${website})` : ""
  }. Look at their official website contact page if possible.
Reply with ONLY the email address, nothing else. If you cannot find a real
email address for this exact venue, reply with exactly: NOT_FOUND`;

export const COMPOSE_OUTREACH_PROMPT = (args: {
  template: string;
  venueName: string;
  category: string;
  venueDescription?: string | null;
  whyFit?: string | null;
  reviewSnippet?: string | null;
  eventFacts: string;
}) => `Write ONE individual outreach email to "${args.venueName}" (a wedding ${args.category}).
Use the master draft below as the brief — keep its asks, facts and sign-off,
but write a genuinely personal email for this recipient, not a mail-merge.
${args.venueDescription ? `About them: ${args.venueDescription}` : ""}
${args.whyFit ? `Why the couple is interested: ${args.whyFit}` : ""}
${args.reviewSnippet ? `A reviewer said: "${args.reviewSnippet}" — you may reference this naturally (at most once).` : ""}
Wedding facts you may use: ${args.eventFacts}

Rules: plain text only, no subject line, no placeholders, 90-160 words,
warm and professional, one specific reference to this recipient maximum
(no flattery pile-up). Reply with ONLY the email body.

Master draft:
${args.template}`;

export const REPLY_PROPOSAL_PROMPT = (args: {
  venueName: string;
  category: string;
  coupleName: string;
  eventFacts: string;
  ourLastMessage: string;
  vendorReply: string;
  quoteSummary?: string | null;
}) => `You are Ava, the wedding planner at Kalas, coordinating vendors on behalf
of ${args.coupleName}. The ${args.category} "${args.venueName}" just replied to
your outreach. Draft the next email in the thread.

Wedding facts: ${args.eventFacts}
Your previous message to them:
${args.ourLastMessage}

Their reply:
${args.vendorReply}
${args.quoteSummary ? `\nExtracted quote summary: ${args.quoteSummary}` : ""}

Guidelines:
- If they quoted: acknowledge it and ask the natural next question (holding
  the date, what exactly is included, viewing/tasting availability).
- If they asked for information: answer from the wedding facts; if a fact is
  genuinely unknown, say the couple will confirm it.
- If they declined or are unavailable: thank them briefly and close warmly.
- Plain text, 60-130 words, no subject line, sign off as
  "Ava, on behalf of ${args.coupleName}".
Reply with ONLY the email body.`;

export const PERSONALIZE_PROMPT = (args: {
  template: string;
  venueName: string;
  venueDescription?: string | null;
}) => `Personalize the email template below for the venue "${args.venueName}".
${args.venueDescription ? `About the venue: ${args.venueDescription}` : ""}
Replace {{venue_name}} with the venue's name and adjust the greeting naturally.
You may add at most one short sentence referencing the venue specifically.
Keep everything else (tone, asks, sign-off) identical. Reply with ONLY the
final email body, no subject line, no commentary.

Template:
${args.template}`;

/** Palette key → concrete colour description for image generation. */
const PALETTE_DESCRIPTIONS: Record<string, string> = {
  cream_sage: "soft cream background with sage green and olive accents",
  ivory_gold: "ivory background with warm gold foil accents",
  white_ink: "crisp white background with black ink lettering",
  blush: "blush pink and dusty rose tones",
  forest: "deep forest green with ivory lettering",
};

export const INVITE_DESIGN_PROMPT = (args: {
  style: string;
  palette: string;
  wording: string;
  vibes: string[];
}) => {
  const palette = PALETTE_DESCRIPTIONS[args.palette] ?? args.palette;
  return `Design the front of a printed wedding invitation card.
Style: ${args.style}. Colour palette: ${palette}.${
    args.vibes.length ? ` Overall wedding vibe: ${args.vibes.join(", ")}.` : ""
  }

Render this exact wording on the card, beautifully typeset and correctly spelled:
"""
${args.wording}
"""

Requirements: flat front-of-card artwork only (portrait orientation, like a
5×7 invitation); elegant, readable typography; tasteful decorative elements
that match the style and palette. Do NOT show a mockup, hands, a table, an
envelope, or any 3D scene — just the flat card face filling the frame.`;
};

export const QUOTE_EXTRACTION_PROMPT = (args: {
  venueName: string;
  replyBody: string;
}) => `A venue ("${args.venueName}") replied to our quote request for a wedding.
Extract the commercial details from their reply below.

Reply:
${args.replyBody}`;
