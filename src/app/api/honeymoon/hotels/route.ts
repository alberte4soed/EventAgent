import { NextRequest } from "next/server";
import { Type, type Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini/client";
import {
  cacheGet,
  cacheSet,
  getDetails,
  matchPlace,
  resolvePhotoUrls,
  type PlaceResult,
} from "@/lib/places/client";

/**
 * POST /api/honeymoon/hotels
 *
 * Gemini researches real honeymoon hotels & romantic stays for a chosen
 * destination; Google Places verifies each pick and supplies photos + ratings.
 * Mirrors /api/onboarding/venues, but framed for honeymoon stays rather than
 * wedding venues. Body: { destination, lang }.
 */

export interface HoneymoonHotel {
  id: string;
  name: string;
  description: string | null;
  why_fit: string | null;
  address: string | null;
  price_hint: string | null;
  photo: string | null;
  photos: string[];
  rating: number | null;
  review_count: number | null;
  place_id: string | null;
}

interface Body {
  destination?: string;
  lang?: string;
}

const TARGET = 8;

interface ExtractedHotel {
  name: string;
  description?: string | null;
  why_fit?: string | null;
  price_hint?: string | null;
}

const suggestSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hotels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, nullable: true },
          why_fit: { type: Type.STRING, nullable: true },
          price_hint: { type: Type.STRING, nullable: true },
        },
        required: ["name"],
      },
    },
  },
  required: ["hotels"],
};

function prompt(destination: string, lang: string) {
  const langNote = lang === "da" ? "Write why_fit in Danish." : "Write why_fit in English.";
  return `
You are a honeymoon-travel curator. Suggest exactly ${TARGET} REAL, romantic honeymoon hotels or resorts
in or near "${destination}" for a newlywed couple.

Aim for variety across price and style: overwater villas, boutique design hotels, adults-only resorts,
private-pool villas, luxury eco-lodges, historic romantic hotels. Mix a couple of attainable options with
a few splurge-worthy dream stays. No two picks should feel interchangeable.

Rules:
- Every "name" must be a real, findable hotel or resort (not a city, region or generic "a beach resort").
- "why_fit" is ONE warm sentence on why it's perfect for a honeymoon (${langNote}).
- "price_hint" only when you have reasonable confidence; otherwise null.
- No duplicates. No invented places.
`.trim();
}

async function suggestStructured(destination: string, lang: string): Promise<ExtractedHotel[]> {
  const ai = getGemini();
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt(destination, lang),
    config: {
      responseMimeType: "application/json",
      responseSchema: suggestSchema,
    },
  });
  const parsed = JSON.parse(res.text ?? "{}") as { hotels?: ExtractedHotel[] };
  return (parsed.hotels ?? []).filter((v) => v.name?.trim()).slice(0, TARGET + 4);
}

async function enrich(
  extracted: ExtractedHotel,
  destination: string
): Promise<HoneymoonHotel | null> {
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
    address: resolved.formattedAddress ?? null,
    price_hint: extracted.price_hint ?? null,
    photo: photos[0],
    photos,
    rating: resolved.rating ?? null,
    review_count: resolved.userRatingCount ?? null,
    place_id: place.id,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;
  const destination = (body.destination ?? "").trim();
  const lang = body.lang === "en" ? "en" : "da";
  if (!destination || destination.length > 120) {
    return Response.json({ error: "destination is required" }, { status: 400 });
  }

  const key = `honeymoon-hotels:v1:${lang}:${destination.toLowerCase()}`;
  const cached = await cacheGet<HoneymoonHotel[]>(key);
  if (cached?.length) return Response.json({ hotels: cached });

  let extracted: ExtractedHotel[] = [];
  try {
    extracted = await suggestStructured(destination, lang);
  } catch {
    return Response.json({ hotels: [] });
  }

  const seenPlaces = new Set<string>();
  const hotels: HoneymoonHotel[] = [];
  for (const item of extracted) {
    if (hotels.length >= TARGET) break;
    const enriched = await enrich(item, destination);
    if (!enriched || seenPlaces.has(enriched.place_id!)) continue;
    seenPlaces.add(enriched.place_id!);
    hotels.push(enriched);
  }

  if (hotels.length > 0) await cacheSet(key, hotels);
  return Response.json({ hotels });
}
