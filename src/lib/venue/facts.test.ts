import { describe, it, expect } from "vitest";
import {
  EMPTY_FACTS,
  parseCapacity,
  parsePrice,
  parsePriceUnit,
  normalizeFacts,
  capacityOf,
  estimatedTotal,
} from "./facts";

describe("parseCapacity", () => {
  it("reads the Danish free text venues actually return", () => {
    expect(parseCapacity("Op til 140 gæster")).toBe(140);
    expect(parseCapacity("80-200 gæster")).toBe(200);
    expect(parseCapacity("Plads til 1.200 personer")).toBe(1200);
    expect(parseCapacity("up to 50")).toBe(50);
  });

  it("takes the maximum, so a range never hides a venue that fits", () => {
    expect(parseCapacity("fra 40 til 120 siddende gæster")).toBe(120);
  });

  it("returns null when there is no usable number", () => {
    expect(parseCapacity(null)).toBeNull();
    expect(parseCapacity("")).toBeNull();
    expect(parseCapacity("kontakt os")).toBeNull();
    expect(parseCapacity("1 gæst")).toBeNull(); // below the venue floor
    expect(parseCapacity("99999 gæster")).toBeNull(); // above the ceiling
  });
});

describe("parsePrice", () => {
  it("reads Danish thousand separators", () => {
    expect(parsePrice("62.000 kr")).toBe(62000);
    expect(parsePrice("fra 850 kr. pr. kuvert")).toBe(850);
    expect(parsePrice("1.200.000 kr")).toBe(1200000);
  });

  it("takes the entry price from a range", () => {
    expect(parsePrice("50.000–90.000 kr")).toBe(50000);
  });

  it("drops decimal tails", () => {
    expect(parsePrice("1.500,50 kr")).toBe(1500);
  });

  it("ignores years", () => {
    expect(parsePrice("sæson 2026")).toBeNull();
    expect(parsePrice("2026: fra 45.000 kr")).toBe(45000);
  });

  it("returns null when there is no price", () => {
    expect(parsePrice(null)).toBeNull();
    expect(parsePrice("pris efter aftale")).toBeNull();
  });
});

describe("parsePriceUnit", () => {
  it("spots per-guest quotes in both languages", () => {
    expect(parsePriceUnit("fra 850 kr. pr. kuvert")).toBe("per_guest");
    expect(parsePriceUnit("450 kr pr. person")).toBe("per_guest");
    expect(parsePriceUnit("120 EUR per guest")).toBe("per_guest");
    expect(parsePriceUnit("850 kr p.p.")).toBe("per_guest");
  });

  it("does not fire on 'pp' inside an ordinary word", () => {
    expect(parsePriceUnit("62.000 kr for hele huset, supper included")).toBe("total");
  });

  it("defaults to a total hire fee", () => {
    expect(parsePriceUnit("62.000 kr")).toBe("total");
    expect(parsePriceUnit(null)).toBeNull();
  });
});

describe("normalizeFacts", () => {
  it("keeps valid structured values", () => {
    const facts = normalizeFacts({
      capacity_seated: 120,
      capacity_standing: 200,
      price_from: 65000,
      price_unit: "total",
      catering: "in_house",
      accommodation: "on_site",
      rooms: 12,
      setting: "manor",
    });
    expect(facts).toEqual({
      ...EMPTY_FACTS,
      capacity_seated: 120,
      capacity_standing: 200,
      price_from: 65000,
      price_unit: "total",
      catering: "in_house",
      accommodation: "on_site",
      rooms: 12,
      setting: "manor",
    });
  });

  it("falls back to legacy free text when the model gave nothing", () => {
    const facts = normalizeFacts({}, { capacity: "Op til 140 gæster", price_hint: "fra 850 kr. pr. kuvert" });
    expect(facts.capacity_seated).toBe(140);
    expect(facts.price_from).toBe(850);
    expect(facts.price_unit).toBe("per_guest");
  });

  it("prefers a structured number over the legacy text", () => {
    const facts = normalizeFacts({ capacity_seated: 90 }, { capacity: "Op til 140 gæster" });
    expect(facts.capacity_seated).toBe(90);
  });

  it("does not overwrite a standing-only capacity with ambiguous text", () => {
    const facts = normalizeFacts({ capacity_standing: 300 }, { capacity: "Op til 140 gæster" });
    expect(facts.capacity_seated).toBeNull();
    expect(facts.capacity_standing).toBe(300);
    expect(capacityOf(facts)).toBe(300);
  });

  it("degrades garbage to unknown rather than guessing", () => {
    const facts = normalizeFacts({
      capacity_seated: "lots",
      price_from: -5,
      catering: "maybe",
      accommodation: "sometimes",
      setting: "spaceship",
    });
    expect(facts.capacity_seated).toBeNull();
    expect(facts.price_from).toBeNull();
    expect(facts.price_unit).toBeNull();
    expect(facts.catering).toBe("unknown");
    expect(facts.accommodation).toBe("unknown");
    expect(facts.setting).toBeNull();
  });

  it("drops a room count that contradicts 'no accommodation'", () => {
    expect(normalizeFacts({ accommodation: "none", rooms: 8 }).rooms).toBeNull();
    expect(normalizeFacts({ accommodation: "on_site", rooms: 8 }).rooms).toBe(8);
  });
});

describe("capacityOf / estimatedTotal", () => {
  it("prefers seated, falls back to standing", () => {
    expect(capacityOf({ capacity_seated: 80, capacity_standing: 200 })).toBe(80);
    expect(capacityOf({ capacity_seated: null, capacity_standing: 200 })).toBe(200);
    expect(capacityOf({ capacity_seated: null, capacity_standing: null })).toBeNull();
  });

  it("multiplies a per-guest price out to a comparable total", () => {
    expect(estimatedTotal({ price_from: 850, price_unit: "per_guest" }, 70)).toBe(59500);
    expect(estimatedTotal({ price_from: 62000, price_unit: "total" }, 70)).toBe(62000);
    // Per-guest with no guest count cannot be compared to a budget.
    expect(estimatedTotal({ price_from: 850, price_unit: "per_guest" }, null)).toBeNull();
    expect(estimatedTotal({ price_from: null, price_unit: null }, 70)).toBeNull();
  });
});

describe("the Danish questions", () => {
  it("keeps valid ceremony, drinks, exclusivity and curfew", () => {
    const facts = normalizeFacts({
      ceremony: "outdoor",
      own_drinks: "corkage",
      exclusive: "sole_use",
      curfew_hour: 2,
    });
    expect(facts.ceremony).toBe("outdoor");
    expect(facts.own_drinks).toBe("corkage");
    expect(facts.exclusive).toBe("sole_use");
    expect(facts.curfew_hour).toBe(2);
  });

  it("degrades anything it does not recognise to unknown", () => {
    const facts = normalizeFacts({
      ceremony: "maybe",
      own_drinks: "ask us",
      exclusive: "depends",
      curfew_hour: "late",
    });
    expect(facts.ceremony).toBe("unknown");
    expect(facts.own_drinks).toBe("unknown");
    expect(facts.exclusive).toBe("unknown");
    expect(facts.curfew_hour).toBeNull();
  });

  it("rejects a curfew that is not a clock hour", () => {
    // 850 is a menu price the model put in the wrong field.
    expect(normalizeFacts({ curfew_hour: 850 }).curfew_hour).toBeNull();
    expect(normalizeFacts({ curfew_hour: -1 }).curfew_hour).toBeNull();
    expect(normalizeFacts({ curfew_hour: 0 }).curfew_hour).toBe(0); // midnight
    expect(normalizeFacts({ curfew_hour: 23 }).curfew_hour).toBe(23);
  });
});

describe("outdoor and the rain plan", () => {
  it("keeps a rain plan for a venue with outdoor space", () => {
    expect(normalizeFacts({ outdoor: "garden", rain_plan: true }).rain_plan).toBe(true);
    expect(normalizeFacts({ outdoor: "terrace", rain_plan: false }).rain_plan).toBe(false);
  });

  it("drops a rain plan that contradicts having no outdoor space", () => {
    expect(normalizeFacts({ outdoor: "none", rain_plan: true }).rain_plan).toBeNull();
  });

  it("treats an unknown rain plan as unknown, not false", () => {
    expect(normalizeFacts({ outdoor: "garden" }).rain_plan).toBeNull();
    expect(normalizeFacts({ outdoor: "garden", rain_plan: "ja" }).rain_plan).toBeNull();
  });
});
