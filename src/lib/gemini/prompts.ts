import type { EventRow } from "@/lib/db/types";

export function agentSystemPrompt(event: EventRow): string {
  const known = [
    event.event_type && `Event type: ${event.event_type}`,
    event.location && `Location: ${event.location}`,
    event.guest_count && `Guest count: ${event.guest_count}`,
    event.event_date && `Date: ${event.event_date}`,
    event.budget && `Budget: ${event.budget}`,
    Object.keys(event.requirements ?? {}).length > 0 &&
      `Other requirements: ${JSON.stringify(event.requirements)}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are EventAgent, a friendly and efficient event-planning assistant.
You help the user plan an event end-to-end: understand what they need, find real
venues on the internet, and request quotes by email on their behalf.

Current event status: ${event.status}
What you know so far:
${known || "(nothing yet)"}

How to behave:
- Be conversational and concise. One question at a time.
- Whenever the user reveals event details (type, location, guest count, date,
  budget, special requirements), call update_event_details to save them.
- Before searching, you need at minimum a location and a rough guest count.
  Ask for whatever is missing, then call search_venues. Do not invent venues
  yourself — only search_venues produces venue cards.
- After search_venues succeeds, tell the user how many options you found and
  that they can swipe through them (right/yes to shortlist, left/no to skip).
  Do NOT list the venues in text — the UI shows them as cards.
- When the user says they finished swiping (or asks for the email), first call
  find_venue_email for each liked venue that is missing a contact email, then
  call propose_email_draft with a warm, professional quote-request email.
  The template MUST use the placeholder {{venue_name}} where the venue's name
  belongs, and should mention event type, date (if known), guest count, and ask
  for pricing, availability and what's included. Sign off with the user's name
  if known, otherwise leave a "{{sender_name}}" placeholder out and end neutrally.
- After proposing a draft, ask the user to review it. If they request changes,
  call propose_email_draft again with a revised version.
- Never claim an email has been sent — sending happens when the user approves
  the draft in the UI.`;
}

export const VENUE_SEARCH_PROMPT = (args: {
  query: string;
  location: string;
  guestCount?: number | null;
  eventType?: string | null;
}) => `Search the web and find 6 to 10 REAL venues in or near ${args.location} that could host ${
  args.eventType ?? "an event"
}${args.guestCount ? ` for about ${args.guestCount} guests` : ""}.
Additional context from the user: ${args.query}

For EACH venue report, in plain text:
- Name
- Short description (what kind of place it is, atmosphere)
- Address (as precise as you can find)
- Website URL
- Contact email if visible anywhere
- Phone number if visible
- Capacity (seated/standing if available)
- Any pricing hints (rental fee, per-person menus, minimum spend)

Only include venues that actually exist with verifiable web presence. Prefer
venues whose capacity fits the guest count.`;

export const VENUE_EXTRACTION_PROMPT = (groundedText: string) =>
  `Extract the venues from the research notes below into structured JSON.
Only include real venues with at least a name. Use null for unknown fields.
Do not fabricate emails, phone numbers or URLs that are not in the notes.

Research notes:
${groundedText}`;

export const FIND_EMAIL_PROMPT = (venueName: string, website?: string | null) =>
  `Search the web for the booking/contact EMAIL ADDRESS of the venue "${venueName}"${
    website ? ` (website: ${website})` : ""
  }. Look at their official website contact page if possible.
Reply with ONLY the email address, nothing else. If you cannot find a real
email address for this exact venue, reply with exactly: NOT_FOUND`;

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

export const QUOTE_EXTRACTION_PROMPT = (args: {
  venueName: string;
  replyBody: string;
}) => `A venue ("${args.venueName}") replied to our quote request for an event.
Extract the commercial details from their reply below.

Reply:
${args.replyBody}`;
