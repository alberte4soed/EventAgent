import { describe, it, expect } from "vitest";
import { crc32, zipBuffer } from "./zip";

const bytes = (s: string) => new TextEncoder().encode(s);
const readU32 = (buf: Uint8Array, off: number) =>
  (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0;
const readU16 = (buf: Uint8Array, off: number) => buf[off] | (buf[off + 1] << 8);

describe("crc32", () => {
  it("matches known vectors", () => {
    expect(crc32(bytes(""))).toBe(0);
    expect(crc32(bytes("123456789"))).toBe(0xcbf43926); // classic check value
  });
});

describe("zipBuffer", () => {
  it("produces a well-formed archive", async () => {
    const zip = await zipBuffer([
      { name: "a.txt", data: bytes("hello"), mtime: new Date(2026, 5, 1, 12, 0, 0) },
      { name: "dir/b.txt", data: bytes("verden"), mtime: new Date(2026, 5, 1, 12, 0, 0) },
    ]);

    // Local header signature at start.
    expect(readU32(zip, 0)).toBe(0x04034b50);
    // Stored (method 0) with the UTF-8 flag.
    expect(readU16(zip, 6)).toBe(0x0800);
    expect(readU16(zip, 8)).toBe(0);
    // CRC + sizes of the first entry.
    expect(readU32(zip, 14)).toBe(crc32(bytes("hello")));
    expect(readU32(zip, 18)).toBe(5);
    expect(readU32(zip, 22)).toBe(5);

    // End-of-central-directory record at the tail (no comment).
    const eocd = zip.length - 22;
    expect(readU32(zip, eocd)).toBe(0x06054b50);
    expect(readU16(zip, eocd + 10)).toBe(2); // entry count
    const cdSize = readU32(zip, eocd + 12);
    const cdOffset = readU32(zip, eocd + 16);
    expect(cdOffset + cdSize).toBe(eocd);
    // Central directory starts with its signature and points back at entry 0.
    expect(readU32(zip, cdOffset)).toBe(0x02014b50);
    expect(readU32(zip, cdOffset + 42)).toBe(0);

    // Raw stored data is present verbatim (STORE = no compression).
    const text = new TextDecoder().decode(zip);
    expect(text).toContain("hello");
    expect(text).toContain("verden");
    expect(text).toContain("dir/b.txt");
  });

  it("handles an empty archive", async () => {
    const zip = await zipBuffer([]);
    expect(zip.length).toBe(22);
    expect(readU32(zip, 0)).toBe(0x06054b50);
  });
});
