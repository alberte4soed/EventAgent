import { describe, it, expect } from "vitest";
import { parseInviteConfig, DEFAULT_INVITE } from "./config";

describe("parseInviteConfig", () => {
  it("returns full defaults for empty/nullish input", () => {
    expect(parseInviteConfig(null)).toEqual(DEFAULT_INVITE);
    expect(parseInviteConfig(undefined)).toEqual(DEFAULT_INVITE);
    expect(parseInviteConfig({})).toEqual(DEFAULT_INVITE);
  });

  it("whitelists palette/font/alignment/composition, falling back on junk", () => {
    const c = parseInviteConfig({
      paletteId: "not-a-palette", fontId: "<script>", alignment: "diagonal", composition: "weird",
    });
    expect(c.paletteId).toBe(DEFAULT_INVITE.paletteId);
    expect(c.fontId).toBe(DEFAULT_INVITE.fontId);
    expect(c.alignment).toBe(DEFAULT_INVITE.alignment);
    expect(c.composition).toBe(DEFAULT_INVITE.composition);
  });

  it("keeps valid enum tokens", () => {
    const c = parseInviteConfig({ paletteId: "ivory-brown", fontId: "playfair", alignment: "left", composition: "top" });
    expect(c.paletteId).toBe("ivory-brown");
    expect(c.fontId).toBe("playfair");
    expect(c.alignment).toBe("left");
    expect(c.composition).toBe("top");
  });

  it("seeds look from a valid preset id and clears an invalid one", () => {
    const c = parseInviteConfig({ presetId: "ivory-brun" });
    expect(c.presetId).toBe("ivory-brun");
    expect(c.paletteId).toBe("ivory-brown");
    expect(c.fontId).toBe("eb-garamond");
    expect(parseInviteConfig({ presetId: "nope" }).presetId).toBeNull();
  });

  it("only accepts YYYY-MM-DD for dateISO", () => {
    expect(parseInviteConfig({ dateISO: "2026-09-12" }).dateISO).toBe("2026-09-12");
    expect(parseInviteConfig({ dateISO: "12/09/2026" }).dateISO).toBe("");
    expect(parseInviteConfig({ dateISO: 42 }).dateISO).toBe("");
  });

  it("rejects unsafe photo paths and slices long text", () => {
    expect(parseInviteConfig({ photoPath: "user/evt/hero-1.png" }).photoPath).toBe("user/evt/hero-1.png");
    expect(parseInviteConfig({ photoPath: "javascript:alert(1)" }).photoPath).toBe("");
    expect(parseInviteConfig({ message: "x".repeat(5000) }).message.length).toBe(1200);
  });

  it("defaults the envelope and coerces its fields", () => {
    const c = parseInviteConfig({ envelope: { enabled: false, monogram: 123, note: "Hi" } });
    expect(c.envelope.enabled).toBe(false);
    expect(c.envelope.monogram).toBe(DEFAULT_INVITE.envelope.monogram);
    expect(c.envelope.note).toBe("Hi");
  });

  it("parses a program array and drops malformed rows' fields", () => {
    const c = parseInviteConfig({ program: [{ time: "14:00", label: "Vielse" }, "nope", { time: 5 }] });
    expect(c.program[0]).toEqual({ time: "14:00", label: "Vielse" });
    expect(c.program[1]).toEqual({ time: "", label: "" });
  });
});
