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
