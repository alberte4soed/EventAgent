import { describe, it, expect } from "vitest";
import { ratingScore, rankScore } from "./ranking";
import { EMPTY_FACTS, type VenueFacts } from "./venue/facts";

describe("ratingScore", () => {
  it("returns the prior for unrated places", () => {
    expect(ratingScore(undefined, undefined)).toBeCloseTo(4.1);
    expect(ratingScore(0, 0)).toBeCloseTo(4.1);
  });

  it("pulls low-count ratings toward the prior", () => {
    // 5.0 with 3 reviews should score below 4.8 with 400.
    const few = ratingScore(5.0, 3);
    const many = ratingScore(4.8, 400);
    expect(many).toBeGreaterThan(few);
  });

  it("approaches the true rating as review count grows", () => {
    expect(ratingScore(4.6, 5000)).toBeCloseTo(4.6, 1);
  });
});

describe("rankScore", () => {
  it("adds a capacity-fit boost when capacity covers guests", () => {
    const base = rankScore(
      { extracted: { capacity: "up to 50" }, place: { rating: 4.5, userRatingCount: 100 } },
      150,
      []
    );
    const fits = rankScore(
      { extracted: { capacity: "up to 200" }, place: { rating: 4.5, userRatingCount: 100 } },
      150,
      []
    );
    expect(fits).toBeGreaterThan(base);
  });

  it("boosts vibe keyword matches, capped at three", () => {
    const none = rankScore(
      { extracted: { description: "a hall" }, place: { rating: 4.5, userRatingCount: 100 } },
      null,
      ["garden"]
    );
    const hit = rankScore(
      { extracted: { description: "a garden estate", why_fit: "lush garden setting" }, place: { rating: 4.5, userRatingCount: 100 } },
      null,
      ["garden"]
    );
    expect(hit).toBeGreaterThan(none);
  });
});

describe("rankScore with structured facts", () => {
  const place = { rating: 4.5, userRatingCount: 100 };
  const facts = (over: Partial<VenueFacts> = {}): VenueFacts => ({ ...EMPTY_FACTS, ...over });

  it("prefers a comfortable fit over a squeeze", () => {
    const squeeze = rankScore({ extracted: {}, place }, 70, [], { facts: facts({ capacity_seated: 72 }) });
    const comfy = rankScore({ extracted: {}, place }, 70, [], { facts: facts({ capacity_seated: 110 }) });
    expect(comfy).toBeGreaterThan(squeeze);
  });

  it("punishes a venue that cannot hold the wedding", () => {
    const tooSmall = rankScore({ extracted: {}, place }, 70, [], { facts: facts({ capacity_seated: 40 }) });
    const unknown = rankScore({ extracted: {}, place }, 70, [], { facts: facts() });
    expect(tooSmall).toBeLessThan(unknown);
  });

  it("scores a per-guest price against the budget as a total", () => {
    // 850 × 70 = 59.500, well inside 150.000.
    const inBudget = rankScore({ extracted: {}, place }, 70, [], {
      facts: facts({ price_from: 850, price_unit: "per_guest" }),
      budget: 150_000,
    });
    const overBudget = rankScore({ extracted: {}, place }, 70, [], {
      facts: facts({ price_from: 4000, price_unit: "per_guest" }),
      budget: 150_000,
    });
    expect(inBudget).toBeGreaterThan(overBudget);
  });

  it("still uses the free-text capacity when there are no facts", () => {
    const base = rankScore({ extracted: { capacity: "up to 50" }, place }, 150, []);
    const fits = rankScore({ extracted: { capacity: "up to 200" }, place }, 150, []);
    expect(fits).toBeGreaterThan(base);
  });
});
