/* Address validation, kept apart from the rest of the invite module so the
   onboarding form can import it. `partner.ts` pulls in node:crypto for the
   token, which must never reach the browser bundle. */

/** Cheap sanity check, not RFC 5322. The real verdict is whether it bounces. */
export function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
