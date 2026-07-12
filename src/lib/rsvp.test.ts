import { describe, it, expect } from "vitest";
import { matchGuest } from "./rsvp";

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
