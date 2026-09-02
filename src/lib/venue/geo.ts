/* Where places are, so the globe can fly to them.
 *
 * `regions.ts` is a search taxonomy — it knows that Fyn means Odense,
 * Svendborg, Fåborg, Langeland and Ærø, and nothing at all about where any of
 * those are. The globe needs a point per level to drill Earth → country →
 * region → town.
 *
 * These are hand-written rather than geocoded at runtime for three reasons:
 * the curated set is Danish and small, a camera target does not need to be
 * more precise than "this end of the island", and a globe that has to wait on
 * Google before it can move is not a globe you want to spin. Every other
 * country drills on the coordinates Places already returns with each
 * destination suggestion (see /api/onboarding/destinations), so nothing here
 * has to grow when a couple picks Italy.
 *
 * `geo.test.ts` asserts that every curated region and every one of its areas
 * has a point, so adding an area to regions.ts without a coordinate fails
 * rather than quietly landing the camera in the North Sea.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** A camera target: where to look, and from how far out. */
export interface GeoView extends GeoPoint {
  /** react-globe.gl altitude. Lower is closer; 1.0 ≈ a small country. */
  altitude: number;
}

/** Countries we can open without waiting for a click on the globe. */
export const COUNTRY_VIEWS: Record<string, GeoView> = {
  denmark: { lat: 56.0, lng: 10.6, altitude: 0.5 },
};

/** The ten curated Danish regions, by slug. */
export const REGION_VIEWS: Record<string, GeoView> = {
  hovedstaden: { lat: 55.68, lng: 12.55, altitude: 0.16 },
  nordsjaelland: { lat: 55.98, lng: 12.35, altitude: 0.17 },
  vestsjaelland: { lat: 55.53, lng: 11.55, altitude: 0.19 },
  sydsjaelland: { lat: 54.95, lng: 11.95, altitude: 0.21 },
  fyn: { lat: 55.25, lng: 10.45, altitude: 0.19 },
  sonderjylland: { lat: 55.15, lng: 9.2, altitude: 0.2 },
  vestjylland: { lat: 55.9, lng: 8.5, altitude: 0.21 },
  midtjylland: { lat: 56.2, lng: 9.75, altitude: 0.21 },
  nordjylland: { lat: 57.2, lng: 9.9, altitude: 0.21 },
  bornholm: { lat: 55.13, lng: 14.9, altitude: 0.13 },
};

/** Every area named in DK_REGIONS. Town centres, or the middle of an island. */
export const AREA_POINTS: Record<string, GeoPoint> = {
  // Hovedstaden
  'København': { lat: 55.676, lng: 12.568 },
  'Frederiksberg': { lat: 55.678, lng: 12.522 },
  'Amager': { lat: 55.635, lng: 12.605 },
  'Nordhavn': { lat: 55.712, lng: 12.593 },
  'Gentofte': { lat: 55.752, lng: 12.552 },
  // Nordsjælland
  'Helsingør': { lat: 56.036, lng: 12.613 },
  'Hillerød': { lat: 55.928, lng: 12.302 },
  'Fredensborg': { lat: 55.976, lng: 12.402 },
  'Gilleleje': { lat: 56.122, lng: 12.309 },
  'Hornbæk': { lat: 56.093, lng: 12.456 },
  // Vestsjælland
  'Roskilde': { lat: 55.642, lng: 12.088 },
  'Holbæk': { lat: 55.717, lng: 11.71 },
  'Sorø': { lat: 55.432, lng: 11.556 },
  'Slagelse': { lat: 55.403, lng: 11.354 },
  'Kalundborg': { lat: 55.679, lng: 11.089 },
  // Sydsjælland
  'Næstved': { lat: 55.23, lng: 11.762 },
  'Vordingborg': { lat: 55.008, lng: 11.911 },
  'Møn': { lat: 54.98, lng: 12.35 },
  'Lolland-Falster': { lat: 54.77, lng: 11.72 },
  'Stevns': { lat: 55.31, lng: 12.38 },
  // Fyn
  'Odense': { lat: 55.396, lng: 10.39 },
  'Svendborg': { lat: 55.06, lng: 10.607 },
  'Fåborg': { lat: 55.096, lng: 10.245 },
  'Langeland': { lat: 54.93, lng: 10.79 },
  'Ærø': { lat: 54.867, lng: 10.41 },
  // Sønderjylland
  'Kolding': { lat: 55.491, lng: 9.472 },
  'Haderslev': { lat: 55.249, lng: 9.489 },
  'Sønderborg': { lat: 54.909, lng: 9.792 },
  'Tønder': { lat: 54.937, lng: 8.867 },
  'Ribe': { lat: 55.33, lng: 8.766 },
  // Vestjylland
  'Esbjerg': { lat: 55.467, lng: 8.452 },
  'Varde': { lat: 55.62, lng: 8.482 },
  'Ringkøbing': { lat: 56.09, lng: 8.244 },
  'Holstebro': { lat: 56.36, lng: 8.616 },
  // Midtjylland
  'Aarhus': { lat: 56.163, lng: 10.203 },
  'Silkeborg': { lat: 56.17, lng: 9.551 },
  'Skanderborg': { lat: 56.037, lng: 9.931 },
  'Djursland': { lat: 56.42, lng: 10.75 },
  'Herning': { lat: 56.139, lng: 8.977 },
  // Nordjylland
  'Aalborg': { lat: 57.048, lng: 9.922 },
  'Skagen': { lat: 57.724, lng: 10.581 },
  'Hjørring': { lat: 57.464, lng: 9.982 },
  'Thy': { lat: 56.95, lng: 8.6 },
  // Bornholm
  'Rønne': { lat: 55.101, lng: 14.706 },
  'Gudhjem': { lat: 55.209, lng: 14.976 },
  'Svaneke': { lat: 55.135, lng: 15.143 },
  'Allinge': { lat: 55.276, lng: 14.803 },
};

/** How close the camera sits on a single town. */
export const TOWN_ALTITUDE = 0.09;

/** The camera target for a country we know, or null to use the click point. */
export function countryView(country: string | null | undefined): GeoView | null {
  if (!country) return null;
  return COUNTRY_VIEWS[country.trim().toLowerCase()] ?? null;
}

/** The camera target for a curated region, or null for an AI-grouped one. */
export function regionView(slug: string | null | undefined): GeoView | null {
  if (!slug) return null;
  return REGION_VIEWS[slug] ?? null;
}

/** The point for a named area inside a curated region. */
export function areaPoint(area: string | null | undefined): GeoPoint | null {
  if (!area) return null;
  return AREA_POINTS[area.trim()] ?? null;
}

/**
 * The middle of a set of points — how an AI-grouped region gets a camera
 * target from the destinations Places already placed for it. Naive averaging,
 * which is wrong across the antimeridian and right everywhere a wedding region
 * actually spans.
 */
export function centroid(points: GeoPoint[]): GeoPoint | null {
  if (points.length === 0) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}
