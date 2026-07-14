import type { GuestRow } from "@/lib/db/types";
import type { SiteConfig } from "@/kalas/site/config";

/** How a guest was matched to an existing row (or not). */
export type GuestMatch = { guest: GuestRow; reason: "token" | "email" | "name" } | null;

/**
 * Match a public RSVP submission to an existing guest row. Priority: the
 * per-guest token (from a personal link) → case-insensitive email → exact
 * case-insensitive name. Returns null when the guest is new (self-added).
 * Pure so it can be unit-tested without a database.
 */
export function matchGuest(
  guests: Pick<GuestRow, "id" | "name" | "email" | "rsvp_token">[],
  input: { token?: string | null; email?: string | null; name: string }
): { id: string; reason: "token" | "email" | "name" } | null {
  if (input.token) {
    const byToken = guests.find((g) => g.rsvp_token === input.token);
    if (byToken) return { id: byToken.id, reason: "token" };
  }
  const email = input.email?.trim().toLowerCase();
  if (email) {
    const byEmail = guests.find((g) => g.email?.trim().toLowerCase() === email);
    if (byEmail) return { id: byEmail.id, reason: "email" };
  }
  const name = input.name.trim().toLowerCase();
  if (name) {
    const byName = guests.find((g) => g.name.trim().toLowerCase() === name);
    if (byName) return { id: byName.id, reason: "name" };
  }
  return null;
}

const MAX_ANSWER_LENGTH = 500;

/**
 * Validate a guest's extended RSVP payload against the couple's site config:
 * only sub-events and questions the couple actually defined are kept, answers
 * are trimmed and capped, and the children count is clamped to a sane range.
 * Pure so it can be unit-tested without a database.
 */
export function sanitizeRsvpExtras(
  config: Pick<SiteConfig, "rsvpEvents" | "rsvpQuestions" | "rsvpChildren">,
  input: {
    events?: Record<string, unknown> | null;
    answers?: Record<string, unknown> | null;
    childrenCount?: unknown;
  }
): {
  rsvp_events: Record<string, boolean>;
  custom_answers: Record<string, string>;
  children_count: number;
} {
  const rsvp_events: Record<string, boolean> = {};
  for (const ev of config.rsvpEvents) {
    const v = input.events?.[ev.id];
    if (typeof v === "boolean") rsvp_events[ev.id] = v;
  }

  const custom_answers: Record<string, string> = {};
  for (const q of config.rsvpQuestions) {
    const v = input.answers?.[q.id];
    if (typeof v === "string" && v.trim()) {
      custom_answers[q.id] = v.trim().slice(0, MAX_ANSWER_LENGTH);
    }
  }

  let children_count = 0;
  if (config.rsvpChildren && typeof input.childrenCount === "number" && Number.isFinite(input.childrenCount)) {
    children_count = Math.max(0, Math.min(20, Math.floor(input.childrenCount)));
  }

  return { rsvp_events, custom_answers, children_count };
}
