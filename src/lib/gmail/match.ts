// Pure helpers for attributing inbound platform-mailbox messages to an
// event (via the plus-address reply tag) and a venue (via the sender).
// No DB or network here — poll.ts orchestrates; this stays unit-testable.

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * All plus-tags addressed to the platform mailbox found in raw recipient
 * header values (To/Cc/Delivered-To/X-Original-To), lowercased and deduped
 * in first-seen order. Header values may contain display names and multiple
 * addresses; matching is case-insensitive and anchored so lookalike locals
 * ("otherevents+tag@") and domain suffixes ("@venli.ai.evil.com") miss.
 */
export function extractReplyTags(
  headerValues: Array<string | null | undefined>,
  platformEmail: string
): string[] {
  const at = platformEmail.indexOf("@");
  if (at <= 0) return [];
  const local = escapeRegExp(platformEmail.slice(0, at));
  const domain = escapeRegExp(platformEmail.slice(at + 1));
  const re = new RegExp(
    `(?:^|[^a-z0-9._%-])${local}\\+([a-z0-9]{4,32})@${domain}(?![a-z0-9.-])`,
    "gi"
  );

  const tags: string[] = [];
  const seen = new Set<string>();
  for (const value of headerValues) {
    if (!value) continue;
    for (const match of value.matchAll(re)) {
      const tag = match[1].toLowerCase();
      if (!seen.has(tag)) {
        seen.add(tag);
        tags.push(tag);
      }
    }
  }
  return tags;
}

/** Lowercased bare address from a raw header value ("Name <A@B.com>" → "a@b.com"). */
export function bareEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const angled = raw.match(/<([^<>\s]+@[^<>\s]+)>/);
  const candidate =
    angled?.[1] ?? raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  return candidate ? candidate.toLowerCase() : null;
}

const FREEMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.dk",
  "outlook.com",
  "outlook.dk",
  "live.com",
  "live.dk",
  "msn.com",
  "yahoo.com",
  "yahoo.dk",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "gmx.com",
  "gmx.de",
  "mail.com",
  "mail.dk",
  "hey.com",
  "fastmail.com",
  "zoho.com",
]);

/** Shared inbox providers where a domain match says nothing about identity. */
export function isFreemailDomain(domain: string): boolean {
  return FREEMAIL_DOMAINS.has(domain.toLowerCase());
}

export interface VenueEmailCandidate {
  venueId: string;
  email: string | null;
}

export interface OutboundToCandidate {
  venueId: string;
  toEmail: string;
}

const domainOf = (email: string): string => email.slice(email.indexOf("@") + 1);

/**
 * Resolve which venue a sender is, by priority:
 *  1. exact match on venues.email
 *  2. exact match on outbound_emails.to_email (covers later email edits)
 *  3. unique non-freemail domain match across both sources
 * Ambiguity at any tier returns null — a wrong attribution is worse than
 * landing in manual triage.
 */
export function resolveVenueByEmail(
  fromEmail: string | null,
  venues: VenueEmailCandidate[],
  outbound: OutboundToCandidate[]
): { venueId: string; via: "venue_email" | "outbound_to" | "domain" } | null {
  const from = fromEmail?.toLowerCase();
  if (!from || !from.includes("@")) return null;

  const exact = new Set(
    venues.filter((v) => v.email?.toLowerCase() === from).map((v) => v.venueId)
  );
  if (exact.size === 1) return { venueId: [...exact][0], via: "venue_email" };
  if (exact.size > 1) return null;

  const viaOutbound = new Set(
    outbound.filter((o) => o.toEmail.toLowerCase() === from).map((o) => o.venueId)
  );
  if (viaOutbound.size === 1) return { venueId: [...viaOutbound][0], via: "outbound_to" };
  if (viaOutbound.size > 1) return null;

  const domain = domainOf(from);
  if (!domain || isFreemailDomain(domain)) return null;
  const byDomain = new Set<string>();
  for (const v of venues) {
    const email = v.email?.toLowerCase();
    if (email && domainOf(email) === domain) byDomain.add(v.venueId);
  }
  for (const o of outbound) {
    if (domainOf(o.toEmail.toLowerCase()) === domain) byDomain.add(o.venueId);
  }
  if (byDomain.size === 1) return { venueId: [...byDomain][0], via: "domain" };
  return null;
}
