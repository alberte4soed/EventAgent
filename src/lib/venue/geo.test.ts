import { describe, expect, it } from 'vitest';
import { DK_REGIONS } from './regions';
import {
  AREA_POINTS, REGION_VIEWS, areaPoint, centroid, countryView, regionView,
} from './geo';

/* The point of these: regions.ts and geo.ts are two lists that have to stay the
   same length. Adding "Møns Klint" to a region without a coordinate would put
   the camera nowhere, silently. */
describe('coverage of the curated taxonomy', () => {
  it('has a camera target for every Danish region', () => {
    const missing = DK_REGIONS.filter((r) => !regionView(r.slug)).map((r) => r.slug);
    expect(missing).toEqual([]);
  });

  it('has a point for every area named in a Danish region', () => {
    const missing = DK_REGIONS.flatMap((r) =>
      r.areas.filter((a) => !areaPoint(a)).map((a) => `${r.slug}/${a}`)
    );
    expect(missing).toEqual([]);
  });

  it('carries no coordinates nothing refers to', () => {
    const named = new Set(DK_REGIONS.flatMap((r) => r.areas));
    const orphans = Object.keys(AREA_POINTS).filter((a) => !named.has(a));
    expect(orphans).toEqual([]);
  });

  it('keeps every region inside Denmark', () => {
    for (const [slug, view] of Object.entries(REGION_VIEWS)) {
      expect(view.lat, slug).toBeGreaterThan(54.4);
      expect(view.lat, slug).toBeLessThan(58);
      expect(view.lng, slug).toBeGreaterThan(7.8);
      expect(view.lng, slug).toBeLessThan(15.3);
      expect(view.altitude, slug).toBeGreaterThan(0);
    }
  });
});

describe('lookups', () => {
  it('finds a country however it is cased or padded', () => {
    expect(countryView('Denmark')?.lat).toBeCloseTo(56);
    expect(countryView('  denmark ')?.lat).toBeCloseTo(56);
  });

  it('returns null for a country with no curated view', () => {
    expect(countryView('Italy')).toBeNull();
    expect(countryView(null)).toBeNull();
  });

  it('returns null for an AI-grouped region', () => {
    expect(regionView('toscana')).toBeNull();
    expect(regionView(undefined)).toBeNull();
  });

  it('trims an area name before looking it up', () => {
    expect(areaPoint(' Odense ')?.lat).toBeCloseTo(55.396);
    expect(areaPoint('Nowhere')).toBeNull();
  });
});

describe('centroid', () => {
  it('averages the points it is given', () => {
    expect(centroid([{ lat: 0, lng: 0 }, { lat: 10, lng: 20 }])).toEqual({ lat: 5, lng: 10 });
  });

  it('is a single point when there is only one', () => {
    expect(centroid([{ lat: 43.7, lng: 11.25 }])).toEqual({ lat: 43.7, lng: 11.25 });
  });

  /* An AI region whose destinations all came back without coordinates. */
  it('is null when there is nothing to average', () => {
    expect(centroid([])).toBeNull();
  });
});
