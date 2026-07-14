import { describe, it, expect } from "vitest";
import { matchGuest, sanitizeRsvpExtras } from "./rsvp";

const g = (over: Partial<{ id: string; name: string; email: string | null; rsvp_token: string }>) => ({
  id: over.id ?? "1",
  name: over.name ?? "Anna Hansen",
  email: over.email ?? null,
  rsvp_token: over.rsvp_token ?? "tok-1",
});

describe("matchGuest", () => {
  const guests = [
    g({ id: "1", name: "Anna Hansen", email: "anna@x.dk", rsvp_token: "tok-anna" }),
    g({ id: "2", name: "Bo Nielsen", email: "BO@X.DK", rsvp_token: "tok-bo" }),
  ];

  it("matches by token first", () => {
    expect(matchGuest(guests, { token: "tok-bo", name: "someone else" })).toEqual({ id: "2", reason: "token" });
  });

  it("matches by email case-insensitively", () => {
    expect(matchGuest(guests, { email: "bo@x.dk", name: "typo" })).toEqual({ id: "2", reason: "email" });
  });

  it("matches by exact name case-insensitively", () => {
    expect(matchGuest(guests, { name: "anna hansen" })).toEqual({ id: "1", reason: "name" });
  });

  it("returns null for a new guest", () => {
    expect(matchGuest(guests, { name: "Carl Ny", email: "carl@x.dk" })).toBeNull();
  });

  it("ignores a token that matches nobody and falls through to email", () => {
    expect(matchGuest(guests, { token: "nope", email: "anna@x.dk", name: "x" })).toEqual({ id: "1", reason: "email" });
  });
});

describe("sanitizeRsvpExtras", () => {
  const config = {
    rsvpEvents: [
      { id: "ev1", label: "Vielse", sublabel: "" },
      { id: "ev2", label: "Brunch", sublabel: "" },
    ],
    rsvpQuestions: [{ id: "q1", label: "Ønskesang?" }],
    rsvpChildren: true,
  };

  it("keeps only defined sub-events and questions", () => {
    const out = sanitizeRsvpExtras(config, {
      events: { ev1: true, ev2: false, hacked: true },
      answers: { q1: "  Dancing Queen  ", evil: "x" },
      childrenCount: 2,
    });
    expect(out).toEqual({
      rsvp_events: { ev1: true, ev2: false },
      custom_answers: { q1: "Dancing Queen" },
      children_count: 2,
    });
  });

  it("drops non-boolean event values and empty answers", () => {
    const out = sanitizeRsvpExtras(config, {
      events: { ev1: "yes", ev2: 1 },
      answers: { q1: "   " },
    });
    expect(out.rsvp_events).toEqual({});
    expect(out.custom_answers).toEqual({});
  });

  it("caps answer length at 500 chars", () => {
    const out = sanitizeRsvpExtras(config, { answers: { q1: "x".repeat(900) } });
    expect(out.custom_answers.q1).toHaveLength(500);
  });

  it("clamps children count and ignores it when disabled", () => {
    expect(sanitizeRsvpExtras(config, { childrenCount: 99 }).children_count).toBe(20);
    expect(sanitizeRsvpExtras(config, { childrenCount: -3 }).children_count).toBe(0);
    expect(sanitizeRsvpExtras(config, { childrenCount: 2.9 }).children_count).toBe(2);
    expect(sanitizeRsvpExtras({ ...config, rsvpChildren: false }, { childrenCount: 3 }).children_count).toBe(0);
    expect(sanitizeRsvpExtras(config, { childrenCount: "2" }).children_count).toBe(0);
  });

  it("handles missing input safely", () => {
    expect(sanitizeRsvpExtras(config, {})).toEqual({
      rsvp_events: {},
      custom_answers: {},
      children_count: 0,
    });
  });
});
