import { NextRequest } from "next/server";
import { Type, type Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini/client";
import { VENUE_EXTRACTION_PROMPT } from "@/lib/gemini/prompts";
import { venueListSchema, type ExtractedVenue } from "@/lib/gemini/schemas";
import {
  cacheGet,
  cacheSet,
  getDetails,
  matchPlace,
  resolvePhotoUrls,
  type PlaceResult,
} from "@/lib/places/client";

/**
 * POST /api/onboarding/venues
 *
 * Gemini researches real wedding venues for the couple's destination and guest
 * count; Google Places verifies each pick and supplies photos + ratings.
 */

export interface OnboardingVenueSuggestion {
  id: string;
  name: string;
  description: string | null;
  why_fit: string | null;
  address: string | null;
  capacity: string | null;
  price_hint: string | null;
  photo: string | null;
  photos: string[];
  rating: number | null;
  review_count: number | null;
  place_id: string | null;
}

interface Body {
  destination?: string;
  guest_count?: number;
  loved_destinations?: string[];
  budget?: string | null;
  lang?: string;
}

const TARGET = 10;

/** Shared curation brief — couples swipe to teach Ava their taste; breadth beats similarity. */
const DIVERSITY_BRIEF = `
The couple will SWIPE these cards to reveal their taste — your job is MAXIMUM variety, not ten versions of the same dreamy estate.
Across exactly ${TARGET} venues, spread widely across vibes and settings. Aim for at least 8 clearly different aesthetics, e.g.:
rustic barn / farm, modern minimalist loft, grand historic palace or manor, coastal or beach, garden or orangerie,
industrial warehouse, vineyard or wine country, castle, boutique design hotel, lakeside, urban rooftop, chapel, tented estate.
Mix indoor-dominant and outdoor-dominant, city and countryside, intimate and grand, budget-friendly and splurge where possible.
No two picks should feel interchangeable — if three venues are all "elegant manor in rolling hills", replace the duplicates.
`.trim();

const suggestSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    venues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, nullable: true },
          why_fit: { type: Type.STRING, nullable: true },
          capacity: { type: Type.STRING, nullable: true },
          price_hint: { type: Type.STRING, nullable: true },
        },
        required: ["name"],
      },
    },
  },
  required: ["venues"],
};

function prompt(args: {
  destination: string;
  guestCount: number;
  loved: string[];
  budget: string | null;
  lang: string;
}) {
  const lovedLine = args.loved.length
    ? `They also hearted these dream places for later: ${args.loved.join(", ")}. Lean into that vibe and geography where it makes sense.`
    : "";
  const budgetLine = args.budget ? `Budget ballpark: ${args.budget} DKK.` : "";
  const langNote = args.lang === "da" ? "Write why_fit in Danish." : "Write why_fit in English.";

  return `
You are a wedding venue curator for a swipe-based vibe check. Suggest exactly ${TARGET} REAL wedding venues in or near "${args.destination}"
for about ${args.guestCount} guests. ${lovedLine} ${budgetLine}

${DIVERSITY_BRIEF}

Rules:
- Every "name" must be a real, findable venue or estate (not a city or region).
- All must genuinely host weddings and fit the guest count roughly.
- "why_fit" is ONE warm sentence highlighting THIS venue's distinct vibe (${langNote}).
- "capacity" and "price_hint" only when you have reasonable confidence; otherwise null.
- No duplicates. No invented places.
`.trim();
}

async function suggestStructured(args: Parameters<typeof prompt>[0]): Promise<ExtractedVenue[]> {
  const ai = getGemini();
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt(args),
    config: {
      responseMimeType: "application/json",
      responseSchema: suggestSchema,
    },
  });
  const parsed = JSON.parse(res.text ?? "{}") as { venues?: ExtractedVenue[] };
  return (parsed.venues ?? []).filter((v) => v.name?.trim()).slice(0, TARGET + 4);
}

async function suggestGrounded(
  args: Parameters<typeof prompt>[0],
  destination: string
): Promise<ExtractedVenue[]> {
  const ai = getGemini();
  const searchPrompt = `Search the web and find ${TARGET} real wedding venues in or near ${destination} for about ${args.guestCount} guests.
${args.loved.length ? `Dream places they saved: ${args.loved.join(", ")}.` : ""}
${args.budget ? `Budget: ${args.budget} DKK.` : ""}

${DIVERSITY_BRIEF}

Report each venue's name, distinct atmosphere/vibe, why it fits, address if visible, capacity and price hints.
Prioritize variety — the couple swipes to learn their style, so avoid a homogeneous list.`;

  const grounded = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: searchPrompt,
    config: { tools: [{ googleSearch: {} }] },
  });
  const notes = grounded.text?.trim();
  if (!notes) return [];

  const extraction = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: VENUE_EXTRACTION_PROMPT(notes),
    config: {
      responseMimeType: "application/json",
      responseSchema: venueListSchema,
    },
  });
  const parsed = JSON.parse(extraction.text ?? "{}") as { venues?: ExtractedVenue[] };
  return (parsed.venues ?? []).filter((v) => v.name?.trim()).slice(0, TARGET + 4);
}

async function enrich(
  extracted: ExtractedVenue,
  destination: string
): Promise<OnboardingVenueSuggestion | null> {
  const place = await matchPlace(extracted.name, destination);
  if (!place) return null;
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") return null;

  const details: PlaceResult | null = await getDetails(place.id);
  const resolved = details ?? place;
  const photos = await resolvePhotoUrls(resolved.photos, 4);
  if (!photos[0]) return null;

  return {
    id: place.id,
    name: resolved.displayName?.text ?? extracted.name,
    description: extracted.description ?? resolved.editorialSummary?.text ?? null,
    why_fit: extracted.why_fit ?? null,
    address: resolved.formattedAddress ?? extracted.address ?? null,
    capacity: extracted.capacity ?? null,
    price_hint: extracted.price_hint ?? null,
    photo: photos[0],
    photos,
    rating: resolved.rating ?? null,
    review_count: resolved.userRatingCount ?? null,
    place_id: place.id,
  };
}

function cacheKey(
  destination: string,
  guestCount: number,
  loved: string[],
  lang: string
): string {
  const lovedKey = [...loved].sort().join("|").toLowerCase();
  return `onboarding-venues:v4:${lang}:${destination.toLowerCase()}:${guestCount}:${lovedKey}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;
  const destination = (body.destination ?? "").trim();
  const guestCount =
    typeof body.guest_count === "number" && body.guest_count > 0
      ? Math.round(body.guest_count)
      : 75;
  const loved = (body.loved_destinations ?? [])
    .filter((v) => typeof v === "string" && v.trim())
    .map((v) => v.trim().slice(0, 80))
    .slice(0, 20);
  const lang = body.lang === "en" ? "en" : "da";
  const budget = (body.budget ?? "").trim() || null;

  if (!destination || destination.length > 120) {
    return Response.json({ error: "destination is required" }, { status: 400 });
  }

  const key = cacheKey(destination, guestCount, loved, lang);
  const cached = await cacheGet<OnboardingVenueSuggestion[]>(key);
  if (cached?.length) return Response.json({ venues: cached });

  const args = { destination, guestCount, loved, budget, lang };
  let extracted: ExtractedVenue[] = [];
  try {
    extracted = await suggestGrounded(args, destination);
  } catch {
    // Grounding can fail — fall back to structured.
  }
  if (extracted.length < TARGET / 2) {
    try {
      const structured = await suggestStructured(args);
      const seen = new Set(extracted.map((v) => v.name.toLowerCase()));
      for (const v of structured) {
        if (!seen.has(v.name.toLowerCase())) extracted.push(v);
      }
    } catch {
      if (extracted.length === 0) return Response.json({ venues: [] });
    }
  }

  const seenPlaces = new Set<string>();
  const venues: OnboardingVenueSuggestion[] = [];
  for (const item of extracted) {
    if (venues.length >= TARGET) break;
    const enriched = await enrich(item, destination);
    if (!enriched || seenPlaces.has(enriched.place_id!)) continue;
    seenPlaces.add(enriched.place_id!);
    venues.push(enriched);
  }

  if (venues.length > 0) await cacheSet(key, venues);
  return Response.json({ venues });
}
