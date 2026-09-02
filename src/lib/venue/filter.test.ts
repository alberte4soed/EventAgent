import { describe, it, expect } from "vitest";
import { evaluateVenue, applyFilters, type VenueFilters, type Rankable } from "./filter";
import { EMPTY_FACTS, type VenueFacts } from "./facts";
import { EMPTY_AMENITIES, type PlaceAmenities } from "./amenities";

const facts = (over: Partial<VenueFacts> = {}): VenueFacts => ({ ...EMPTY_FACTS, ...over });
const venue = (f: Partial<VenueFacts> = {}, rest: Partial<Rankable> = {}): Rankable => ({
  facts: facts(f),
  rating: 4.5,
  review_count: 100,
  ...rest,
});

describe("capacity, the one hard filter", () => {
  const filters: VenueFilters = { min_capacity: 70 };

  it("drops a venue that is known to be too small", () => {
    const v = evaluateVenue(venue({ capacity_seated: 50 }), filters);
    expect(v.keep).toBe(false);
    expect(v.rejectedBy).toBe("capacity");
  });

  it("keeps a venue that fits", () => {
    expect(evaluateVenue(venue({ capacity_seated: 120 }), filters).keep).toBe(true);
  });

  it("keeps a venue with unknown capacity, and says so", () => {
    const v = evaluateVenue(venue(), filters);
    expect(v.keep).toBe(true);
    expect(v.badges.map((b) => b.id)).toContain("capacity-unknown");
  });

  it("falls back to standing capacity when seated is unknown", () => {
    expect(evaluateVenue(venue({ capacity_standing: 150 }), filters).keep).toBe(true);
    expect(evaluateVenue(venue({ capacity_standing: 40 }), filters).keep).toBe(false);
  });

  it("ignores capacity entirely when no guest count is set", () => {
    expect(evaluateVenue(venue({ capacity_seated: 10 }), {}).keep).toBe(true);
  });

  it("prefers roomy over a squeeze", () => {
    const squeeze = evaluateVenue(venue({ capacity_seated: 72 }), filters).score;
    const comfy = evaluateVenue(venue({ capacity_seated: 110 }), filters).score;
    const cavern = evaluateVenue(venue({ capacity_seated: 900 }), filters).score;
    expect(comfy).toBeGreaterThan(squeeze);
    expect(comfy).toBeGreaterThan(cavern);
  });
});

describe("budget, soft by default", () => {
  const filters: VenueFilters = { min_capacity: 70, budget_max: 100_000 };

  it("keeps an over-budget venue but sinks it and warns", () => {
    const over = evaluateVenue(venue({ capacity_seated: 100, price_from: 180_000, price_unit: "total" }), filters);
    const under = evaluateVenue(venue({ capacity_seated: 100, price_from: 60_000, price_unit: "total" }), filters);
    expect(over.keep).toBe(true);
    expect(over.misses).toContain("budget");
    expect(over.badges.find((b) => b.id === "price")?.tone).toBe("warn");
    expect(under.score).toBeGreaterThan(over.score);
  });

  it("drops it once the couple requires the budget", () => {
    const v = evaluateVenue(venue({ capacity_seated: 100, price_from: 180_000, price_unit: "total" }), {
      ...filters,
      require: ["budget"],
    });
    expect(v.keep).toBe(false);
    expect(v.rejectedBy).toBe("budget");
  });

  it("compares a per-guest price as a total", () => {
    // 850 kr × 70 guests = 59.500 — inside a 100.000 budget.
    const v = evaluateVenue(venue({ capacity_seated: 100, price_from: 850, price_unit: "per_guest" }), {
      ...filters,
      require: ["budget"],
    });
    expect(v.keep).toBe(true);
    // 1.800 kr × 70 = 126.000 — outside it.
    const dear = evaluateVenue(venue({ capacity_seated: 100, price_from: 1800, price_unit: "per_guest" }), {
      ...filters,
      require: ["budget"],
    });
    expect(dear.keep).toBe(false);
  });

  it("never drops a venue with an unknown price, even when required", () => {
    const v = evaluateVenue(venue({ capacity_seated: 100 }), { ...filters, require: ["budget"] });
    expect(v.keep).toBe(true);
    expect(v.badges.map((b) => b.id)).toContain("price-unknown");
  });
});

describe("catering", () => {
  const filters: VenueFilters = { catering: "in_house" };

  it("badges in-house catering and boosts it", () => {
    const inHouse = evaluateVenue(venue({ catering: "in_house" }), filters);
    const external = evaluateVenue(venue({ catering: "external_allowed" }), filters);
    expect(inHouse.badges.find((b) => b.id === "catering")?.text).toBe("Catering i huset");
    expect(inHouse.score).toBeGreaterThan(external.score);
    expect(external.misses).toContain("catering");
    expect(external.keep).toBe(true);
  });

  it("drops non-matching catering only when required", () => {
    expect(evaluateVenue(venue({ catering: "external_allowed" }), { ...filters, require: ["catering"] }).keep).toBe(false);
    expect(evaluateVenue(venue({ catering: "unknown" }), { ...filters, require: ["catering"] }).keep).toBe(true);
  });

  it("says nothing about catering when the couple did not ask", () => {
    const v = evaluateVenue(venue({ catering: "unknown" }), {});
    expect(v.badges.map((b) => b.id)).not.toContain("catering-unknown");
    expect(v.misses).not.toContain("catering");
  });
});

describe("accommodation", () => {
  it("counts nearby lodging when the couple accepts nearby", () => {
    const filters: VenueFilters = { accommodation: "on_site_or_nearby" };
    const nearby = evaluateVenue(venue({ accommodation: "nearby" }), filters);
    expect(nearby.keep).toBe(true);
    expect(nearby.misses).not.toContain("accommodation");
    expect(nearby.badges.find((b) => b.id === "accommodation")?.text).toBe("Overnatning i nærheden");
  });

  it("does not count nearby when the couple insists on on-site", () => {
    const filters: VenueFilters = { accommodation: "on_site" };
    const nearby = evaluateVenue(venue({ accommodation: "nearby" }), filters);
    expect(nearby.misses).toContain("accommodation");
    expect(nearby.keep).toBe(true);
    expect(evaluateVenue(venue({ accommodation: "nearby" }), { ...filters, require: ["accommodation"] }).keep).toBe(false);
  });

  it("shows the room count when it has one", () => {
    const v = evaluateVenue(venue({ accommodation: "on_site", rooms: 12 }), { accommodation: "on_site" });
    expect(v.badges.find((b) => b.id === "accommodation")?.text).toBe("12 værelser på stedet");
  });

  it("drops 'none' only when required", () => {
    const filters: VenueFilters = { accommodation: "on_site" };
    expect(evaluateVenue(venue({ accommodation: "none" }), filters).keep).toBe(true);
    expect(evaluateVenue(venue({ accommodation: "none" }), { ...filters, require: ["accommodation"] }).keep).toBe(false);
  });
});

describe("applyFilters", () => {
  it("sorts kept venues by score and reports why the rest went", () => {
    const list = [
      venue({ capacity_seated: 40 }),                       // too small
      venue({ capacity_seated: 120 }, { rating: 4.2, review_count: 300 }),
      venue({ capacity_seated: 110, accommodation: "on_site", rooms: 10 }, { rating: 4.2, review_count: 300 }),
    ];
    const { kept, rejected } = applyFilters(list, { min_capacity: 70, accommodation: "on_site" });
    expect(kept).toHaveLength(2);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].verdict.rejectedBy).toBe("capacity");
    // The one with on-site rooms outranks the equally-rated one without.
    expect(kept[0].venue.facts.accommodation).toBe("on_site");
  });

  it("keeps everything when there are no filters", () => {
    const { kept } = applyFilters([venue(), venue({ capacity_seated: 8 })], {});
    expect(kept).toHaveLength(2);
  });
});

const amen = (over: Partial<PlaceAmenities> = {}): PlaceAmenities => ({ ...EMPTY_AMENITIES, ...over });

describe("ceremony", () => {
  const filters: VenueFilters = { ceremony: "on_site" };

  it("badges a venue you can be married at", () => {
    expect(evaluateVenue(venue({ ceremony: "on_site" }), filters).badges.map((b) => b.text))
      .toContain("Vielse på stedet");
    expect(evaluateVenue(venue({ ceremony: "outdoor" }), filters).badges.map((b) => b.text))
      .toContain("Udendørs vielse");
  });

  it("keeps a venue with no ceremony until the couple requires one", () => {
    expect(evaluateVenue(venue({ ceremony: "none" }), filters).keep).toBe(true);
    expect(evaluateVenue(venue({ ceremony: "none" }), { ...filters, require: ["ceremony"] }).keep).toBe(false);
  });

  it("never drops an unknown, even when required", () => {
    expect(evaluateVenue(venue({ ceremony: "unknown" }), { ...filters, require: ["ceremony"] }).keep).toBe(true);
  });

  it("outranks an equal venue without a ceremony", () => {
    const withIt = evaluateVenue(venue({ ceremony: "on_site" }), filters).score;
    const without = evaluateVenue(venue({ ceremony: "unknown" }), filters).score;
    expect(withIt).toBeGreaterThan(without);
  });
});

describe("curfew, hours after midnight are late, not early", () => {
  it("treats 02:00 as later than 23:00", () => {
    // The bug a plain >= would cause: 2 < 23, so a 02:00 curfew would read
    // as failing a "must run to 23:00" filter.
    const v = evaluateVenue(venue({ curfew_hour: 2 }), { min_curfew: 23 });
    expect(v.misses).not.toContain("curfew");
  });

  it("misses when the party has to stop too early", () => {
    const v = evaluateVenue(venue({ curfew_hour: 23 }), { min_curfew: 2 });
    expect(v.misses).toContain("curfew");
    expect(v.keep).toBe(true);
    expect(evaluateVenue(venue({ curfew_hour: 23 }), { min_curfew: 2, require: ["curfew"] }).keep).toBe(false);
  });

  it("badges the actual end time", () => {
    expect(evaluateVenue(venue({ curfew_hour: 1 }), {}).badges.map((b) => b.text))
      .toContain("Festen til kl. 01");
  });

  it("keeps an unknown curfew even when required", () => {
    expect(evaluateVenue(venue(), { min_curfew: 2, require: ["curfew"] }).keep).toBe(true);
  });
});

describe("own drinks and exclusivity", () => {
  it("distinguishes allowed from corkage from banned", () => {
    expect(evaluateVenue(venue({ own_drinks: "allowed" }), {}).badges.map((b) => b.text))
      .toContain("Egne drikkevarer tilladt");
    expect(evaluateVenue(venue({ own_drinks: "corkage" }), {}).badges.map((b) => b.text))
      .toContain("Egne drikkevarer mod gebyr");
    const banned = evaluateVenue(venue({ own_drinks: "not_allowed" }), { own_drinks: "allowed" });
    expect(banned.misses).toContain("own_drinks");
    expect(banned.keep).toBe(true);
  });

  it("drops a shared venue only when sole use is required", () => {
    const f: VenueFilters = { exclusive: "sole_use" };
    expect(evaluateVenue(venue({ exclusive: "shared" }), f).keep).toBe(true);
    expect(evaluateVenue(venue({ exclusive: "shared" }), { ...f, require: ["exclusive"] }).keep).toBe(false);
    expect(evaluateVenue(venue({ exclusive: "unknown" }), { ...f, require: ["exclusive"] }).keep).toBe(true);
  });
});

describe("Google-reported amenities", () => {
  it("badges what Google confirms", () => {
    const v = evaluateVenue(
      { facts: facts(), amenities: amen({ wheelchair: true, parking: "free", children: true, dogs: true }) },
      {},
    );
    const texts = v.badges.map((b) => b.text);
    expect(texts).toContain("Kørestolsvenlig");
    expect(texts).toContain("Gratis parkering");
    expect(texts).toContain("Børnevenligt");
    expect(texts).toContain("Hunde tilladt");
  });

  it("says nothing when Google knows nothing and nothing was asked", () => {
    const v = evaluateVenue({ facts: facts(), amenities: amen() }, {});
    const ids = v.badges.map((b) => b.id);
    expect(ids).not.toContain("wheelchair");
    expect(ids).not.toContain("parking");
  });

  it("drops on an explicit Google no, but never on silence", () => {
    const f: VenueFilters = { wheelchair: true, require: ["wheelchair"] };
    expect(evaluateVenue({ facts: facts(), amenities: amen({ wheelchair: false }) }, f).keep).toBe(false);
    expect(evaluateVenue({ facts: facts(), amenities: amen({ wheelchair: null }) }, f).keep).toBe(true);
  });

  it("works for callers that carry no amenities at all", () => {
    expect(evaluateVenue(venue(), { wheelchair: true }).keep).toBe(true);
  });
});

describe("rating and distance", () => {
  it("keeps a low rating unless required", () => {
    const v = evaluateVenue({ facts: facts(), rating: 3.9 }, { min_rating: 4.5 });
    expect(v.misses).toContain("rating");
    expect(v.keep).toBe(true);
    expect(evaluateVenue({ facts: facts(), rating: 3.9 }, { min_rating: 4.5, require: ["rating"] }).keep).toBe(false);
    expect(evaluateVenue({ facts: facts(), rating: null }, { min_rating: 4.5, require: ["rating"] }).keep).toBe(true);
  });

  it("drops a venue outside the radius without needing to be required", () => {
    // Distance is measured, not inferred, so it is the one hard new rule.
    const v = evaluateVenue({ facts: facts(), distance_km: 120 }, { max_distance_km: 50 });
    expect(v.keep).toBe(false);
    expect(v.rejectedBy).toBe("distance");
    expect(evaluateVenue({ facts: facts(), distance_km: 20 }, { max_distance_km: 50 }).keep).toBe(true);
    // Unknown distance still survives.
    expect(evaluateVenue({ facts: facts() }, { max_distance_km: 50 }).keep).toBe(true);
  });
});

describe("sorting", () => {
  const list: Rankable[] = [
    { facts: facts({ price_from: 90_000, price_unit: "total" }), rating: 4.1, distance_km: 80 },
    { facts: facts({ price_from: 40_000, price_unit: "total" }), rating: 4.9, distance_km: 10 },
    { facts: facts(), rating: 4.5, distance_km: 30 },
  ];

  it("sorts by rating, price and distance", () => {
    expect(applyFilters(list, {}, "da", "rating").kept[0].venue.rating).toBe(4.9);
    expect(applyFilters(list, {}, "da", "price").kept[0].venue.facts.price_from).toBe(40_000);
    expect(applyFilters(list, {}, "da", "distance").kept[0].venue.distance_km).toBe(10);
  });

  it("sorts venues missing the key last, not first", () => {
    // A venue with no price must not read as "cheapest".
    const byPrice = applyFilters(list, {}, "da", "price").kept;
    expect(byPrice[byPrice.length - 1].venue.facts.price_from).toBeNull();
  });
});
