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
  isPlausibleVenue,
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

/**
 * Shared curation brief. Two jobs at once: keep every pick a genuine WEDDING
 * venue (the #1 complaint is random hotels / restaurants / non-venues), while
 * still spreading across aesthetics so swiping actually reveals taste.
 */
const DIVERSITY_BRIEF = `
FOCUS — every single pick must be a place that genuinely hosts weddings and events: a dedicated wedding/event
venue, an estate, manor, castle, barn or farm that hosts weddings, a vineyard or winery, a historic hall,
orangery or garden, a museum or gallery that rents for events, or a hotel/restaurant ONLY IF it markets a real
wedding offering (a wedding package, event/banquet space, a "bryllup"/"weddings" page). This is a wedding-venue
shortlist, NOT a list of nice places in the city.

Do NOT include: ordinary city or chain business hotels with no wedding offering, everyday restaurants or cafés,
bars, nightclubs, shops, offices, town halls, associations, sports facilities, playgrounds, or private homes.

VARIETY — within that focus, make the ${TARGET} venues feel distinct so the couple's swipes reveal a preference.
Spread across settings where the area allows: rustic barn / farm, historic manor or palace, castle, coastal or
beach, garden or orangery, vineyard or wine country, a design hotel with a real wedding offering, lakeside,
industrial/warehouse event space, chapel, tented estate. Mix indoor and outdoor, city and countryside, intimate
and grand, budget-friendly and splurge. No two picks should be interchangeable — but never trade the wedding-venue
focus for variety.
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
- Every "name" must be a real, findable, specific venue or estate (not a city, region, or generic business).
- Every pick must be a place that actually hosts weddings/events and fits the guest count roughly — when in doubt, leave it out.
- "why_fit" is ONE warm sentence highlighting THIS venue's distinct wedding vibe (${langNote}).
- "capacity" and "price_hint" only when you have reasonable confidence; otherwise null.
- No duplicates. No invented places. No generic hotels/restaurants without a real wedding offering.
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
  const searchPrompt = `Search the web and find ${TARGET} real WEDDING venues in or near ${destination} for about ${args.guestCount} guests.
Search for genuine wedding venues — try queries like "bryllupslokale ${destination}", "wedding venue ${destination}",
"bryllupsgård", "slot bryllup", "hold bryllup ${destination}" — and check each candidate has a real wedding/event offering.
${args.loved.length ? `Dream places they saved: ${args.loved.join(", ")}.` : ""}
${args.budget ? `Budget: ${args.budget} DKK.` : ""}

${DIVERSITY_BRIEF}

Report each venue's name, distinct atmosphere/vibe, why it fits, address if visible, capacity and price hints.
Only include places that genuinely host weddings; skip ordinary hotels, restaurants and non-venues even to reach the count.`;

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
  // Google's type tags catch the junk a name match lets through — playgrounds,
  // offices, shops, transit — so a bad pick never reaches the couple's cards.
  if (!isPlausibleVenue(place)) return null;

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
  return `onboarding-venues:v5:${lang}:${destination.toLowerCase()}:${guestCount}:${lovedKey}`;
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
