// Fetches a representative photo for a venue using the Google Places API (New).
// Flow: Text Search → first place's photo resource → Place Photo media
// (skipHttpRedirect returns a JSON photoUri on googleusercontent that is
// publicly viewable without exposing our API key in the browser).

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

interface PlacePhoto {
  name: string; // e.g. "places/XXX/photos/YYY"
}
interface PlaceResult {
  photos?: PlacePhoto[];
}

/**
 * Best-effort: returns a public image URL for the venue, or null.
 * Never throws — image discovery must not break venue search.
 */
export async function fetchVenuePhoto(
  venueName: string,
  location?: string | null
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const searchRes = await fetch(PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.photos",
      },
      body: JSON.stringify({
        textQuery: [venueName, location].filter(Boolean).join(", "),
        maxResultCount: 1,
      }),
    });
    if (!searchRes.ok) return null;

    const data = (await searchRes.json()) as { places?: PlaceResult[] };
    const photoName = data.places?.[0]?.photos?.[0]?.name;
    if (!photoName) return null;

    const mediaRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=600&maxWidthPx=800&skipHttpRedirect=true&key=${apiKey}`
    );
    if (!mediaRes.ok) return null;

    const media = (await mediaRes.json()) as { photoUri?: string };
    return media.photoUri ?? null;
  } catch {
    return null;
  }
}

/** Fetch photos for many venues in parallel (best-effort, order preserved). */
export async function fetchVenuePhotos(
  venues: { name: string }[],
  location?: string | null
): Promise<(string | null)[]> {
  return Promise.all(venues.map((v) => fetchVenuePhoto(v.name, location)));
}
