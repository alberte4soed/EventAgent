import { describe, expect, it } from "vitest";
import { detectOutreachLanguage } from "./language";

describe("detectOutreachLanguage", () => {
  it("reads the country off a Google formatted address", () => {
    const lang = detectOutreachLanguage({
      address: "Strandvejen 1, 2900 Hellerup, Denmark",
    });
    expect(lang).toEqual({ code: "da", name: "Danish", source: "address" });
  });

  it("accepts the local spelling of the country", () => {
    expect(detectOutreachLanguage({ address: "Vestergade 5, Aarhus, Danmark" }).code).toBe("da");
    expect(detectOutreachLanguage({ address: "Via Roma 1, Firenze FI, Italia" }).code).toBe("it");
    expect(detectOutreachLanguage({ address: "Hauptstr. 3, Berlin, Deutschland" }).code).toBe("de");
  });

  it("defaults to English and says so", () => {
    expect(detectOutreachLanguage({})).toEqual({
      code: "en",
      name: "English",
      source: "default",
    });
    expect(detectOutreachLanguage({ address: "Some Road 4, Nowhere, Atlantis" }).code).toBe("en");
  });

  it("never mistakes a street name for a country", () => {
    // "Danmarksgade" would match a substring scan; the lookup is exact and
    // only looks at the final segment.
    expect(detectOutreachLanguage({ address: "Danmarksgade 5, Aalborg" }).source).toBe("default");
    expect(detectOutreachLanguage({ address: "Danmarksgade 5" }).source).toBe("default");
  });

  it("falls back to the website ccTLD when the address has no country", () => {
    const lang = detectOutreachLanguage({
      address: "Bredgade 12, København",
      website: "https://www.smukkekro.dk/bryllup",
    });
    expect(lang).toEqual({ code: "da", name: "Danish", source: "website" });
  });

  it("handles websites without a scheme and ignores generic TLDs", () => {
    expect(detectOutreachLanguage({ website: "hotell.se" }).code).toBe("sv");
    expect(detectOutreachLanguage({ website: "https://venue.com" }).source).toBe("default");
    expect(detectOutreachLanguage({ website: "not a url" }).source).toBe("default");
  });

  it("prefers the address over the website", () => {
    // A Danish agency site for an Italian venue: the venue is in Italy.
    const lang = detectOutreachLanguage({
      address: "Via Roma 1, 50122 Firenze, Italy",
      website: "https://bryllupsrejser.dk/toscana",
    });
    expect(lang).toEqual({ code: "it", name: "Italian", source: "address" });
  });

  it("falls back to the event location last", () => {
    const lang = detectOutreachLanguage({
      address: null,
      website: null,
      eventLocation: "Toscana, Italien",
    });
    expect(lang).toEqual({ code: "it", name: "Italian", source: "event" });
    // A bare city gives no country signal.
    expect(detectOutreachLanguage({ eventLocation: "nær København" }).source).toBe("default");
    expect(detectOutreachLanguage({ eventLocation: "Danmark" }).code).toBe("da");
  });

  it("keeps English-speaking countries in English", () => {
    expect(detectOutreachLanguage({ address: "1 High St, London, United Kingdom" }).code).toBe("en");
    expect(
      detectOutreachLanguage({ address: "5 Main St, Dublin, Ireland", website: "venue.it" }).code
    ).toBe("en");
  });

  it("leaves multilingual countries on the English default", () => {
    // Guessing Dutch-vs-French in Belgium is worse than writing English.
    expect(detectOutreachLanguage({ address: "Rue Haute 1, Brussels, Belgium" }).source).toBe("default");
    expect(detectOutreachLanguage({ address: "Bahnhofstrasse 1, Zürich, Switzerland" }).source).toBe("default");
  });

  it("tolerates trailing punctuation and casing", () => {
    expect(detectOutreachLanguage({ address: "Kungsgatan 1, Stockholm, SWEDEN." }).code).toBe("sv");
  });
});
