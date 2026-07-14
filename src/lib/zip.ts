/* Minimal STORE-only (no compression) ZIP writer for the photo export.
   Photos are already compressed, so deflating them again wastes CPU for ~0%
   gain — storing lets us stream the archive without buffering or deps.
   Format: local file headers + central directory + end-of-central-directory,
   UTF-8 filenames (general-purpose flag bit 11). 32-bit sizes only (no
   Zip64): fine for < 4 GB archives, which a wedding's photos stay well under. */

export type ZipEntry = { name: string; data: Uint8Array; mtime?: Date };

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS date/time pair used by the ZIP format (2-second resolution). */
function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

function le16(v: number): number[] { return [v & 0xff, (v >> 8) & 0xff]; }
function le32(v: number): number[] { return [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]; }

const UTF8_FLAG = 0x0800;

/**
 * Stream a ZIP archive: yields the byte chunks of local headers + stored file
 * data as entries arrive, then the central directory + end record. Entry
 * names should be unique; slashes create folders inside the archive.
 */
export async function* zipStream(entries: AsyncIterable<ZipEntry> | Iterable<ZipEntry>): AsyncGenerator<Uint8Array> {
  const central: number[] = [];
  let offset = 0;
  let count = 0;
  const encoder = new TextEncoder();

  for await (const entry of entries) {
    const name = encoder.encode(entry.name);
    const { time, date } = dosDateTime(entry.mtime ?? new Date());
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array([
      ...le32(0x04034b50), ...le16(20), ...le16(UTF8_FLAG), ...le16(0), // sig, version, flags, method=store
      ...le16(time), ...le16(date), ...le32(crc), ...le32(size), ...le32(size),
      ...le16(name.length), ...le16(0),
      ...name,
    ]);
    yield local;
    yield entry.data;

    central.push(
      ...le32(0x02014b50), ...le16(20), ...le16(20), ...le16(UTF8_FLAG), ...le16(0),
      ...le16(time), ...le16(date), ...le32(crc), ...le32(size), ...le32(size),
      ...le16(name.length), ...le16(0), ...le16(0), ...le16(0), ...le16(0), ...le32(0),
      ...le32(offset),
      ...name,
    );
    offset += local.length + size;
    count++;
  }

  const centralBytes = new Uint8Array(central);
  yield centralBytes;
  yield new Uint8Array([
    ...le32(0x06054b50), ...le16(0), ...le16(0), ...le16(count), ...le16(count),
    ...le32(centralBytes.length), ...le32(offset), ...le16(0),
  ]);
}

/** Collect a full archive into one buffer (small archives + tests). */
export async function zipBuffer(entries: ZipEntry[]): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of zipStream(entries)) chunks.push(chunk);
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  return out;
}
