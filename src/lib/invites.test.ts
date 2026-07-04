import { describe, it, expect } from "vitest";
import {
  pricePerCardCents,
  orderAmountCents,
  suggestedQuantity,
  INVITE_QUANTITIES,
} from "./invites";

describe("pricePerCardCents", () => {
  it("gives volume discounts at higher tiers", () => {
    expect(pricePerCardCents(25)).toBe(250);
    expect(pricePerCardCents(100)).toBe(220);
    expect(pricePerCardCents(150)).toBe(200);
    expect(pricePerCardCents(200)).toBe(200);
  });
});

describe("orderAmountCents", () => {
  it("multiplies quantity by the tiered per-card price", () => {
    expect(orderAmountCents(50)).toBe(50 * 250);
    expect(orderAmountCents(150)).toBe(150 * 200);
  });
});

describe("suggestedQuantity", () => {
  it("defaults to 50 when guest count is unknown", () => {
    expect(suggestedQuantity(null)).toBe(50);
  });

  it("rounds up toward one card per household (~60% of guests)", () => {
    // 100 guests → ~60 needed → nearest offered tier at or above.
    expect(suggestedQuantity(100)).toBe(75);
  });

  it("never exceeds the largest offered quantity", () => {
    const max = INVITE_QUANTITIES[INVITE_QUANTITIES.length - 1];
    expect(suggestedQuantity(100000)).toBe(max);
  });
});
