import { describe, it, expect } from "vitest";
import {
  buildActivityFeed,
  budgetSummary,
  daysUntil,
  greetingKey,
  parseBudget,
  rsvpSummary,
  tasksDueSoon,
  venueFunnel,
} from "./dashboard";
import type {
  BudgetItemRow,
  EmailReplyRow,
  EventRow,
  GuestRow,
  OutboundEmailRow,
  ReplyProposalRow,
  TimelineTaskRow,
  VenueRow,
} from "./db/types";

const NOW = new Date("2026-07-06T12:00:00");

function makeEvent(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: "e1",
    user_id: "u1",
    title: "Emma & James's wedding",
    event_type: "wedding",
    location: "Copenhagen",
    guest_count: 100,
    event_date: null,
    date_precision: "undecided",
    date_hint: null,
    budget: null,
    requirements: {},
    status: "gathering",
    chosen_venue_id: null,
    journey_overrides: {},
    reply_tag: null,
    created_at: NOW.toISOString(),
    ...overrides,
  };
}

function makeVenue(overrides: Partial<VenueRow> = {}): VenueRow {
  return {
    id: "v1",
    event_id: "e1",
    user_id: "u1",
    name: "Orangeriet",
    description: null,
    address: null,
    website: null,
    email: null,
    phone: null,
    capacity: null,
    price_hint: null,
    image_url: null,
    source_urls: [],
    swipe_status: "pending",
    email_lookup_status: "not_needed",
    place_id: null,
    rating: null,
    review_count: null,
    reviews: [],
    photo_urls: [],
    lat: null,
    lng: null,
    price_level: null,
    business_status: null,
    why_fit: null,
    contact_verified: false,
    category: "venue",
    booked_at: null,
    created_at: NOW.toISOString(),
    ...overrides,
  };
}

function makeOutbound(overrides: Partial<OutboundEmailRow> = {}): OutboundEmailRow {
  return {
    id: "o1",
    event_id: "e1",
    venue_id: "v1",
    draft_id: null,
    user_id: "u1",
    to_email: "venue@example.com",
    subject: "Quote request",
    body: "",
    gmail_message_id: null,
    gmail_thread_id: null,
    status: "sent",
    error: null,
    sent_at: "2026-07-01T10:00:00Z",
    kind: "outreach",
    in_reply_to_reply_id: null,
    created_at: "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

function makeReply(overrides: Partial<EmailReplyRow> = {}): EmailReplyRow {
  return {
    id: "r1",
    outbound_email_id: "o1",
    venue_id: "v1",
    event_id: "e1",
    user_id: "u1",
    gmail_message_id: "g1",
    from_email: null,
    snippet: null,
    body: null,
    received_at: "2026-07-02T10:00:00Z",
    quote: null,
    quote_status: null,
    rfc822_message_id: null,
    read_at: null,
    created_at: "2026-07-02T10:05:00Z",
    ...overrides,
  };
}

function makeTask(overrides: Partial<TimelineTaskRow> = {}): TimelineTaskRow {
  return {
    id: "t1",
    event_id: "e1",
    user_id: "u1",
    title: "Book prøvesmagning",
    due_date: null,
    done: false,
    category: null,
    sort: 0,
    created_at: NOW.toISOString(),
    ...overrides,
  };
}

function makeGuest(overrides: Partial<GuestRow> = {}): GuestRow {
  return {
    id: "g1",
    event_id: "e1",
    user_id: "u1",
    name: "Mormor",
    side: "Fælles",
    email: null,
    phone: null,
    rsvp: "afventer",
    meal: null,
    plus_one: false,
    notes: null,
    created_at: NOW.toISOString(),
    ...overrides,
  };
}

function makeBudgetItem(overrides: Partial<BudgetItemRow> = {}): BudgetItemRow {
  return {
    id: "b1",
    event_id: "e1",
    user_id: "u1",
    category: "venue",
    label: "Venue",
    planned_amount: 0,
    paid_amount: 0,
    sort: 0,
    created_at: NOW.toISOString(),
    ...overrides,
  };
}

function makeProposal(overrides: Partial<ReplyProposalRow> = {}): ReplyProposalRow {
  return {
    id: "p1",
    email_reply_id: "r1",
    outbound_email_id: "o1",
    venue_id: "v1",
    event_id: "e1",
    user_id: "u1",
    body: "Kære venue…",
    status: "proposed",
    sent_outbound_id: null,
    created_at: "2026-07-03T10:00:00Z",
    ...overrides,
  };
}

describe("parseBudget", () => {
  it("extracts digits from Danish free text", () => {
    expect(parseBudget("180.000 kr")).toBe(180000);
    expect(parseBudget("ca. 80k… nej 95.000")).toBe(8095000);
    expect(parseBudget(null)).toBe(0);
    expect(parseBudget("intet tal")).toBe(0);
  });
});

describe("daysUntil", () => {
  it("counts whole days from midnight, ignoring time of day", () => {
    expect(daysUntil("2026-07-07", NOW)).toBe(1);
    expect(daysUntil("2026-07-06", NOW)).toBe(0);
    expect(daysUntil("2026-07-01", NOW)).toBe(-5);
  });

  it("returns null for missing or invalid dates", () => {
    expect(daysUntil(null, NOW)).toBeNull();
    expect(daysUntil("not-a-date", NOW)).toBeNull();
  });
});

describe("greetingKey", () => {
  it("matches the time of day", () => {
    expect(greetingKey(new Date("2026-07-06T03:00:00"))).toBe("Godnat");
    expect(greetingKey(new Date("2026-07-06T08:00:00"))).toBe("Godmorgen");
    expect(greetingKey(new Date("2026-07-06T11:00:00"))).toBe("Godformiddag");
    expect(greetingKey(new Date("2026-07-06T14:00:00"))).toBe("Goddag");
    expect(greetingKey(new Date("2026-07-06T21:00:00"))).toBe("Godaften");
  });
});

describe("budgetSummary", () => {
  it("is empty without a cap or items", () => {
    const s = budgetSummary([], null);
    expect(s.hasData).toBe(false);
    expect(s.pctPlanned).toBeNull();
    expect(s.pctPaid).toBeNull();
  });

  it("sums items against the event budget", () => {
    const s = budgetSummary(
      [
        makeBudgetItem({ planned_amount: 60000, paid_amount: 20000 }),
        makeBudgetItem({ id: "b2", planned_amount: 40000, paid_amount: 0 }),
      ],
      "180.000 kr"
    );
    expect(s.cap).toBe(180000);
    expect(s.planned).toBe(100000);
    expect(s.paid).toBe(20000);
    expect(s.pctPlanned).toBeCloseTo(100000 / 180000);
    expect(s.pctPaid).toBeCloseTo(0.2);
    expect(s.hasData).toBe(true);
  });

  it("handles items without a cap", () => {
    const s = budgetSummary([makeBudgetItem({ planned_amount: 5000 })], null);
    expect(s.pctPlanned).toBeNull();
    expect(s.pctPaid).toBe(0);
    expect(s.hasData).toBe(true);
  });
});

describe("rsvpSummary", () => {
  it("returns null pct for an empty list", () => {
    expect(rsvpSummary([]).pct).toBeNull();
  });

  it("counts answers", () => {
    const s = rsvpSummary([
      makeGuest({ rsvp: "ja" }),
      makeGuest({ id: "g2", rsvp: "ja" }),
      makeGuest({ id: "g3", rsvp: "nej" }),
      makeGuest({ id: "g4" }),
    ]);
    expect(s).toMatchObject({ total: 4, ja: 2, nej: 1, afventer: 1, responded: 3 });
    expect(s.pct).toBeCloseTo(0.75);
  });
});

describe("venueFunnel", () => {
  it("is empty with no venue activity", () => {
    const f = venueFunnel([], [], [], makeEvent());
    expect(f.empty).toBe(true);
    expect(f.bestQuote).toBeNull();
  });

  it("dedupes contacted and quoted by venue and ignores non-venue categories", () => {
    const venues = [
      makeVenue({ id: "v1", swipe_status: "liked" }),
      makeVenue({ id: "v2", swipe_status: "liked" }),
      makeVenue({ id: "f1", category: "florist", swipe_status: "liked" }),
    ];
    const outbound = [
      makeOutbound({ id: "o1", venue_id: "v1" }),
      makeOutbound({ id: "o2", venue_id: "v1", status: "replied" }),
      makeOutbound({ id: "o3", venue_id: "v2", status: "failed" }),
      makeOutbound({ id: "o4", venue_id: "f1" }),
    ];
    const replies = [
      makeReply({ id: "r1", venue_id: "v1", quote_status: "quoted" }),
      makeReply({ id: "r2", venue_id: "v1", quote_status: "quoted" }),
    ];
    const f = venueFunnel(venues, outbound, replies, makeEvent());
    expect(f.shortlisted).toBe(2);
    expect(f.contacted).toBe(1);
    expect(f.quoted).toBe(1);
    expect(f.booked).toBe(0);
    expect(f.empty).toBe(false);
  });

  it("counts a chosen venue as booked even without booked_at", () => {
    const f = venueFunnel([makeVenue()], [], [], makeEvent({ chosen_venue_id: "v1" }));
    expect(f.booked).toBe(1);
  });

  it("picks the cheapest available quote", () => {
    const replies = [
      makeReply({
        id: "r1",
        venue_id: "v1",
        quote_status: "quoted",
        quote: { has_quote: true, price_amount: 42000, currency: "DKK", price_basis: null, availability: "available", conditions: null, summary: "" },
      }),
      makeReply({
        id: "r2",
        venue_id: "v2",
        quote_status: "quoted",
        quote: { has_quote: true, price_amount: 35000, currency: "DKK", price_basis: null, availability: "unclear", conditions: null, summary: "" },
      }),
      makeReply({
        id: "r3",
        venue_id: "v3",
        quote_status: "quoted",
        quote: { has_quote: true, price_amount: 20000, currency: "DKK", price_basis: null, availability: "unavailable", conditions: null, summary: "" },
      }),
    ];
    const venues = [makeVenue({ id: "v1" }), makeVenue({ id: "v2" }), makeVenue({ id: "v3" })];
    const f = venueFunnel(venues, [], replies, makeEvent());
    expect(f.bestQuote).toMatchObject({ amount: 35000, venueId: "v2" });
  });
});

describe("tasksDueSoon", () => {
  it("splits overdue from upcoming inside the horizon and skips done/undated", () => {
    const { overdue, upcoming } = tasksDueSoon(
      [
        makeTask({ id: "t1", due_date: "2026-07-04" }),
        makeTask({ id: "t2", due_date: "2026-07-10" }),
        makeTask({ id: "t3", due_date: "2026-07-20" }),
        makeTask({ id: "t4", due_date: "2026-07-21" }),
        makeTask({ id: "t5", due_date: "2026-07-05", done: true }),
        makeTask({ id: "t6" }),
      ],
      NOW
    );
    expect(overdue.map((t) => t.id)).toEqual(["t1"]);
    expect(upcoming.map((t) => t.id)).toEqual(["t2", "t3"]);
  });

  it("treats today and the horizon edge as upcoming", () => {
    const { overdue, upcoming } = tasksDueSoon([makeTask({ due_date: "2026-07-06" })], NOW);
    expect(overdue).toHaveLength(0);
    expect(upcoming).toHaveLength(1);
  });
});

describe("buildActivityFeed", () => {
  it("orders newest first and respects the limit", () => {
    const feed = buildActivityFeed(
      {
        replies: [
          makeReply({ id: "r1", received_at: "2026-07-02T10:00:00Z", quote_status: "quoted" }),
          makeReply({ id: "r2", received_at: null, created_at: "2026-07-05T09:00:00Z" }),
        ],
        outbound: [
          makeOutbound({ id: "o1", sent_at: "2026-07-01T10:00:00Z" }),
          makeOutbound({ id: "o2", status: "queued" }),
          makeOutbound({ id: "o3", status: "failed" }),
        ],
        proposals: [
          makeProposal({ id: "p1", created_at: "2026-07-04T10:00:00Z" }),
          makeProposal({ id: "p2", status: "dismissed" }),
        ],
        moodboardItems: [],
      },
      3
    );
    expect(feed.map((i) => i.kind)).toEqual(["reply", "proposal", "quote"]);
  });
});
