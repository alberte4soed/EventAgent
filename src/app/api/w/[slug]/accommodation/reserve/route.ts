import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { roomAvailability, decideReservation } from "@/lib/accommodation";
import type { AccommodationRoomRow, AccommodationReservationRow, WeddingSiteRow } from "@/lib/db/types";

/**
 * POST /api/w/[slug]/accommodation/reserve — a guest reserves on-site sleeping
 * spots from the RSVP flow. Service role, honeypot-protected. First-come-
 * first-served: the DB capacity trigger is the authoritative guard, so a
 * losing racer gets converted to the waitlist instead of overbooking.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await request.json()) as {
    roomId?: string; spots?: unknown; guestId?: string | null;
    name?: string; email?: string | null; company?: string;
  };

  if (body.company) return Response.json({ ok: true }); // honeypot — pretend success
  const name = (body.name ?? "").trim();
  const spots = typeof body.spots === "number" ? body.spots : NaN;
  if (!body.roomId || !name || !Number.isInteger(spots) || spots < 1 || spots > 10) {
    return Response.json({ error: "roomId, name and spots (1-10) are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: siteRow } = await admin
    .from("wedding_sites").select("*").ilike("domain", slug).maybeSingle();
  const site = siteRow as WeddingSiteRow | null;
  if (!site || !site.published) return Response.json({ error: "Site not found" }, { status: 404 });

  const [{ data: roomRows }, { data: resRows }] = await Promise.all([
    admin.from("accommodation_rooms").select("*").eq("event_id", site.event_id),
    admin.from("accommodation_reservations").select("*").eq("event_id", site.event_id),
  ]);
  const rooms = (roomRows as AccommodationRoomRow[] | null) ?? [];
  const room = rooms.find((r) => r.id === body.roomId);
  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

  // Only link the reservation to a guest row that belongs to this wedding.
  let guestId: string | null = null;
  if (body.guestId) {
    const { data: guestRow } = await admin
      .from("guests").select("id").eq("id", body.guestId).eq("event_id", site.event_id).maybeSingle();
    guestId = (guestRow as { id: string } | null)?.id ?? null;
  }

  const availability = roomAvailability(rooms, (resRows as AccommodationReservationRow[] | null) ?? []);
  const decision = decideReservation(availability[room.id], spots);
  if (decision === "reject") return Response.json({ error: "Invalid reservation" }, { status: 400 });

  const insert = {
    room_id: room.id, event_id: site.event_id, user_id: site.user_id,
    guest_id: guestId, guest_name: name, guest_email: body.email?.trim() || null,
    spots, status: decision,
  };

  const { error } = await admin.from("accommodation_reservations").insert(insert);
  if (error) {
    // Lost the race to the last spot: the capacity trigger rejected the
    // insert — fall back to the waitlist so the guest still gets an answer.
    if (error.message.includes("room_full") && decision === "confirmed") {
      const { error: wlError } = await admin
        .from("accommodation_reservations").insert({ ...insert, status: "waitlist" });
      if (wlError) return Response.json({ error: wlError.message }, { status: 500 });
      return Response.json({ ok: true, waitlisted: true });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, waitlisted: decision === "waitlist" });
}
