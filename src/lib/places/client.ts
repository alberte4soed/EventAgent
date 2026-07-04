// Google Places API (New) client: match, validate and enrich venues/vendors.
// Same contract as the original photos helper — every function is
// best-effort and never throws, so enrichment can't break a search.
//
// Cost shape: one Text Search per candidate (matchPlace), one Place Details
// (reviews SKU) only for places we actually keep.

import { createAdminClient } from "@/lib/supabase/admin";
import type { VenueReview } from "@/lib/db/types";

const PLACES_BASE = "https://places.googleapis.com/v1";
const CACHE_TTL_MS = 7 * 24 * 3600 * 1000; // Places facts are stable for a week

/** Best-effort read from places_cache; null on miss/expiry/error. */
async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("places_cache")
      .select("payload, fetched_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (!data) return null;
    if (Date.now() - new Date(data.fetched_at as string).getTime() > CACHE_TTL_MS) return null;
    return data.payload as T;
  } catch {
    return null;
  }
}

/** Best-effort write to places_cache; failures are swallowed. */
async function cacheSet(key: string, payload: unknown): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("places_cache")
      .upsert({ cache_key: key, payload, fetched_at: new Date().toISOString() });
  } catch {
    // best-effort
  }
}

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.priceLevel",
  "places.businessStatus",
  "places.photos",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "reviews",
  "websiteUri",
  "nationalPhoneNumber",
  "priceLevel",
  "businessStatus",
  "photos",
  "editorialSummary",
].join(",");

interface PlacePhoto {
  name: string; // "places/XXX/photos/YYY"
}

export interface PlaceResult {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  priceLevel?: string;
  businessStatus?: string;
  photos?: PlacePhoto[];
  reviews?: {
    rating?: number;
    relativePublishTimeDescription?: string;
    text?: { text?: string };
    authorAttribution?: { displayName?: string };
  }[];
  editorialSummary?: { text?: string };
}

function apiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY ?? null;
}

/** Text Search. Returns [] on any failure. */
export async function searchText(
  query: string,
  opts: { maxResults?: number } = {}
): Promise<PlaceResult[]> {
  const key = apiKey();
  if (!key || !query.trim()) return [];
  const max = opts.maxResults ?? 3;
  const cacheKey = `search:${query.toLowerCase().trim()}:${max}`;
  const cached = await cacheGet<PlaceResult[]>(cacheKey);
  if (cached) return cached;
  try {
    const res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: max,
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { places?: PlaceResult[] };
    const places = data.places ?? [];
    await cacheSet(cacheKey, places);
    return places;
  } catch {
    return [];
  }
}

/** Place Details (includes reviews). Returns null on any failure. */
export async function getDetails(placeId: string): Promise<PlaceResult | null> {
  const key = apiKey();
  if (!key || !placeId) return null;
  const cacheKey = `details:${placeId}`;
  const cached = await cacheGet<PlaceResult>(cacheKey);
  if (cached) return cached;
  try {
    const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": DETAILS_FIELD_MASK,
      },
    });
    if (!res.ok) return null;
    const details = (await res.json()) as PlaceResult;
    await cacheSet(cacheKey, details);
    return details;
  } catch {
    return null;
  }
}

/** Resolve up to `count` photo resources into public googleusercontent URLs. */
export async function resolvePhotoUrls(
  photos: PlacePhoto[] | undefined,
  count = 4
): Promise<string[]> {
  const key = apiKey();
  if (!key || !photos?.length) return [];
  const urls = await Promise.all(
    photos.slice(0, count).map(async (photo) => {
      try {
        const res = await fetch(
          `${PLACES_BASE}/${photo.name}/media?maxHeightPx=600&maxWidthPx=800&skipHttpRedirect=true&key=${key}`
        );
        if (!res.ok) return null;
        const media = (await res.json()) as { photoUri?: string };
        return media.photoUri ?? null;
      } catch {
        return null;
      }
    })
  );
  return urls.filter((u): u is string => Boolean(u));
}

export function normalizeTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !["the", "at", "of", "and"].includes(t))
  );
}

/** Token-overlap similarity in [0, 1] against the smaller name. */
export function nameSimilarity(a: string, b: string): number {
  const ta = normalizeTokens(a);
  const tb = normalizeTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let hits = 0;
  for (const t of ta) if (tb.has(t)) hits++;
  return hits / Math.min(ta.size, tb.size);
}

/**
 * Find the Places record for a named venue near a location. Guards against
 * matching a different business with a similar generic name — returns null
 * on a weak match rather than guessing.
 */
export async function matchPlace(
  name: string,
  location?: string | null
): Promise<PlaceResult | null> {
  const results = await searchText([name, location].filter(Boolean).join(", "), {
    maxResults: 3,
  });
  for (const place of results) {
    const placeName = place.displayName?.text ?? "";
    if (nameSimilarity(name, placeName) >= 0.5) return place;
  }
  return null;
}

/** Top `count` reviews mapped into the shape stored on the venue row. */
export function mapReviews(place: PlaceResult, count = 3): VenueReview[] {
  return (place.reviews ?? []).slice(0, count).map((r) => ({
    author: r.authorAttribution?.displayName ?? null,
    rating: r.rating ?? null,
    text: r.text?.text ?? null,
    relative_time: r.relativePublishTimeDescription ?? null,
  }));
}

/** Host of a URL without the www. prefix, or null. */
export function urlHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** True when the email's domain equals (or is a subdomain of) the website host. */
export function emailMatchesWebsite(
  email: string | null | undefined,
  website: string | null | undefined
): boolean {
  const host = urlHost(website);
  const domain = email?.split("@")[1]?.toLowerCase();
  if (!host || !domain) return false;
  return domain === host || domain.endsWith(`.${host}`) || host.endsWith(`.${domain}`);
}
