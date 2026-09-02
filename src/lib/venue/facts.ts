// The structured facts a venue search filters on. Everything here is pure —
// no DB, no network — so the API route, the agent and the client can all
// share one definition of "does this place seat 70 people".
//
// Why this file exists: `venues.capacity` and `venues.price_hint` are free
// text ("Op til 140 gæster", "62.000 kr"). Prose cannot be filtered, so the
// couple's guest count and budget had no effect on results at all. The model
// now returns these fields structured, and the parsers below salvage numbers
// from the legacy text for rows written before that.

/** Aesthetic buckets. Doubles as the prompt's variety brief and the UI chips,
 *  so the two can never drift apart. */
export const VENUE_SETTINGS = [
  "barn",
  "castle",
  "manor",
  "garden",
  "coastal",
  "vineyard",
  "hotel",
  "industrial",
  "museum",
  "lakeside",
  "chapel",
  "restaurant",
  "tented",
] as const;

export type VenueSetting = (typeof VENUE_SETTINGS)[number];

/** Where the food comes from. `unknown` is a real answer, not a failure — the
 *  filter keeps unknowns and badges them rather than hiding a good venue. */
export type Catering = "in_house" | "external_allowed" | "own_food_allowed" | "unknown";

/** Whether guests can sleep there. `nearby` means the venue itself points at
 *  lodging within walking/short-drive distance — the couple asked for that
 *  distinction explicitly. */
export type Accommodation = "on_site" | "nearby" | "none" | "unknown";

export type PriceUnit = "total" | "per_guest";

/** Can you actually be married here? A legal question in Denmark, where a
 *  venue must be an approved location for a civil ceremony. */
export type Ceremony = "on_site" | "outdoor" | "none" | "unknown";

/** Outdoor space — the "Med have" facet every Danish venue site carries. */
export type Outdoor = "garden" | "terrace" | "none" | "unknown";

/** Whether the couple may bring their own drink. One of the three questions
 *  Danish venue checklists put in their top ten, and a large cost lever. */
export type OwnDrinks = "allowed" | "corkage" | "not_allowed" | "unknown";

/** Do you have the place to yourselves, or is another party in the next room? */
export type Exclusivity = "sole_use" | "shared" | "unknown";

export interface VenueFacts {
  /** Seated dinner — the number that decides a wedding. */
  capacity_seated: number | null;
  /** Standing reception, always >= seated where both are known. */
  capacity_standing: number | null;
  /** Lowest published price, in the venue's local currency. */
  price_from: number | null;
  price_unit: PriceUnit | null;
  catering: Catering;
  accommodation: Accommodation;
  /** Rooms/beds on site, when accommodation is "on_site". */
  rooms: number | null;
  setting: VenueSetting | null;
  ceremony: Ceremony;
  outdoor: Outdoor;
  /** An indoor alternative for an outdoor ceremony. More than one couple in
   *  three picks a venue on its weather contingency. */
  rain_plan: boolean | null;
  own_drinks: OwnDrinks;
  exclusive: Exclusivity;
  /** When the party must stop, on a 24h clock — 1 means 01:00. Some Danish
   *  venues stop at 03:00 and others charge by the extra hour, so this is a
   *  real decision input and appears on no international venue site. */
  curfew_hour: number | null;
}

export const EMPTY_FACTS: VenueFacts = {
  capacity_seated: null,
  capacity_standing: null,
  price_from: null,
  price_unit: null,
  catering: "unknown",
  accommodation: "unknown",
  rooms: null,
  setting: null,
  ceremony: "unknown",
  outdoor: "unknown",
  rain_plan: null,
  own_drinks: "unknown",
  exclusive: "unknown",
  curfew_hour: null,
};

/* ──────────────────────────────────────────────────────────────────────────
   Parsing free text
   ────────────────────────────────────────────────────────────────────────── */

// A capacity below this is a private dining room, not a wedding venue; above
// it the model has misread a floor area or a postcode.
const MIN_CAPACITY = 2;
const MAX_CAPACITY = 5000;

// Venue prices below this are noise (a parking fee, a per-hour add-on); above
// it the model has picked up a phone number or an address.
const MIN_PRICE = 50;
const MAX_PRICE = 100_000_000;

/**
 * Danish writes thousands with a period and decimals with a comma —
 * "62.000,50 kr". Left alone, a naive \d+ scan reads "62.000" as 62 and 0.
 * Collapses grouped thousands into a plain integer and drops the decimal
 * tail, then hands back a string safe to scan for numbers.
 */
function normalizeNumerals(text: string): string {
  return text
    // 1.200 / 1.200.000 → 1200 / 1200000 (only when every group is 3 digits)
    .replace(/(\d{1,3})(?:[. \s](\d{3}))+(?![\d.])/g, (match) => match.replace(/[. \s]/g, ""))
    // 1,200 → 1200 (English grouping, since the model sometimes answers in it)
    .replace(/(\d{1,3})(?:,(\d{3}))+(?![\d,])/g, (match) => match.replace(/,/g, ""))
    // 850,50 → 850 — a decimal tail never changes a filter decision
    .replace(/(\d),(\d{1,2})\b/g, "$1");
}

function numbersIn(text: string): number[] {
  return (normalizeNumerals(text).match(/\d+/g) ?? []).map(Number).filter(Number.isFinite);
}

/**
 * Largest plausible guest count in a capacity string.
 *
 * The maximum is what matters: "80-200 gæster" means the room holds 200, and
 * "Op til 140" means 140. Taking the minimum would hide venues that fit.
 */
export function parseCapacity(text: string | null | undefined): number | null {
  if (!text) return null;
  const candidates = numbersIn(text).filter((n) => n >= MIN_CAPACITY && n <= MAX_CAPACITY);
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

const PER_GUEST_MARKERS = [
  "pr. kuvert", "pr kuvert", "per kuvert", "pr. couvert",
  "pr. person", "pr person", "per person", "pr. gæst", "pr gæst", "per gæst",
  "per guest", "per head", "/person", "/gæst",
];

// "pp" needs word boundaries — as a bare substring it fires on "supper",
// "upper", "opportunity".
const PER_GUEST_ABBREV = /\bp\.?\s?p\.?\b/;

/** "per guest" or "for the whole day"? Defaults to `total`, which is how a
 *  venue hire fee is normally quoted. */
export function parsePriceUnit(text: string | null | undefined): PriceUnit | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const perGuest = PER_GUEST_MARKERS.some((m) => lower.includes(m)) || PER_GUEST_ABBREV.test(lower);
  return perGuest ? "per_guest" : "total";
}

/**
 * Lowest plausible price in a price string.
 *
 * The minimum is what matters here — "50.000–90.000 kr" is a venue you can
 * have for 50.000, and the budget filter should compare against the entry
 * price, not the ceiling. Four-digit years are dropped: "sæson 2026" is not
 * a price, and no real venue quotes exactly a year.
 */
export function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const candidates = numbersIn(text).filter(
    (n) => n >= MIN_PRICE && n <= MAX_PRICE && !(n >= 1900 && n <= 2100)
  );
  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

/* ──────────────────────────────────────────────────────────────────────────
   Coercing model output
   ────────────────────────────────────────────────────────────────────────── */

function coerceInt(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return rounded >= min && rounded <= max ? rounded : null;
}

function coerceBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function coerceEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  const needle = value.trim().toLowerCase();
  return allowed.find((a) => a === needle) ?? null;
}

const CATERING_VALUES: readonly Catering[] = ["in_house", "external_allowed", "own_food_allowed", "unknown"];
const ACCOMMODATION_VALUES: readonly Accommodation[] = ["on_site", "nearby", "none", "unknown"];
const PRICE_UNITS: readonly PriceUnit[] = ["total", "per_guest"];
const CEREMONY_VALUES: readonly Ceremony[] = ["on_site", "outdoor", "none", "unknown"];
const OUTDOOR_VALUES: readonly Outdoor[] = ["garden", "terrace", "none", "unknown"];
const OWN_DRINKS_VALUES: readonly OwnDrinks[] = ["allowed", "corkage", "not_allowed", "unknown"];
const EXCLUSIVITY_VALUES: readonly Exclusivity[] = ["sole_use", "shared", "unknown"];

/** What the model is asked to return, before validation. */
export interface RawFacts {
  capacity_seated?: unknown;
  capacity_standing?: unknown;
  price_from?: unknown;
  price_unit?: unknown;
  catering?: unknown;
  accommodation?: unknown;
  rooms?: unknown;
  setting?: unknown;
  ceremony?: unknown;
  outdoor?: unknown;
  rain_plan?: unknown;
  own_drinks?: unknown;
  exclusive?: unknown;
  curfew_hour?: unknown;
}

/**
 * Turns whatever the model said into a `VenueFacts`, falling back to the
 * legacy free-text fields when a structured value is missing or nonsense.
 *
 * Everything unrecognised becomes null/"unknown" rather than a guess — an
 * invented capacity would silently hide venues, which is the one failure
 * mode worse than showing too many.
 */
export function normalizeFacts(
  raw: RawFacts | null | undefined,
  legacy: { capacity?: string | null; price_hint?: string | null } = {}
): VenueFacts {
  const seated = coerceInt(raw?.capacity_seated, MIN_CAPACITY, MAX_CAPACITY);
  const standing = coerceInt(raw?.capacity_standing, MIN_CAPACITY, MAX_CAPACITY);
  const fromText = parseCapacity(legacy.capacity);

  const price = coerceInt(raw?.price_from, MIN_PRICE, MAX_PRICE) ?? parsePrice(legacy.price_hint);
  const unit = coerceEnum(raw?.price_unit, PRICE_UNITS) ?? (price != null ? parsePriceUnit(legacy.price_hint) : null);

  const accommodation = coerceEnum(raw?.accommodation, ACCOMMODATION_VALUES) ?? "unknown";
  const rooms = coerceInt(raw?.rooms, 1, 2000);
  const outdoor = coerceEnum(raw?.outdoor, OUTDOOR_VALUES) ?? "unknown";

  return {
    // The legacy text only fills a gap. It is ambiguous about seated vs
    // standing, so it is used only when the model gave neither — otherwise
    // capacityOf() already falls back to whichever number we do have.
    capacity_seated: seated ?? (standing == null ? fromText : null),
    capacity_standing: standing,
    price_from: price,
    price_unit: price == null ? null : unit,
    catering: coerceEnum(raw?.catering, CATERING_VALUES) ?? "unknown",
    accommodation,
    // Rooms without on-site accommodation is a contradiction; trust the count.
    rooms: accommodation === "none" ? null : rooms,
    setting: coerceEnum(raw?.setting, VENUE_SETTINGS),
    ceremony: coerceEnum(raw?.ceremony, CEREMONY_VALUES) ?? "unknown",
    outdoor,
    // A rain plan only means anything for a place that has an outdoor option.
    rain_plan: outdoor === "none" ? null : coerceBool(raw?.rain_plan),
    own_drinks: coerceEnum(raw?.own_drinks, OWN_DRINKS_VALUES) ?? "unknown",
    exclusive: coerceEnum(raw?.exclusive, EXCLUSIVITY_VALUES) ?? "unknown",
    // A party ending at 05:00 is a misread menu price, not a curfew.
    curfew_hour: coerceInt(raw?.curfew_hour, 0, 23),
  };
}

/** The headline number: what the venue seats, or failing that, what it holds. */
export function capacityOf(facts: Pick<VenueFacts, "capacity_seated" | "capacity_standing">): number | null {
  return facts.capacity_seated ?? facts.capacity_standing ?? null;
}

/** Total spend at this venue for a given guest count, so a per-guest price and
 *  a flat hire fee can be compared against the same budget. */
export function estimatedTotal(
  facts: Pick<VenueFacts, "price_from" | "price_unit">,
  guestCount: number | null | undefined
): number | null {
  if (facts.price_from == null) return null;
  if (facts.price_unit !== "per_guest") return facts.price_from;
  if (!guestCount || guestCount <= 0) return null;
  return facts.price_from * guestCount;
}

/* ──────────────────────────────────────────────────────────────────────────
   Fit curves
   Shared by the explore page's filter and the agent's ranking, so the two
   rank a venue the same way.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * How well a capacity fits a guest count.
 *
 * Comfortably above beats exactly at: a room that seats 72 for a 70-guest
 * wedding is technically a fit and practically a squeeze, and a room for 400
 * is a cavern. Unknown scores zero — neither rewarded nor punished.
 */
export function capacityFitScore(capacity: number | null, guests: number | null | undefined): number {
  if (!guests || guests <= 0 || capacity == null) return 0;
  const ratio = capacity / guests;
  if (ratio < 1) return -0.5; // too small, a hard filter usually caught it first
  if (ratio <= 1.1) return 0.08; // a squeeze
  if (ratio <= 2) return 0.25; // the sweet spot
  if (ratio <= 3.5) return 0.12; // roomy
  return 0.04; // a cavern
}

/** How a price sits against a budget. Well inside is worth more than
 *  scraping it; over budget stings in proportion. */
export function budgetFitScore(total: number | null, budget: number | null | undefined): number {
  if (!budget || budget <= 0 || total == null) return 0;
  const ratio = total / budget;
  if (ratio <= 0.75) return 0.2;
  if (ratio <= 1) return 0.12;
  if (ratio <= 1.25) return -0.15;
  return -0.35;
}
