import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini/client";
import { VENUE_EXTRACTION_PROMPT } from "@/lib/gemini/prompts";
import { venueListSchema, type ExtractedVenue } from "@/lib/gemini/schemas";
import {
  cacheGet,
  cacheSet,
  getDetails,
  isLodging,
  matchPlace,
  resolvePhotoUrls,
  type PlaceResult,
} from "@/lib/places/client";
import type { VendorCategory } from "@/lib/db/types";
import type { OnboardingVenueSuggestion } from "@/app/api/onboarding/venues/route";

/**
 * POST /api/onboarding/vendors
 *
 * The vendor twin of /api/onboarding/venues. Given a category (the hub chip id)
 * and a location, Gemini researches real local vendors for that category and
 * Google Places verifies each pick (photos, ratings, contact). Unlike venues,
 * vendors are local to the wedding — the caller passes the couple's chosen
 * location (from their venue, or set on the venue page).
 */

const TARGET = 9;

/** Hub chip id → backend category + how to search for it. */
interface CatSearch {
  backend: VendorCategory;
  noun: string; // plain-English noun for the web search
  asks: string; // extra per-category facts to report
  lodging?: boolean; // accommodation: keep only real lodging
}

const CAT_SEARCH: Record<string, CatSearch> = {
  overnatning: {
    backend: "accommodation",
    noun: "hotels, inns and B&Bs where wedding guests can stay",
    asks: `- Roughly how far from ${"the wedding area"} they are
- Whether they take group or block bookings for a wedding party
- Price tier and room count if visible`,
    lodging: true,
  },
  fotografi: {
    backend: "photographer",
    noun: "wedding photographers",
    asks: `- Style (documentary, editorial, film…) and portfolio link if visible
- Any pricing hints (package ranges, hours included)`,
  },
  video: {
    backend: "photographer",
    noun: "wedding videographers and filmmakers",
    asks: `- Style (cinematic, documentary…) and showreel link if visible
- Any pricing hints (package ranges, hours included)`,
  },
  blomster: {
    backend: "florist",
    noun: "wedding florists",
    asks: `- Style (wild/garden, classic, minimalist…) and delivery area
- Any pricing hints (bouquet/centerpiece ranges, packages)`,
  },
  catering: {
    backend: "caterer",
    noun: "wedding caterers",
    asks: `- Cuisine styles and whether tastings are offered
- Any pricing hints (per-person menus, minimums)`,
  },
  bar: {
    backend: "other",
    noun: "wedding bar and drinks services (mobile bars, cocktail bartenders)",
    asks: `- What they offer (mobile bar, cocktails, wine service…)
- Any pricing hints (per-person, packages, minimums)`,
  },
  kage: {
    backend: "other",
    noun: "wedding cake bakers and pâtissiers",
    asks: `- Style (classic tiered, naked, modern…) and tasting availability
- Any pricing hints (per-slice, whole-cake ranges)`,
  },
  musik: {
    backend: "musician",
    noun: "wedding musicians, live bands and DJs",
    asks: `- Ensemble/genre (live band, string quartet, DJ, jazz trio…)
- Any pricing hints (set length, package ranges)`,
  },
  beauty: {
    backend: "other",
    noun: "wedding hair and makeup artists",
    asks: `- Services (hair, makeup, on-location, trials) and style
- Any pricing hints (per-person, bridal packages)`,
  },
};

interface Body {
  category?: string;
  location?: string;
  guest_count?: number;
  budget?: string | null;
  query?: string;
  lang?: string;
}

function prompt(args: {
  cat: CatSearch;
  location: string;
  guestCount: number | null;
  budget: string | null;
  query: string;
  lang: string;
}) {
  const langNote = args.lang === "da" ? "Write why_fit in Danish." : "Write why_fit in English.";
  const guestLine = args.guestCount ? ` for a wedding of about ${args.guestCount} guests` : " for a wedding";
  const budgetLine = args.budget ? `Budget context: ${args.budget}.` : "";
  const queryLine = args.query ? `Extra context from the couple: ${args.query}.` : "";
  const asks = args.cat.lodging
    ? args.cat.asks.replace("the wedding area", args.location)
    : args.cat.asks;

  return `Search the web and find up to ${TARGET} REAL ${args.cat.noun} in or near "${args.location}"${guestLine}.
${budgetLine} ${queryLine}

Research each candidate on their own website and recent references — not one listicle.
For EACH one, report in plain text:
- Name
- Short description (what they offer, style/atmosphere)
- One sentence on WHY they fit this wedding specifically (${langNote})
- Address or service area (as precise as you can find)
- Website URL
- Contact email if visible
- Phone number if visible
${asks}

Only include real, currently-operating businesses local to ${args.location} with a verifiable web presence.
Genuinely good, well-reviewed options only — skip filler to reach a count.`;
}

async function research(args: Parameters<typeof prompt>[0]): Promise<ExtractedVenue[]> {
  const ai = getGemini();
  const grounded = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt(args),
    config: { tools: [{ googleSearch: {} }] },
  });
  const notes = grounded.text?.trim();
  if (!notes) return [];

  const extraction = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: VENUE_EXTRACTION_PROMPT(notes),
    config: { responseMimeType: "application/json", responseSchema: venueListSchema },
  });
  const parsed = JSON.parse(extraction.text ?? "{}") as { venues?: ExtractedVenue[] };
  return (parsed.venues ?? []).filter((v) => v.name?.trim()).slice(0, TARGET + 4);
}

function slugId(name: string): string {
  return `gen:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

/** Verify one candidate on Places; keep unmatched vendors (Places gaps) too. */
async function enrich(
  extracted: ExtractedVenue,
  location: string,
  cat: CatSearch
): Promise<OnboardingVenueSuggestion | null> {
  const place = await matchPlace(extracted.name, location);

  // Accommodation must be real lodging with a photo — hotels are well covered.
  if (cat.lodging) {
    if (!place || (place.businessStatus && place.businessStatus !== "OPERATIONAL")) return null;
    if (!isLodging(place)) return null;
  } else if (place?.businessStatus && place.businessStatus !== "OPERATIONAL") {
    return null;
  }

  const details: PlaceResult | null = place ? await getDetails(place.id) : null;
  const resolved = details ?? place;
  const photos = resolved ? await resolvePhotoUrls(resolved.photos, 4) : [];
  if (cat.lodging && !photos[0]) return null;

  return {
    id: place?.id ?? slugId(extracted.name),
    name: resolved?.displayName?.text ?? extracted.name,
    description: extracted.description ?? resolved?.editorialSummary?.text ?? null,
    why_fit: extracted.why_fit ?? null,
    address: resolved?.formattedAddress ?? extracted.address ?? null,
    capacity: extracted.capacity ?? null,
    price_hint: extracted.price_hint ?? null,
    photo: photos[0] ?? null,
    photos,
    rating: resolved?.rating ?? null,
    review_count: resolved?.userRatingCount ?? null,
    place_id: place?.id ?? null,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;
  const catKey = (body.category ?? "").trim();
  const cat = CAT_SEARCH[catKey];
  if (!cat) return Response.json({ error: "unknown category" }, { status: 400 });

  const location = (body.location ?? "").trim();
  if (!location || location.length > 120) {
    return Response.json({ error: "location is required" }, { status: 400 });
  }
  const guestCount =
    typeof body.guest_count === "number" && body.guest_count > 0 ? Math.round(body.guest_count) : null;
  const budget = (body.budget ?? "").trim() || null;
  const query = (body.query ?? "").trim().slice(0, 200);
  const lang = body.lang === "en" ? "en" : "da";

  const key = `onboarding-vendors:v1:${lang}:${catKey}:${location.toLowerCase()}:${guestCount ?? 0}`;
  const cached = await cacheGet<OnboardingVenueSuggestion[]>(key);
  if (cached?.length) return Response.json({ vendors: cached, category: cat.backend });

  let extracted: ExtractedVenue[] = [];
  try {
    extracted = await research({ cat, location, guestCount, budget, query, lang });
  } catch {
    return Response.json({ vendors: [], category: cat.backend });
  }
  if (extracted.length === 0) return Response.json({ vendors: [], category: cat.backend });

  const seenPlaces = new Set<string>();
  const seenNames = new Set<string>();
  const vendors: OnboardingVenueSuggestion[] = [];
  for (const item of extracted) {
    if (vendors.length >= TARGET) break;
    const enriched = await enrich(item, location, cat);
    if (!enriched) continue;
    if (enriched.place_id) {
      if (seenPlaces.has(enriched.place_id)) continue;
      seenPlaces.add(enriched.place_id);
    } else {
      const nameKey = enriched.name.toLowerCase();
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);
    }
    vendors.push(enriched);
  }

  if (vendors.length > 0) await cacheSet(key, vendors);
  return Response.json({ vendors, category: cat.backend });
}
