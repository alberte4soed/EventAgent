// One definition of "does this venue fit", used by the API and by the client
// so a badge and a filter can never disagree.
//
// The rule the whole file turns on: capacity is HARD, everything else is
// SOFT. A venue whose known capacity is below the guest count is useless and
// gets dropped. Price, catering and accommodation are the fields the model
// reports least reliably, so a mismatch there costs rank and earns a badge —
// it never silently hides a venue the couple might have loved. A couple who
// genuinely means "only these" promotes a soft rule to hard via `require`.
//
// Unknown always passes. That is deliberate: filtering on absent data would
// punish venues for our own missing research.

import { budgetFitScore, capacityFitScore, capacityOf, estimatedTotal, type VenueFacts, type VenueSetting } from "./facts";
import { EMPTY_AMENITIES, type PlaceAmenities } from "./amenities";
import { ratingScore } from "../ranking";

export type SoftRule =
  | "budget" | "catering" | "accommodation" | "setting"
  | "ceremony" | "outdoor" | "own_drinks" | "exclusive" | "curfew"
  | "wheelchair" | "parking" | "children" | "dogs" | "rating" | "distance";

/** How the kept list is ordered. Reviews get their own option because they
 *  are the single biggest decision input couples report. */
export type VenueSort = "relevance" | "rating" | "price" | "distance";

export interface VenueFilters {
  /** Hard: the wedding's guest count. */
  min_capacity?: number | null;
  /** Soft: the most the couple wants to spend on the venue, in local currency. */
  budget_max?: number | null;
  catering?: "in_house" | "any";
  accommodation?: "on_site" | "on_site_or_nearby" | "any";
  settings?: VenueSetting[];

  /* Everything below is soft: unknown never rejects, exactly as with budget.
     Capacity remains the only hard rule in this file. */
  ceremony?: "on_site" | "any";
  outdoor?: "required" | "any";
  own_drinks?: "allowed" | "any";
  exclusive?: "sole_use" | "any";
  /** "The party must be able to run until at least 01:00" → 1. */
  min_curfew?: number | null;
  /** Google-reported, so a match here is fact rather than inference. */
  wheelchair?: boolean;
  parking?: boolean;
  children?: boolean;
  dogs?: boolean;
  min_rating?: number | null;
  max_distance_km?: number | null;

  /** Soft rules the couple promoted to hard ("kun inden for budget"). */
  require?: SoftRule[];
}

export type BadgeTone = "good" | "neutral" | "warn";

export interface VenueBadge {
  /** Stable id, for React keys and for styling by kind. */
  id: string;
  text: string;
  tone: BadgeTone;
}

/** Badge wording. Danish is the app's source language; English is the one
 *  alternative. Kept here rather than in the UI dictionary because the text
 *  is interpolated with numbers the filter is the only one that knows. */
const COPY = {
  da: {
    capacityFor: (n: number) => `Plads til ${n} gæster`,
    capacityUnknown: "Kapacitet ukendt",
    priceFrom: (n: string) => `Fra ${n} kr.`,
    priceFromPerGuest: (n: string) => `Fra ${n} kr. pr. gæst`,
    priceUnknown: "Pris ukendt",
    cateringInHouse: "Catering i huset",
    cateringExternal: "Ekstern catering",
    cateringOwnFood: "Egen mad tilladt",
    cateringUnknown: "Catering ukendt",
    stayOnSite: "Overnatning på stedet",
    stayRooms: (n: number) => `${n} værelser på stedet`,
    stayNearby: "Overnatning i nærheden",
    stayNone: "Ingen overnatning",
    stayUnknown: "Overnatning ukendt",
    ceremonyHere: "Vielse på stedet",
    ceremonyOutdoor: "Udendørs vielse",
    ceremonyNone: "Ingen vielse på stedet",
    outdoorGarden: "Have",
    outdoorTerrace: "Terrasse",
    rainPlan: "Plan B ved regn",
    drinksOwn: "Egne drikkevarer tilladt",
    drinksCorkage: "Egne drikkevarer mod gebyr",
    drinksNo: "Kun husets drikkevarer",
    soleUse: "Stedet for jer selv",
    shared: "Deles med andre selskaber",
    curfew: (h: number) => `Festen til kl. ${String(h).padStart(2, "0")}`,
    wheelchair: "Kørestolsvenlig",
    parkingFree: "Gratis parkering",
    parkingPaid: "Betalt parkering",
    parkingStreet: "Gadeparkering",
    children: "Børnevenligt",
    dogs: "Hunde tilladt",
  },
  en: {
    capacityFor: (n: number) => `Seats ${n} guests`,
    capacityUnknown: "Capacity unknown",
    priceFrom: (n: string) => `From ${n} kr.`,
    priceFromPerGuest: (n: string) => `From ${n} kr. per guest`,
    priceUnknown: "Price unknown",
    cateringInHouse: "In-house catering",
    cateringExternal: "External catering",
    cateringOwnFood: "Own food allowed",
    cateringUnknown: "Catering unknown",
    stayOnSite: "Rooms on site",
    stayRooms: (n: number) => `${n} rooms on site`,
    stayNearby: "Lodging nearby",
    stayNone: "No accommodation",
    stayUnknown: "Accommodation unknown",
    ceremonyHere: "Ceremony on site",
    ceremonyOutdoor: "Outdoor ceremony",
    ceremonyNone: "No ceremony on site",
    outdoorGarden: "Garden",
    outdoorTerrace: "Terrace",
    rainPlan: "Wet-weather plan",
    drinksOwn: "Own drinks allowed",
    drinksCorkage: "Own drinks, corkage fee",
    drinksNo: "House drinks only",
    soleUse: "The place to yourselves",
    shared: "Shared with other parties",
    curfew: (h: number) => `Party until ${String(h).padStart(2, "0")}:00`,
    wheelchair: "Wheelchair accessible",
    parkingFree: "Free parking",
    parkingPaid: "Paid parking",
    parkingStreet: "Street parking",
    children: "Good for children",
    dogs: "Dogs allowed",
  },
} as const;

export type BadgeLang = keyof typeof COPY;

export interface VenueVerdict {
  /** False when a hard rule rejected it — the caller drops these. */
  keep: boolean;
  /** Which rule rejected it, for the empty state's explanation. */
  rejectedBy: "capacity" | SoftRule | null;
  /** Higher is better. Only meaningful when `keep`. */
  score: number;
  badges: VenueBadge[];
  /** Soft rules this venue misses — drives the "12 af 48 har overnatning" counts. */
  misses: SoftRule[];
}

export interface Rankable {
  facts: VenueFacts;
  /** Google's answers. Optional so callers with only model data still work. */
  amenities?: PlaceAmenities;
  rating?: number | null;
  review_count?: number | null;
  description?: string | null;
  why_fit?: string | null;
  /** Kilometres from the couple's own area, when it could be worked out. */
  distance_km?: number | null;
}

function isRequired(filters: VenueFilters, rule: SoftRule): boolean {
  return filters.require?.includes(rule) ?? false;
}

/**
 * Is a curfew at least as late as the couple wants?
 *
 * Hours after midnight are small numbers, so a plain `>=` makes 02:00 look
 * earlier than 23:00. Anything before 06:00 is the small hours of the next
 * day and belongs at the end of the night.
 */
function curfewAtLeast(hour: number, wanted: number): boolean {
  const norm = (h: number) => (h < 6 ? h + 24 : h);
  return norm(hour) >= norm(wanted);
}

/**
 * Judge one venue against the couple's filters.
 *
 * Pure and synchronous, so the client can re-run it over an already-fetched
 * list the instant a toggle flips — no refetch for a filter change.
 */
export function evaluateVenue(venue: Rankable, filters: VenueFilters, lang: BadgeLang = "da"): VenueVerdict {
  const copy = COPY[lang];
  const badges: VenueBadge[] = [];
  const misses: SoftRule[] = [];
  const { facts } = venue;
  const guests = filters.min_capacity ?? null;

  /* ── Hard: capacity ───────────────────────────────────────────────── */
  const capacity = capacityOf(facts);
  if (guests && capacity != null && capacity < guests) {
    return { keep: false, rejectedBy: "capacity", score: 0, badges: [], misses: [] };
  }
  if (capacity != null) {
    badges.push({ id: "capacity", text: copy.capacityFor(capacity), tone: "good" });
  } else {
    badges.push({ id: "capacity-unknown", text: copy.capacityUnknown, tone: "neutral" });
  }

  /* ── Soft: budget ─────────────────────────────────────────────────── */
  const total = estimatedTotal(facts, guests);
  if (facts.price_from != null) {
    const perGuest = facts.price_unit === "per_guest";
    const amount = facts.price_from.toLocaleString("da-DK");
    const priceText = perGuest ? copy.priceFromPerGuest(amount) : copy.priceFrom(amount);
    const over = filters.budget_max != null && total != null && total > filters.budget_max;
    if (over) {
      misses.push("budget");
      if (isRequired(filters, "budget")) {
        return { keep: false, rejectedBy: "budget", score: 0, badges: [], misses };
      }
    }
    badges.push({ id: "price", text: priceText, tone: over ? "warn" : "good" });
  } else {
    badges.push({ id: "price-unknown", text: copy.priceUnknown, tone: "neutral" });
  }

  /* ── Soft: catering ───────────────────────────────────────────────── */
  const wantsInHouse = filters.catering === "in_house";
  if (facts.catering === "in_house") {
    badges.push({ id: "catering", text: copy.cateringInHouse, tone: "good" });
  } else if (facts.catering === "external_allowed" || facts.catering === "own_food_allowed") {
    const text = facts.catering === "own_food_allowed" ? copy.cateringOwnFood : copy.cateringExternal;
    if (wantsInHouse) {
      misses.push("catering");
      if (isRequired(filters, "catering")) {
        return { keep: false, rejectedBy: "catering", score: 0, badges: [], misses };
      }
    }
    badges.push({ id: "catering", text, tone: wantsInHouse ? "warn" : "neutral" });
  } else if (wantsInHouse) {
    // Unknown never rejects, but it does not satisfy an explicit want either.
    misses.push("catering");
    badges.push({ id: "catering-unknown", text: copy.cateringUnknown, tone: "neutral" });
  }

  /* ── Soft: accommodation ──────────────────────────────────────────── */
  const wantsStay = filters.accommodation === "on_site" || filters.accommodation === "on_site_or_nearby";
  const nearbyCounts = filters.accommodation !== "on_site";
  if (facts.accommodation === "on_site") {
    badges.push({
      id: "accommodation",
      text: facts.rooms ? copy.stayRooms(facts.rooms) : copy.stayOnSite,
      tone: "good",
    });
  } else if (facts.accommodation === "nearby") {
    const satisfies = nearbyCounts;
    if (wantsStay && !satisfies) misses.push("accommodation");
    badges.push({
      id: "accommodation",
      text: copy.stayNearby,
      tone: wantsStay && !satisfies ? "warn" : "neutral",
    });
    if (wantsStay && !satisfies && isRequired(filters, "accommodation")) {
      return { keep: false, rejectedBy: "accommodation", score: 0, badges: [], misses };
    }
  } else if (facts.accommodation === "none") {
    if (wantsStay) {
      misses.push("accommodation");
      if (isRequired(filters, "accommodation")) {
        return { keep: false, rejectedBy: "accommodation", score: 0, badges: [], misses };
      }
      badges.push({ id: "accommodation", text: copy.stayNone, tone: "warn" });
    }
  } else if (wantsStay) {
    misses.push("accommodation");
    badges.push({ id: "accommodation-unknown", text: copy.stayUnknown, tone: "neutral" });
  }

  /**
   * One soft rule, applied the same way every time: a definite "no" counts as
   * a miss and rejects only when the couple required it; "unknown" counts as a
   * miss but NEVER rejects, because that would punish a venue for our own
   * missing research. Returns a verdict to bail out with, or null to continue.
   */
  const applySoft = (
    rule: SoftRule,
    match: "yes" | "no" | "unknown",
    badge: VenueBadge | null,
  ): VenueVerdict | null => {
    if (badge) badges.push(badge);
    if (match === "yes") return null;
    misses.push(rule);
    if (match === "no" && isRequired(filters, rule)) {
      return { keep: false, rejectedBy: rule, score: 0, badges: [], misses };
    }
    return null;
  };

  /* ── Soft: the ceremony ───────────────────────────────────────────── */
  const hasCeremony = facts.ceremony === "on_site" || facts.ceremony === "outdoor";
  if (hasCeremony) {
    badges.push({
      id: "ceremony",
      text: facts.ceremony === "outdoor" ? copy.ceremonyOutdoor : copy.ceremonyHere,
      tone: "good",
    });
  } else if (filters.ceremony === "on_site") {
    const bail = applySoft(
      "ceremony",
      facts.ceremony === "none" ? "no" : "unknown",
      facts.ceremony === "none"
        ? { id: "ceremony", text: copy.ceremonyNone, tone: "warn" }
        : null,
    );
    if (bail) return bail;
  }

  /* ── Soft: outdoor space and the rain plan ────────────────────────── */
  const hasOutdoor = facts.outdoor === "garden" || facts.outdoor === "terrace";
  if (hasOutdoor) {
    badges.push({
      id: "outdoor",
      text: facts.outdoor === "garden" ? copy.outdoorGarden : copy.outdoorTerrace,
      tone: "good",
    });
    // Only meaningful for a place with something to be rained on.
    if (facts.rain_plan) badges.push({ id: "rain-plan", text: copy.rainPlan, tone: "good" });
  } else if (filters.outdoor === "required") {
    const bail = applySoft("outdoor", facts.outdoor === "none" ? "no" : "unknown", null);
    if (bail) return bail;
  }

  /* ── Soft: own drinks ─────────────────────────────────────────────── */
  if (facts.own_drinks === "allowed") {
    badges.push({ id: "drinks", text: copy.drinksOwn, tone: "good" });
  } else if (facts.own_drinks === "corkage") {
    badges.push({ id: "drinks", text: copy.drinksCorkage, tone: "neutral" });
    if (filters.own_drinks === "allowed") misses.push("own_drinks");
  } else if (filters.own_drinks === "allowed") {
    const bail = applySoft(
      "own_drinks",
      facts.own_drinks === "not_allowed" ? "no" : "unknown",
      facts.own_drinks === "not_allowed"
        ? { id: "drinks", text: copy.drinksNo, tone: "warn" }
        : null,
    );
    if (bail) return bail;
  }

  /* ── Soft: exclusivity ────────────────────────────────────────────── */
  if (facts.exclusive === "sole_use") {
    badges.push({ id: "exclusive", text: copy.soleUse, tone: "good" });
  } else if (filters.exclusive === "sole_use") {
    const bail = applySoft(
      "exclusive",
      facts.exclusive === "shared" ? "no" : "unknown",
      facts.exclusive === "shared"
        ? { id: "exclusive", text: copy.shared, tone: "warn" }
        : null,
    );
    if (bail) return bail;
  }

  /* ── Soft: how late the party may run ─────────────────────────────── */
  if (facts.curfew_hour != null) {
    const lateEnough = filters.min_curfew == null || curfewAtLeast(facts.curfew_hour, filters.min_curfew);
    badges.push({
      id: "curfew",
      text: copy.curfew(facts.curfew_hour),
      tone: lateEnough ? "neutral" : "warn",
    });
    if (!lateEnough) {
      const bail = applySoft("curfew", "no", null);
      if (bail) return bail;
    }
  } else if (filters.min_curfew != null) {
    const bail = applySoft("curfew", "unknown", null);
    if (bail) return bail;
  }

  /* ── Soft: what Google reports ────────────────────────────────────── */
  const amenities = venue.amenities ?? EMPTY_AMENITIES;
  if (amenities.wheelchair) badges.push({ id: "wheelchair", text: copy.wheelchair, tone: "good" });
  else if (filters.wheelchair) {
    const bail = applySoft("wheelchair", amenities.wheelchair === false ? "no" : "unknown", null);
    if (bail) return bail;
  }

  if (amenities.parking) {
    const text = amenities.parking === "free" ? copy.parkingFree
      : amenities.parking === "paid" ? copy.parkingPaid
      : copy.parkingStreet;
    badges.push({ id: "parking", text, tone: amenities.parking === "street" ? "neutral" : "good" });
  } else if (filters.parking) {
    const bail = applySoft("parking", "unknown", null);
    if (bail) return bail;
  }

  if (amenities.children) badges.push({ id: "children", text: copy.children, tone: "good" });
  else if (filters.children) {
    const bail = applySoft("children", amenities.children === false ? "no" : "unknown", null);
    if (bail) return bail;
  }

  if (amenities.dogs) badges.push({ id: "dogs", text: copy.dogs, tone: "good" });
  else if (filters.dogs) {
    const bail = applySoft("dogs", amenities.dogs === false ? "no" : "unknown", null);
    if (bail) return bail;
  }

  /* ── Soft: rating and distance ────────────────────────────────────── */
  if (filters.min_rating != null) {
    const r = venue.rating ?? null;
    const bail = applySoft("rating", r == null ? "unknown" : r >= filters.min_rating ? "yes" : "no", null);
    if (bail) return bail;
  }
  if (filters.max_distance_km != null && venue.distance_km != null && venue.distance_km > filters.max_distance_km) {
    // Distance is measured from coordinates, not read off a website, so a
    // known miss is certain — this is the one new rule that is always hard.
    misses.push("distance");
    return { keep: false, rejectedBy: "distance", score: 0, badges: [], misses };
  }

  /* ── Soft: setting ────────────────────────────────────────────────── */
  const wantedSettings = filters.settings ?? [];
  if (wantedSettings.length > 0 && facts.setting != null && !wantedSettings.includes(facts.setting)) {
    misses.push("setting");
    if (isRequired(filters, "setting")) {
      return { keep: false, rejectedBy: "setting", score: 0, badges: [], misses };
    }
  }

  /* ── Score ────────────────────────────────────────────────────────── */
  let score = ratingScore(venue.rating ?? undefined, venue.review_count ?? undefined);
  score += capacityFitScore(capacity, guests);

  score += budgetFitScore(total, filters.budget_max);

  if (wantsInHouse && facts.catering === "in_house") score += 0.12;
  // The ceremony is the one that reshapes a whole wedding day, so it carries
  // the most weight of the new terms.
  if (filters.ceremony === "on_site" && hasCeremony) score += 0.18;
  if (filters.outdoor === "required" && hasOutdoor) score += 0.12;
  if (filters.own_drinks === "allowed" && facts.own_drinks === "allowed") score += 0.1;
  if (filters.exclusive === "sole_use" && facts.exclusive === "sole_use") score += 0.12;
  if (filters.wheelchair && amenities.wheelchair) score += 0.1;
  if (filters.parking && amenities.parking) score += 0.06;
  if (filters.children && amenities.children) score += 0.06;
  if (filters.dogs && amenities.dogs) score += 0.06;
  if (wantsStay && facts.accommodation === "on_site") score += 0.15;
  else if (wantsStay && facts.accommodation === "nearby" && nearbyCounts) score += 0.07;

  if (wantedSettings.length > 0 && facts.setting != null && wantedSettings.includes(facts.setting)) {
    score += 0.15;
  }

  // A venue with facts on file is more useful than one that is all unknowns,
  // even when the unknowns are what let it through the filters.
  const known = [facts.capacity_seated ?? facts.capacity_standing, facts.price_from].filter((v) => v != null).length;
  score += known * 0.03;

  return { keep: true, rejectedBy: null, score, badges, misses };
}

export interface FilteredVenue<T> {
  venue: T;
  verdict: VenueVerdict;
}

/** Filter, score and sort in one pass. Rejected venues come back separately so
 *  the empty state can say WHICH filter emptied the list. */
export function applyFilters<T extends Rankable>(
  venues: T[],
  filters: VenueFilters,
  lang: BadgeLang = "da",
  sort: VenueSort = "relevance"
): { kept: FilteredVenue<T>[]; rejected: { venue: T; verdict: VenueVerdict }[] } {
  const kept: FilteredVenue<T>[] = [];
  const rejected: { venue: T; verdict: VenueVerdict }[] = [];
  for (const venue of venues) {
    const verdict = evaluateVenue(venue, filters, lang);
    if (verdict.keep) kept.push({ venue, verdict });
    else rejected.push({ venue, verdict });
  }
  // Relevance is the blended score; the others are explicit single keys, with
  // anything missing that key sorted last rather than treated as zero.
  const last = Number.POSITIVE_INFINITY;
  kept.sort((a, b) => {
    switch (sort) {
      case "rating":
        return (b.venue.rating ?? -1) - (a.venue.rating ?? -1);
      case "price": {
        const pa = estimatedTotal(a.venue.facts, filters.min_capacity) ?? last;
        const pb = estimatedTotal(b.venue.facts, filters.min_capacity) ?? last;
        return pa - pb;
      }
      case "distance":
        return (a.venue.distance_km ?? last) - (b.venue.distance_km ?? last);
      default:
        return b.verdict.score - a.verdict.score;
    }
  });
  return { kept, rejected };
}
