import { describe, it, expect } from "vitest";
import { plusAddress, generateReplyTag, isPlatformAdmin } from "./platform";

describe("plusAddress", () => {
  it("injects a +tag before the @", () => {
    expect(plusAddress("kalas@example.com", "abc123")).toBe("kalas+abc123@example.com");
  });

  it("returns the input unchanged when there is no @", () => {
    expect(plusAddress("not-an-email", "x")).toBe("not-an-email");
  });
});

describe("generateReplyTag", () => {
  it("produces 8 lowercase base32 characters", () => {
    const tag = generateReplyTag();
    expect(tag).toMatch(/^[a-z2-9]{8}$/);
  });

  it("is effectively unique across calls", () => {
    const tags = new Set(Array.from({ length: 100 }, () => generateReplyTag()));
    expect(tags.size).toBe(100);
  });
});

describe("isPlatformAdmin", () => {
  it("matches emails listed in PLATFORM_ADMIN_EMAILS (case-insensitive)", () => {
    process.env.PLATFORM_ADMIN_EMAILS = "founder@kalas.com, ops@kalas.com";
    expect(isPlatformAdmin("Founder@Kalas.com")).toBe(true);
    expect(isPlatformAdmin("stranger@example.com")).toBe(false);
    expect(isPlatformAdmin(null)).toBe(false);
  });
});
