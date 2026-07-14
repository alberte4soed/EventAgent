import type { AccommodationRoomRow, AccommodationReservationRow } from "@/lib/db/types";

/** Per-room availability derived from confirmed reservations. */
export type RoomAvailability = {
  capacity: number;
  taken: number;
  free: number;
  waitlist: number;
};

type RoomLike = Pick<AccommodationRoomRow, "id" | "capacity">;
type ReservationLike = Pick<AccommodationReservationRow, "room_id" | "spots" | "status">;

/**
 * Sum reservations into a per-room availability map. Confirmed spots count
 * against capacity; waitlist entries are tallied separately. Pure so both the
 * public reserve route and the couple's dashboard share one definition of
 * "free spots".
 */
export function roomAvailability(
  rooms: RoomLike[],
  reservations: ReservationLike[]
): Record<string, RoomAvailability> {
  const byRoom: Record<string, RoomAvailability> = {};
  for (const room of rooms) {
    byRoom[room.id] = { capacity: room.capacity, taken: 0, free: room.capacity, waitlist: 0 };
  }
  for (const res of reservations) {
    const slot = byRoom[res.room_id];
    if (!slot) continue;
    if (res.status === "confirmed") slot.taken += res.spots;
    else slot.waitlist += res.spots;
  }
  for (const slot of Object.values(byRoom)) {
    slot.free = Math.max(0, slot.capacity - slot.taken);
  }
  return byRoom;
}

/**
 * Decide what a new reservation request should become. The DB capacity
 * trigger is the authoritative guard against races; this pre-check gives the
 * common case a friendly answer without a rejected insert.
 */
export function decideReservation(
  availability: RoomAvailability | undefined,
  spots: number
): "confirmed" | "waitlist" | "reject" {
  if (!availability || !Number.isInteger(spots) || spots < 1 || spots > 10) return "reject";
  return spots <= availability.free ? "confirmed" : "waitlist";
}
