// Chip constants + helpers for the wedding-first onboarding flow.
// Shared between the client wizard and the /api/onboarding route.

import type { DatePrecision } from "@/lib/db/types";

export interface GuestBand {
  key: string;
  label: string;
  /** Rough midpoint stored into events.guest_count (null = unknown). */
  count: number | null;
}

export const GUEST_BANDS: readonly GuestBand[] = [
  { key: "just_us", label: "Just us", count: 2 },
  { key: "under_50", label: "Under 50", count: 35 },
  { key: "50_100", label: "50–100", count: 75 },
  { key: "100_150", label: "100–150", count: 125 },
  { key: "150_plus", label: "150+", count: 175 },
  { key: "not_sure", label: "Not sure yet", count: null },
] as const;

export const BUDGET_BANDS = [
  { key: "lean", label: "Keeping it lean", emoji: "🌱" },
  { key: "mid", label: "Mid-range", emoji: "⚖️" },
  { key: "generous", label: "Generous", emoji: "🥂" },
  { key: "sky", label: "Sky's the limit", emoji: "🌟" },
  { key: "private", label: "Rather not say", emoji: "🤫" },
] as const;

export const VIBES = [
  { key: "garden", label: "Garden", emoji: "🌿" },
  { key: "rustic", label: "Rustic barn", emoji: "🌾" },
  { key: "modern", label: "Modern loft", emoji: "🏙️" },
  { key: "ballroom", label: "Classic ballroom", emoji: "💃" },
  { key: "beach", label: "Beach", emoji: "🌊" },
  { key: "castle", label: "Castle / manor", emoji: "🏰" },
  { key: "intimate", label: "Intimate", emoji: "🕯️" },
  { key: "boho", label: "Boho", emoji: "🪶" },
  { key: "destination", label: "Destination", emoji: "✈️" },
] as const;

export interface DateChip {
  key: string;
  label: string; // e.g. "Summer 2026" — also stored as events.date_hint
}

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

/** First month of each season (Winter belongs to the following year's Jan/Feb start). */
const SEASON_START_MONTH: Record<(typeof SEASONS)[number], number> = {
  Spring: 2, // March
  Summer: 5, // June
  Fall: 8, // September
  Winter: 11, // December
};

/** The next `count` season-year chips starting from the upcoming season. */
export function seasonChips(count = 8, from = new Date()): DateChip[] {
  const chips: DateChip[] = [];
  let year = from.getFullYear();
  let seasonIdx = SEASONS.findIndex(
    (s) => SEASON_START_MONTH[s] > from.getMonth()
  );
  if (seasonIdx === -1) {
    seasonIdx = 0;
    year += 1;
  }
  while (chips.length < count) {
    const season = SEASONS[seasonIdx];
    chips.push({ key: `${season.toLowerCase()}_${year}`, label: `${season} ${year}` });
    seasonIdx += 1;
    if (seasonIdx === SEASONS.length) {
      seasonIdx = 0;
      year += 1;
    }
  }
  return chips;
}

export interface OnboardingDate {
  precision: DatePrecision;
  /** ISO date when precision is "exact". */
  iso?: string;
  /** Human hint like "Summer 2027" when precision is "season". */
  hint?: string;
}

/** "Emma & James's wedding" / "Emma's wedding" / "Your wedding". */
export function weddingTitle(name?: string | null, partner?: string | null): string {
  const first = (name ?? "").trim().split(/\s+/)[0];
  const second = (partner ?? "").trim().split(/\s+/)[0];
  if (first && second) return `${first} & ${second}'s wedding`;
  if (first) return `${first}'s wedding`;
  return "Your wedding";
}
