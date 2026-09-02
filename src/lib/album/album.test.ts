import { describe, it, expect } from "vitest";
import { sniffImageType } from "./sniff";
import { ALBUM_LIMITS, checkLimits, uploaderHash, clientIp } from "./limits";

const bytes = (...b: number[]) => new Uint8Array(b);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00);
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50);

describe("sniffImageType", () => {
  it("recognises real headers", () => {
    expect(sniffImageType(JPEG)).toBe("jpg");
    expect(sniffImageType(PNG)).toBe("png");
    expect(sniffImageType(WEBP)).toBe("webp");
  });

  it("reads the bytes, not the file name, a PNG renamed .jpg is still a PNG", () => {
    expect(sniffImageType(PNG)).toBe("png");
  });

  it("rejects HTML claiming to be an image", () => {
    // '<!DOCTYPE h' — the classic stored-XSS payload on a file host.
    const html = bytes(0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45, 0x20, 0x68);
    expect(sniffImageType(html)).toBeNull();
  });

  it("rejects SVG", () => {
    const svg = bytes(0x3c, 0x73, 0x76, 0x67, 0x20, 0x78, 0x6d, 0x6c, 0x6e, 0x73, 0x3d);
    expect(sniffImageType(svg)).toBeNull();
  });

  it("rejects a truncated file rather than reading past the end", () => {
    expect(sniffImageType(bytes(0xff, 0xd8))).toBeNull();
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e))).toBeNull();
    expect(sniffImageType(bytes())).toBeNull();
  });

  it("rejects RIFF that is not WebP (e.g. a .wav)", () => {
    const wav = bytes(0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45);
    expect(sniffImageType(wav)).toBeNull();
  });
});

describe("checkLimits", () => {
  const at = (over: Partial<Parameters<typeof checkLimits>[0]> = {}) =>
    checkLimits({ eventTotal: 0, lastHourEvent: 0, last24hUploader: 0, ...over });

  it("passes an empty album", () => {
    expect(at()).toEqual({ ok: true });
  });

  it("blocks exactly at the per-event cap, not one before", () => {
    expect(at({ eventTotal: ALBUM_LIMITS.perEvent - 1 }).ok).toBe(true);
    expect(at({ eventTotal: ALBUM_LIMITS.perEvent }).ok).toBe(false);
    expect(at({ eventTotal: ALBUM_LIMITS.perEvent + 1 }).ok).toBe(false);
  });

  it("blocks exactly at the hourly burst cap", () => {
    expect(at({ lastHourEvent: ALBUM_LIMITS.perEventPerHour - 1 }).ok).toBe(true);
    expect(at({ lastHourEvent: ALBUM_LIMITS.perEventPerHour }).ok).toBe(false);
  });

  it("blocks exactly at the per-uploader daily cap", () => {
    expect(at({ last24hUploader: ALBUM_LIMITS.perUploaderPerDay - 1 }).ok).toBe(true);
    expect(at({ last24hUploader: ALBUM_LIMITS.perUploaderPerDay }).ok).toBe(false);
  });

  it("returns 429 with a Danish message the guest can act on", () => {
    const res = at({ eventTotal: ALBUM_LIMITS.perEvent });
    expect(res).toMatchObject({ ok: false, status: 429 });
    if (!res.ok) expect(res.message.length).toBeGreaterThan(0);
  });
});

describe("uploaderHash", () => {
  it("is stable for the same ip and slug", () => {
    expect(uploaderHash("1.2.3.4", "anna-bo")).toBe(uploaderHash("1.2.3.4", "anna-bo"));
  });

  it("diverges across weddings, so a guest cannot be correlated", () => {
    expect(uploaderHash("1.2.3.4", "anna-bo")).not.toBe(uploaderHash("1.2.3.4", "cecilie-dan"));
  });

  it("diverges across ips", () => {
    expect(uploaderHash("1.2.3.4", "anna-bo")).not.toBe(uploaderHash("5.6.7.8", "anna-bo"));
  });

  it("never contains the raw ip", () => {
    expect(uploaderHash("192.168.1.55", "anna-bo")).not.toContain("192.168");
  });
});

describe("clientIp", () => {
  it("takes the first hop of X-Forwarded-For", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
  });

  it("falls back to X-Real-IP, then a constant", () => {
    expect(clientIp(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
