// Pure, derived dashboard metrics for the Home screen. Like journey.ts these
// are computed from facts, never stored; every function takes `now` so tests
// stay deterministic.

import type {
  BudgetItemRow,
  EmailReplyRow,
  EventRow,
  GuestRow,
  MoodboardItemRow,
  OutboundEmailRow,
  ReplyProposalRow,
  TimelineTaskRow,
  VenueRow,
} from "@/lib/db/types";
import { venueChosen } from "@/lib/journey";

/** "180.000 kr" → 180000. Free-text budgets only ever carry one number. */
export function parseBudget(text: string | null): number {
  if (!text) return 0;
  const digits = text.replace(/[^\d]/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
}

/** Whole days from today (midnight) to a date-only ISO string. Negative when past. */
export function daysUntil(dateISO: string | null, now: Date = new Date()): number | null {
  if (!dateISO) return null;
  const d = new Date(dateISO.includes("T") ? dateISO : `${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

/** Danish source string for the time-of-day greeting (translated via t()). */
export function greetingKey(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Godnat";
  if (h < 10) return "Godmorgen";
  if (h < 12) return "Godformiddag";
  if (h < 18) return "Goddag";
  return "Godaften";
}

export interface BudgetSummary {
  /** Total budget from the event's free-text field, 0 when unset. */
  cap: number;
  planned: number;
  paid: number;
  /** planned / cap, clamped; null when no cap is set. */
  pctPlanned: number | null;
  /** paid against planned (falling back to cap); null when neither exists. */
  pctPaid: number | null;
  hasData: boolean;
}

export function budgetSummary(items: BudgetItemRow[], eventBudget: string | null): BudgetSummary {
  const cap = parseBudget(eventBudget);
  const planned = items.reduce((sum, i) => sum + (i.planned_amount ?? 0), 0);
  const paid = items.reduce((sum, i) => sum + (i.paid_amount ?? 0), 0);
  const pctPlanned = cap > 0 ? Math.min(planned / cap, 9.99) : null;
  const pctPaid = planned > 0 ? paid / planned : cap > 0 ? paid / cap : null;
  return { cap, planned, paid, pctPlanned, pctPaid, hasData: cap > 0 || items.length > 0 };
}

export interface RsvpSummary {
  total: number;
  ja: number;
  nej: number;
  afventer: number;
  responded: number;
  /** Share of the list that has answered; null when the list is empty. */
  pct: number | null;
}

export function rsvpSummary(guests: GuestRow[]): RsvpSummary {
  const ja = guests.filter((g) => g.rsvp === "ja").length;
  const nej = guests.filter((g) => g.rsvp === "nej").length;
  const total = guests.length;
  const responded = ja + nej;
  return {
    total,
    ja,
    nej,
    afventer: total - responded,
    responded,
    pct: total > 0 ? responded / total : null,
  };
}

export interface VenueFunnel {
  shortlisted: number;
  contacted: number;
  quoted: number;
  booked: number;
  bestQuote: { amount: number; currency: string | null; venueId: string } | null;
  /** True when nothing has happened yet — render a guided empty state. */
  empty: boolean;
}

/** The venue pipeline: shortlist → contacted → quoted → booked, venues only. */
export function venueFunnel(
  venues: VenueRow[],
  outbound: OutboundEmailRow[],
  replies: EmailReplyRow[],
  event: EventRow | null
): VenueFunnel {
  const venueIds = new Set(venues.filter((v) => v.category === "venue").map((v) => v.id));
  const shortlisted = venues.filter(
    (v) => v.category === "venue" && v.swipe_status === "liked"
  ).length;
  const contacted = new Set(
    outbound
      .filter((o) => venueIds.has(o.venue_id) && (o.status === "sent" || o.status === "replied"))
      .map((o) => o.venue_id)
  ).size;
  const quoted = new Set(
    replies
      .filter((r) => venueIds.has(r.venue_id) && r.quote_status === "quoted")
      .map((r) => r.venue_id)
  ).size;
  const bookedRows = venues.filter((v) => v.category === "venue" && v.booked_at).length;
  const booked = event && venueChosen(event) ? Math.max(bookedRows, 1) : bookedRows;

  let bestQuote: VenueFunnel["bestQuote"] = null;
  for (const r of replies) {
    if (!venueIds.has(r.venue_id)) continue;
    const q = r.quote;
    if (!q?.has_quote || q.price_amount == null || q.availability === "unavailable") continue;
    if (!bestQuote || q.price_amount < bestQuote.amount) {
      bestQuote = { amount: q.price_amount, currency: q.currency, venueId: r.venue_id };
    }
  }

  return {
    shortlisted,
    contacted,
    quoted,
    booked,
    bestQuote,
    empty: shortlisted === 0 && contacted === 0 && quoted === 0 && booked === 0,
  };
}

export interface TasksDue {
  overdue: TimelineTaskRow[];
  upcoming: TimelineTaskRow[];
}

/** Open tasks split into overdue and due within the horizon, soonest first. */
export function tasksDueSoon(
  tasks: TimelineTaskRow[],
  now: Date = new Date(),
  horizonDays = 14
): TasksDue {
  const overdue: TimelineTaskRow[] = [];
  const upcoming: TimelineTaskRow[] = [];
  for (const task of tasks) {
    if (task.done) continue;
    const days = daysUntil(task.due_date, now);
    if (days == null) continue;
    if (days < 0) overdue.push(task);
    else if (days <= horizonDays) upcoming.push(task);
  }
  const byDue = (a: TimelineTaskRow, b: TimelineTaskRow) =>
    (a.due_date ?? "").localeCompare(b.due_date ?? "");
  overdue.sort(byDue);
  upcoming.sort(byDue);
  return { overdue, upcoming };
}

export type ActivityKind = "quote" | "reply" | "sent" | "proposal" | "moodboard";

export interface ActivityItem {
  kind: ActivityKind;
  /** ISO timestamp the item happened at. */
  at: string;
  venueId?: string;
}

/** The newest things that happened to the wedding, most recent first. */
export function buildActivityFeed(
  input: {
    replies: EmailReplyRow[];
    outbound: OutboundEmailRow[];
    proposals: ReplyProposalRow[];
    moodboardItems: MoodboardItemRow[];
  },
  limit = 6
): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const r of input.replies) {
    items.push({
      kind: r.quote_status === "quoted" ? "quote" : "reply",
      at: r.received_at ?? r.created_at,
      venueId: r.venue_id,
    });
  }
  for (const o of input.outbound) {
    if (o.status !== "sent" && o.status !== "replied") continue;
    items.push({ kind: "sent", at: o.sent_at ?? o.created_at, venueId: o.venue_id });
  }
  for (const p of input.proposals) {
    if (p.status !== "proposed") continue;
    items.push({ kind: "proposal", at: p.created_at, venueId: p.venue_id });
  }
  for (const m of input.moodboardItems) {
    items.push({ kind: "moodboard", at: m.created_at });
  }
  return items
    .filter((i) => Boolean(i.at))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}
