// How far a venue is from where the couple actually is.
//
// The one filter with complete data: Places returns coordinates for every
// venue we keep, so unlike price (7% known) or ceremony (43%), this one has an
// answer every time. That makes it the only rule that can safely be hard —
// see filter.ts, where a known miss rejects without needing to be required.
//
// It earns its place because search is multi-region now: "Nordsjælland og Fyn"
// puts venues 150km apart in one list, and the couple's own corner of it is
// the thing that orders them.

export interface Coords {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle distance in kilometres.
 *
 * Haversine rather than a flat approximation: Denmark spans enough latitude
 * that a naive Pythagorean distance on raw degrees is wrong by a useful
 * margin, and the cost is a handful of trig calls per venue.
 */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Coordinates, or null when either side is missing them. Null means unknown,
 *  and unknown must never be treated as "far away". */
export function distanceBetween(
  origin: Coords | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined
): number | null {
  if (!origin || lat == null || lng == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return Math.round(distanceKm(origin, { lat, lng }));
}
