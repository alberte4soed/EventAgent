/**
 * Image type from magic bytes.
 *
 * The couple-facing upload route can trust `file.type`, because it sits behind
 * auth. The guest album route cannot: the Content-Type of a multipart part is
 * whatever the client says it is, so an attacker can label an HTML or SVG
 * payload `image/jpeg` and have it served back from our storage domain.
 * Sniffing the actual bytes is the only honest check.
 */
export type ImageExt = "jpg" | "png" | "webp";

export function sniffImageType(bytes: Uint8Array): ImageExt | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "png";
  }
  // WebP: 'RIFF' …4 byte size… 'WEBP'
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

/** MIME to store the object under, derived from the sniffed bytes only. */
export const CONTENT_TYPE: Record<ImageExt, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
