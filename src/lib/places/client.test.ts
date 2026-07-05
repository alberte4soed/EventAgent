import { describe, it, expect } from "vitest";
import { nameSimilarity, urlHost, emailMatchesWebsite } from "./client";

describe("nameSimilarity", () => {
  it("scores identical names as a perfect match", () => {
    expect(nameSimilarity("The Old Mill", "The Old Mill")).toBe(1);
  });

  it("ignores stop words and punctuation", () => {
    expect(nameSimilarity("The Old Mill", "Old Mill!")).toBeGreaterThanOrEqual(0.5);
  });

  it("keeps distinct businesses below the match threshold", () => {
    expect(nameSimilarity("The Old Mill", "Riverside Barn")).toBeLessThan(0.5);
  });
});

describe("urlHost", () => {
  it("strips protocol and www", () => {
    expect(urlHost("https://www.venue.com/contact")).toBe("venue.com");
    expect(urlHost("venue.com")).toBe("venue.com");
  });

  it("returns null for junk", () => {
    expect(urlHost(null)).toBeNull();
    expect(urlHost("not a url")).toBeNull();
  });
});

describe("emailMatchesWebsite", () => {
  it("accepts an email whose domain matches the site host", () => {
    expect(emailMatchesWebsite("info@venue.com", "https://www.venue.com")).toBe(true);
  });

  it("accepts subdomain relationships", () => {
    expect(emailMatchesWebsite("events@mail.venue.com", "https://venue.com")).toBe(true);
  });

  it("rejects mismatched domains", () => {
    expect(emailMatchesWebsite("someone@gmail.com", "https://venue.com")).toBe(false);
    expect(emailMatchesWebsite(null, "https://venue.com")).toBe(false);
  });
});
