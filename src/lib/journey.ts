// The wedding journey: derived stages, not stored state.
// events.status remains the venue-outreach pipeline; journey stages are
// computed from facts (location, guest_count, chosen_venue_id, date) plus
// manual overrides in events.journey_overrides (e.g. {"venue": "complete"}
// when the couple booked a venue outside Kalas).

import type { EventRow, VendorCategory } from "@/lib/db/types";

export type JourneyStageKey = "basics" | "venue" | "vendors" | "invites";
export type StageStatus = "complete" | "active" | "locked";

export interface JourneyStage {
  key: JourneyStageKey;
  label: string;
  emoji: string;
  status: StageStatus;
  /** Short line under the label: progress when active, unlock rule when locked. */
  hint: string;
  /** Where the stage's CTA goes (workspace deep link etc.). */
  href: string;
  cta: string;
}

export interface JourneyExtras {
  likedVenues: number;
  quotesIn: number;
  inviteOrderStatus?: string | null;
}

/** Display metadata for vendor categories (badges, hub chips, prompts). */
export const CATEGORY_META: Record<
  Exclude<VendorCategory, "venue">,
  { label: string; emoji: string; prompt: string }
> = {
  florist: {
    label: "Florist",
    emoji: "🌸",
    prompt: "Find wedding florists near our venue.",
  },
  photographer: {
    label: "Photographer",
    emoji: "📷",
    prompt: "Find wedding photographers and videographers near our venue.",
  },
  musician: {
    label: "Music",
    emoji: "🎶",
    prompt: "Find wedding bands, musicians and DJs near our venue.",
  },
  caterer: {
    label: "Catering",
    emoji: "🍽️",
    prompt: "Find wedding caterers near our venue.",
  },
  planner: {
    label: "Planner",
    emoji: "📋",
    prompt: "Find wedding planners near our venue.",
  },
  other: {
    label: "Vendor",
    emoji: "✨",
    prompt: "Find wedding vendors near our venue.",
  },
};

/** The four launch vendor categories shown on the hub. */
export const HUB_VENDOR_CATEGORIES = [
  "florist",
  "photographer",
  "musician",
  "caterer",
] as const;

export function venueChosen(event: EventRow): boolean {
  return (
    Boolean(event.chosen_venue_id) || event.journey_overrides?.venue === "complete"
  );
}

export function dateKnown(event: EventRow): boolean {
  return Boolean(event.event_date) || event.date_precision !== "undecided";
}

export function computeJourney(event: EventRow, extras: JourneyExtras): JourneyStage[] {
  const basicsComplete = Boolean(event.location && event.guest_count);
  const venueComplete = venueChosen(event);
  const vendorsUnlocked = venueComplete;
  const invitesUnlocked = venueComplete && dateKnown(event);
  const vendorsComplete = event.journey_overrides?.vendors === "complete";
  const invitesComplete =
    event.journey_overrides?.invites === "complete" ||
    ["paid", "submitted_to_print", "shipped"].includes(extras.inviteOrderStatus ?? "");

  const workspace = `/events/${event.id}`;

  const stages: JourneyStage[] = [
    {
      key: "basics",
      label: "The basics",
      emoji: "📝",
      status: basicsComplete ? "complete" : "active",
      hint: basicsComplete
        ? [event.location, event.guest_count && `${event.guest_count} guests`]
            .filter(Boolean)
            .join(" · ")
        : "Location and a rough guest count unlock the venue hunt",
      href: workspace,
      cta: basicsComplete ? "Review details" : "Fill in the basics",
    },
    {
      key: "venue",
      label: "Find the venue",
      emoji: "🏛️",
      status: venueComplete ? "complete" : basicsComplete ? "active" : "locked",
      hint: venueComplete
        ? "Venue chosen 🎉"
        : !basicsComplete
          ? "Unlocks once the basics are in"
          : extras.quotesIn > 0
            ? `${extras.quotesIn} quote${extras.quotesIn === 1 ? "" : "s"} in — compare and choose`
            : extras.likedVenues > 0
              ? `${extras.likedVenues} venue${extras.likedVenues === 1 ? "" : "s"} shortlisted`
              : "Everything local flows from where you say 'I do'",
      href: workspace,
      cta: venueComplete
        ? "See your venue"
        : extras.likedVenues > 0
          ? "Continue the hunt"
          : "Start the venue hunt",
    },
    {
      key: "vendors",
      label: "Book the vendors",
      emoji: "💐",
      status: vendorsComplete ? "complete" : vendorsUnlocked ? "active" : "locked",
      hint: vendorsUnlocked
        ? "Flowers, photos, music and catering — all local to your venue"
        : "Unlocks when you've chosen a venue",
      href: workspace,
      cta: "Find vendors",
    },
    {
      key: "invites",
      label: "Send the invites",
      emoji: "💌",
      status: invitesComplete ? "complete" : invitesUnlocked ? "active" : "locked",
      hint: invitesComplete
        ? "Invites ordered"
        : invitesUnlocked
          ? "Design, word and order your invitations"
          : venueComplete
            ? "Unlocks when the date is set"
            : "Unlocks after venue and date",
      href: `/events/${event.id}/invites`,
      cta: "Plan the invites",
    },
  ];

  // Only one active stage at a time: the first non-complete, unlocked one.
  let seenActive = false;
  for (const s of stages) {
    if (s.status === "active") {
      if (seenActive) s.status = "locked";
      else seenActive = true;
    }
  }
  // ...but vendors + invites can run in parallel once both are unlocked.
  if (venueComplete) {
    for (const s of stages) {
      if (s.key === "vendors" && !vendorsComplete) s.status = "active";
      if (s.key === "invites" && invitesUnlocked && !invitesComplete)
        s.status = "active";
    }
  }

  return stages;
}

/** One-line journey summary for the agent's system prompt. */
export function journeySummary(stages: JourneyStage[]): string {
  return stages
    .map((s) => `${s.label}: ${s.status}${s.status === "locked" ? ` (${s.hint})` : ""}`)
    .join("; ");
}
