import { createHmac } from "crypto";

/** Cookie name for a verified password-protected public site. */
export const siteCookieName = (slug: string) => `kalas_site_${slug}`;

/**
 * Deterministic, unforgeable cookie value for a (slug, password) pair, keyed by
 * a server-only secret. The public page recomputes this from the stored
 * password and compares; a guest can't fabricate it without the secret.
 */
export function siteCookieValue(slug: string, password: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "kalas-dev-secret";
  return createHmac("sha256", secret).update(`${slug}:${password}`).digest("hex");
}

/**
 * Whether a password-protected site is locked for this request. Shared by
 * every public page under /w/[slug] so the gate can't be bypassed via a
 * sub-page like /photos. `config` is the raw wedding_sites.config blob.
 */
export function isSiteLocked(
  slug: string,
  config: Record<string, unknown> | null | undefined,
  cookieValue: string | undefined
): boolean {
  const pwProtected = config?.pwProtected === true;
  const rawPassword = typeof config?.sitePassword === "string" ? (config.sitePassword as string) : "";
  if (!pwProtected || !rawPassword) return false;
  return cookieValue !== siteCookieValue(slug, rawPassword);
}
