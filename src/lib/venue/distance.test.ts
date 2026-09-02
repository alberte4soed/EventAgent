import { describe, it, expect } from "vitest";
import { distanceKm, distanceBetween } from "./distance";

const COPENHAGEN = { lat: 55.6761, lng: 12.5683 };
const AARHUS = { lat: 56.1629, lng: 10.2039 };
const ODENSE = { lat: 55.4038, lng: 10.4024 };
const BORNHOLM = { lat: 55.1032, lng: 14.7065 };

describe("distanceKm", () => {
  it("matches known Danish distances", () => {
    // København–Aarhus is about 155 km as the crow flies.
    expect(distanceKm(COPENHAGEN, AARHUS)).toBeGreaterThan(145);
    expect(distanceKm(COPENHAGEN, AARHUS)).toBeLessThan(165);
    // København–Odense about 135 km.
    expect(distanceKm(COPENHAGEN, ODENSE)).toBeGreaterThan(125);
    expect(distanceKm(COPENHAGEN, ODENSE)).toBeLessThan(145);
    // København–Bornholm about 140 km.
    expect(distanceKm(COPENHAGEN, BORNHOLM)).toBeGreaterThan(130);
    expect(distanceKm(COPENHAGEN, BORNHOLM)).toBeLessThan(150);
  });

  it("is zero for the same point and symmetric", () => {
    expect(distanceKm(COPENHAGEN, COPENHAGEN)).toBeCloseTo(0, 5);
    expect(distanceKm(COPENHAGEN, AARHUS)).toBeCloseTo(distanceKm(AARHUS, COPENHAGEN), 6);
  });

  it("does not flatten latitude, a degree of longitude is shorter up north", () => {
    // One degree of longitude at Danish latitudes is ~62km, not ~111km.
    const oneDegEast = distanceKm(COPENHAGEN, { lat: COPENHAGEN.lat, lng: COPENHAGEN.lng + 1 });
    const oneDegNorth = distanceKm(COPENHAGEN, { lat: COPENHAGEN.lat + 1, lng: COPENHAGEN.lng });
    expect(oneDegEast).toBeLessThan(oneDegNorth * 0.7);
  });
});

describe("distanceBetween", () => {
  it("returns whole kilometres", () => {
    const d = distanceBetween(COPENHAGEN, AARHUS.lat, AARHUS.lng);
    expect(d).not.toBeNull();
    expect(Number.isInteger(d)).toBe(true);
  });

  it("returns null rather than a wrong number when anything is missing", () => {
    // Unknown must never read as "far away" — that would hide good venues.
    expect(distanceBetween(null, AARHUS.lat, AARHUS.lng)).toBeNull();
    expect(distanceBetween(COPENHAGEN, null, 10)).toBeNull();
    expect(distanceBetween(COPENHAGEN, 56, null)).toBeNull();
    expect(distanceBetween(COPENHAGEN, NaN, 10)).toBeNull();
  });
});
