import { describe, it, expect } from "vitest";
import { ratingScore, rankScore } from "./ranking";

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
