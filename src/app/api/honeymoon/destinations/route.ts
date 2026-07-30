import { NextRequest } from "next/server";
import { Type, type Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini/client";
import { cacheGet, cacheSet, searchText, resolvePhotoUrls } from "@/lib/places/client";

/**
 * GET /api/honeymoon/destinations?country=Thailand&lang=en
 *
 * Powers the Honeymoon globe's country panel: Gemini curates the country's most
 * romantic honeymoon destinations (beaches, islands, mountains, romantic cities),
 * then Google Places fills in a photo and rating for each. The whole payload is
 * cached per country+language, so a country costs one Gemini call and a handful
 * of Places lookups once, ever. Mirrors /api/onboarding/destinations, but framed
 * for honeymoons rather than wedding venues.
 */

export type HoneymoonDestinationKind = "beach" | "adventure" | "city" | "nature";

export interface HoneymoonDestination {
  name: string;
  region: string | null;
  kind: HoneymoonDestinationKind;
  blurb: string;
  photo: string | null;
  rating: number | null;
  lat: number | null;
  lng: number | null;
}

const KINDS: HoneymoonDestinationKind[] = ["beach", "adventure", "city", "nature"];

const suggestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          region: {
            type: Type.STRING,
            nullable: true,
            description: "Region/area the place sits in, if meaningful",
          },
          kind: { type: Type.STRING, enum: KINDS },
          blurb: {
            type: Type.STRING,
            description: "One warm sentence for a couple on their honeymoon",
          },
        },
        required: ["name", "kind", "blurb"],
      },
    },
  },
  required: ["suggestions"],
};

const PROMPT = (country: string, language: string) => `
You are a honeymoon-travel curator for newlywed couples.
For the country "${country}", suggest exactly 8 dreamy honeymoon destinations couples actually go to —
spread across these moods: "beach" (islands, coast, lagoons), "adventure" (mountains, deserts, safari, trekking),
"city" (romantic cities, culture, food), and "nature" (lakes, wine country, rainforest, hot springs).
Aim for at least 2 different kinds; favour variety over ten versions of the same beach.

Rules:
- "name" must be a real, findable place name (town, island, area or city) in English.
- No duplicates.
- "blurb" is ONE short sentence, written in ${language === "da" ? "Danish" : "English"}, about why it's magical for a honeymoon.
`.trim();

async function suggest(
  country: string,
  lang: string
): Promise<Omit<HoneymoonDestination, "photo" | "rating" | "lat" | "lng">[]> {
  const ai = getGemini();
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: PROMPT(country, lang),
    config: {
      responseMimeType: "application/json",
      responseSchema: suggestionSchema,
    },
  });
  const parsed = JSON.parse(res.text ?? "{}") as {
    suggestions?: { name?: string; region?: string | null; kind?: string; blurb?: string }[];
  };
  return (parsed.suggestions ?? [])
    .filter((s) => s.name?.trim() && KINDS.includes(s.kind as HoneymoonDestinationKind))
    .slice(0, 12)
    .map((s) => ({
      name: s.name!.trim(),
      region: s.region?.trim() || null,
      kind: s.kind as HoneymoonDestinationKind,
      blurb: s.blurb?.trim() ?? "",
    }));
}

/** Photo, rating and coordinates from Places — best-effort, never throws. */
async function enrich(
  s: Omit<HoneymoonDestination, "photo" | "rating" | "lat" | "lng">,
  country: string
): Promise<HoneymoonDestination> {
  const [place] = await searchText(`${s.name}, ${country}`, { maxResults: 1 });
  const photos = await resolvePhotoUrls(place?.photos, 1);
  return {
    ...s,
    photo: photos[0] ?? null,
    rating: place?.rating ?? null,
    lat: place?.location?.latitude ?? null,
    lng: place?.location?.longitude ?? null,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const country = (request.nextUrl.searchParams.get("country") ?? "").trim();
  const lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "da";
  if (!country || country.length > 60) {
    return Response.json({ error: "country is required" }, { status: 400 });
  }

  const cacheKey = `honeymoon-dest:v1:${lang}:${country.toLowerCase()}`;
  const cached = await cacheGet<HoneymoonDestination[]>(cacheKey);
  if (cached) return Response.json({ suggestions: cached });

  let bare;
  try {
    bare = await suggest(country, lang);
  } catch {
    // Gemini down or unconfigured — the client falls back to free-text entry.
    return Response.json({ suggestions: [] });
  }

  const suggestions = await Promise.all(bare.map((s) => enrich(s, country)));
  if (suggestions.length > 0) await cacheSet(cacheKey, suggestions);
  return Response.json({ suggestions });
}
