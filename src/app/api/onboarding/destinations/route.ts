import { NextRequest } from "next/server";
import { Type, type Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini/client";
import { cacheGet, cacheSet, searchText, resolvePhotoUrls } from "@/lib/places/client";

/**
 * GET /api/onboarding/destinations?country=Italy&lang=en
 *
 * Powers the onboarding globe's country panel: Gemini curates the country's
 * top cities plus dreamier wedding-destination spots, then Google Places
 * fills in a photo and rating for each. The whole payload is cached (via
 * places_cache) per country+language, so a country costs one Gemini call and
 * a handful of Places lookups once, ever.
 */

export interface DestinationSuggestion {
  name: string;
  region: string | null;
  kind: "city" | "wedding";
  blurb: string;
  photo: string | null;
  rating: number | null;
  lat: number | null;
  lng: number | null;
}

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
            description: "Region/province the place sits in, if meaningful",
          },
          kind: { type: Type.STRING, enum: ["city", "wedding"] },
          blurb: {
            type: Type.STRING,
            description: "One warm sentence for an engaged couple",
          },
        },
        required: ["name", "kind", "blurb"],
      },
    },
  },
  required: ["suggestions"],
};

const PROMPT = (country: string, language: string) => `
You are a wedding-travel curator for couples planning their wedding.
For the country "${country}", suggest exactly:
- the 4 top cities (kind "city"): the biggest / most iconic cities couples would recognise, and
- 5 wedding destinations (kind "wedding"): the places people actually get married — coastal towns, lake or wine regions, castles-and-countryside areas, islands. Not simply the largest cities; think honeymoon-postcard.

Rules:
- "name" must be a real, findable place name (city, town, island or well-known area) in English.
- No duplicates across the two kinds.
- "blurb" is ONE short sentence, written in ${language === "da" ? "Danish" : "English"}, about why it's lovely for a wedding.
`.trim();

async function suggest(country: string, lang: string): Promise<Omit<DestinationSuggestion, "photo" | "rating" | "lat" | "lng">[]> {
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
    .filter((s) => s.name?.trim() && (s.kind === "city" || s.kind === "wedding"))
    .slice(0, 12)
    .map((s) => ({
      name: s.name!.trim(),
      region: s.region?.trim() || null,
      kind: s.kind as "city" | "wedding",
      blurb: s.blurb?.trim() ?? "",
    }));
}

/** Photo, rating and coordinates from Places — best-effort, never throws. */
async function enrich(
  s: Omit<DestinationSuggestion, "photo" | "rating" | "lat" | "lng">,
  country: string
): Promise<DestinationSuggestion> {
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

  const cacheKey = `onboarding-dest:v1:${lang}:${country.toLowerCase()}`;
  const cached = await cacheGet<DestinationSuggestion[]>(cacheKey);
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
