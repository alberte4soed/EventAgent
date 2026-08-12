import { createHmac } from "crypto";

/**
 * Guard rails for the guest album, which is the only unauthenticated write in
 * the app. Counted in Postgres rather than a KV store — there is no rate-limit
 * infrastructure in this project, and two indexed counts per upload is the
 * right cost for a few hundred photos per wedding.
 */
export const ALBUM_LIMITS = {
  /** Per file. Matches the couple-facing photo route. */
  maxBytes: 8 * 1024 * 1024,
  /** Total photos one wedding can hold. */
  perEvent: 500,
  /** Burst ceiling — a reception is busy, a script is busier. */
  perEventPerHour: 120,
  /** One phone should not be able to fill the album alone. */
  perUploaderPerDay: 60,
  maxNameLength: 60,
  maxCaptionLength: 200,
} as const;

/**
 * Stable pseudonymous id for an uploader. Never store the raw IP; the per-slug
 * salt also stops the same guest being correlated across two weddings.
 */
export function uploaderHash(ip: string, slug: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "kalas-dev-secret";
  return createHmac("sha256", secret).update(`${ip}:${slug}`).digest("hex");
}

export type LimitCheck =
  | { ok: true }
  | { ok: false; status: number; message: string };

export function checkLimits(counts: {
  eventTotal: number;
  lastHourEvent: number;
  last24hUploader: number;
}): LimitCheck {
  if (counts.eventTotal >= ALBUM_LIMITS.perEvent) {
    return { ok: false, status: 429, message: "Albummet er fyldt op." };
  }
  if (counts.lastHourEvent >= ALBUM_LIMITS.perEventPerHour) {
    return { ok: false, status: 429, message: "Der kommer mange billeder lige nu — prøv om lidt." };
  }
  if (counts.last24hUploader >= ALBUM_LIMITS.perUploaderPerDay) {
    return { ok: false, status: 429, message: "I har delt rigtig mange i dag — prøv igen i morgen." };
  }
  return { ok: true };
}

/** First hop of X-Forwarded-For, else a constant so the cap still applies. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
