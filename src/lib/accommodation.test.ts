import { describe, it, expect } from "vitest";
import { roomAvailability, decideReservation } from "./accommodation";

const rooms = [
  { id: "r1", capacity: 2 },
  { id: "r2", capacity: 8 },
];

describe("roomAvailability", () => {
  it("counts confirmed spots against capacity and waitlist separately", () => {
    const avail = roomAvailability(rooms, [
      { room_id: "r1", spots: 1, status: "confirmed" },
      { room_id: "r2", spots: 3, status: "confirmed" },
      { room_id: "r2", spots: 2, status: "waitlist" },
    ]);
    expect(avail.r1).toEqual({ capacity: 2, taken: 1, free: 1, waitlist: 0 });
    expect(avail.r2).toEqual({ capacity: 8, taken: 3, free: 5, waitlist: 2 });
  });

  it("never reports negative free spots (overbooked legacy data)", () => {
    const avail = roomAvailability(rooms, [
      { room_id: "r1", spots: 3, status: "confirmed" },
    ]);
    expect(avail.r1.free).toBe(0);
    expect(avail.r1.taken).toBe(3);
  });

  it("ignores reservations for unknown rooms", () => {
    const avail = roomAvailability(rooms, [
      { room_id: "ghost", spots: 4, status: "confirmed" },
    ]);
    expect(avail.r1.taken).toBe(0);
    expect(avail.ghost).toBeUndefined();
  });
});

describe("decideReservation", () => {
  const avail = { capacity: 4, taken: 3, free: 1, waitlist: 0 };

  it("confirms when spots fit", () => {
    expect(decideReservation(avail, 1)).toBe("confirmed");
  });

  it("waitlists when the room is (or would be) full", () => {
    expect(decideReservation(avail, 2)).toBe("waitlist");
    expect(decideReservation({ ...avail, taken: 4, free: 0 }, 1)).toBe("waitlist");
  });

  it("rejects unknown rooms and nonsense spot counts", () => {
    expect(decideReservation(undefined, 1)).toBe("reject");
    expect(decideReservation(avail, 0)).toBe("reject");
    expect(decideReservation(avail, -1)).toBe("reject");
    expect(decideReservation(avail, 1.5)).toBe("reject");
    expect(decideReservation(avail, 11)).toBe("reject");
  });
});
