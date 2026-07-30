import { NextRequest } from "next/server";
import { Type, type Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini/client";
import { cacheGet, cacheSet, searchText, resolvePhotoUrls } from "@/lib/places/client";

/**
 * GET /api/honeymoon/inspiration?lang=en
 *
 * Editorial content for the Honeymoon "Inspiration" tab: a set of honeymoon
 * themes (each with a hero photo + blurb), a handful of destination spotlights,
 * and idea cards for trips, routes and hotels. Gemini writes the copy and picks
 * representative real places; Google Places supplies the photos. Cached per
 * language, so the whole gallery costs one Gemini call + a handful of Places
 * lookups once, ever.
 */

export type HoneymoonThemeId =
  | "beach"
  | "adventure"
  | "wellness"
  | "minimoon"
  | "city"
  | "safari";

export type HoneymoonIdeaKind = "trip" | "route" | "hotel";

export interface HoneymoonTheme {
  id: HoneymoonThemeId;
  title: string;
  blurb: string;
  photo: string | null;
}

export interface HoneymoonSpotlight {
  name: string;
  country: string | null;
  blurb: string;
  photo: string | null;
  rating: number | null;
}

export interface HoneymoonIdea {
  kind: HoneymoonIdeaKind;
  title: string;
  location: string | null;
  blurb: string;
  photo: string | null;
}

export interface HoneymoonInspiration {
  themes: HoneymoonTheme[];
  spotlights: HoneymoonSpotlight[];
  ideas: HoneymoonIdea[];
}

const THEME_IDS: HoneymoonThemeId[] = [
  "beach",
  "adventure",
  "wellness",
  "minimoon",
  "city",
  "safari",
];

const IDEA_KINDS: HoneymoonIdeaKind[] = ["trip", "route", "hotel"];

/** Fixed, localized theme titles — kept out of the model for clean, stable copy. */
const THEME_TITLES: Record<HoneymoonThemeId, { da: string; en: string }> = {
  beach: { da: "Strand", en: "Beach" },
  adventure: { da: "Eventyr", en: "Adventure" },
  wellness: { da: "Wellness", en: "Wellness" },
  minimoon: { da: "Minimoon", en: "Minimoon" },
  city: { da: "By", en: "City" },
  safari: { da: "Safari", en: "Safari" },
};

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    themes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, enum: THEME_IDS },
          photo_query: {
            type: Type.STRING,
            description: "A real, findable place that represents this theme (e.g. 'Maldives overwater villa')",
          },
          blurb: { type: Type.STRING, description: "One warm sentence for this honeymoon mood" },
        },
        required: ["id", "photo_query", "blurb"],
      },
    },
    spotlights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "A real honeymoon destination name" },
          country: { type: Type.STRING, nullable: true },
          blurb: { type: Type.STRING },
        },
        required: ["name", "blurb"],
      },
    },
    ideas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          kind: { type: Type.STRING, enum: IDEA_KINDS },
          title: { type: Type.STRING },
          location: { type: Type.STRING, nullable: true },
          blurb: { type: Type.STRING },
        },
        required: ["kind", "title", "blurb"],
      },
    },
  },
  required: ["themes", "spotlights", "ideas"],
};

const PROMPT = (language: string) => {
  const lang = language === "da" ? "Danish" : "English";
  return `
You are the editor of a honeymoon inspiration magazine for newlywed couples. Produce content in ${lang}.

Return:
1. "themes": exactly 6 entries, one for each id: ${THEME_IDS.join(", ")}. For each, give a "photo_query"
   (a real, iconic, findable place that captures that mood) and a one-sentence "blurb".
2. "spotlights": 4 under-the-radar but real honeymoon destinations, each with name, country and a one-sentence blurb.
3. "ideas": 5 idea cards mixing kinds "trip" (a themed trip idea), "route" (a multi-stop itinerary) and "hotel"
   (a romantic stay). Each has a title, a "location" (a real, findable place for the photo) and a one-sentence blurb.

Keep every blurb to ONE evocative sentence. Use only real, findable places for photo_query, spotlight names and idea locations.
`.trim();
};

interface RawInspiration {
  themes?: { id?: string; photo_query?: string; blurb?: string }[];
  spotlights?: { name?: string; country?: string | null; blurb?: string }[];
  ideas?: { kind?: string; title?: string; location?: string | null; blurb?: string }[];
}

async function generate(lang: string): Promise<RawInspiration> {
  const ai = getGemini();
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: PROMPT(lang),
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  return JSON.parse(res.text ?? "{}") as RawInspiration;
}

async function photoFor(query: string): Promise<{ photo: string | null; rating: number | null }> {
  const [place] = await searchText(query, { maxResults: 1 });
  const photos = await resolvePhotoUrls(place?.photos, 1);
  return { photo: photos[0] ?? null, rating: place?.rating ?? null };
}

async function build(lang: string): Promise<HoneymoonInspiration> {
  const raw = await generate(lang);
  const key = lang === "da" ? "da" : "en";

  const themeInputs = THEME_IDS.map((id) => {
    const hit = (raw.themes ?? []).find((t) => t.id === id);
    return { id, photo_query: hit?.photo_query?.trim() || id, blurb: hit?.blurb?.trim() ?? "" };
  });
  const themes = await Promise.all(
    themeInputs.map(async (t): Promise<HoneymoonTheme> => {
      const { photo } = await photoFor(t.photo_query);
      return { id: t.id, title: THEME_TITLES[t.id][key], blurb: t.blurb, photo };
    })
  );

  const spotlights = await Promise.all(
    (raw.spotlights ?? [])
      .filter((s) => s.name?.trim())
      .slice(0, 4)
      .map(async (s): Promise<HoneymoonSpotlight> => {
        const country = s.country?.trim() || null;
        const { photo, rating } = await photoFor([s.name!.trim(), country].filter(Boolean).join(", "));
        return { name: s.name!.trim(), country, blurb: s.blurb?.trim() ?? "", photo, rating };
      })
  );

  const ideas = await Promise.all(
    (raw.ideas ?? [])
      .filter((i) => i.title?.trim() && IDEA_KINDS.includes(i.kind as HoneymoonIdeaKind))
      .slice(0, 5)
      .map(async (i): Promise<HoneymoonIdea> => {
        const location = i.location?.trim() || null;
        const { photo } = await photoFor(location ?? i.title!.trim());
        return {
          kind: i.kind as HoneymoonIdeaKind,
          title: i.title!.trim(),
          location,
          blurb: i.blurb?.trim() ?? "",
          photo,
        };
      })
  );

  return { themes, spotlights, ideas };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "da";

  const cacheKey = `honeymoon-inspiration:v1:${lang}`;
  const cached = await cacheGet<HoneymoonInspiration>(cacheKey);
  if (cached) return Response.json(cached);

  let payload: HoneymoonInspiration;
  try {
    payload = await build(lang);
  } catch {
    // Gemini down or unconfigured — the client shows an empty-state.
    return Response.json({ themes: [], spotlights: [], ideas: [] });
  }

  if (payload.themes.length > 0 || payload.spotlights.length > 0) {
    await cacheSet(cacheKey, payload);
  }
  return Response.json(payload);
}
