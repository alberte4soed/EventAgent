import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { VenueRow } from "@/lib/db/types";

/**
 * PATCH /api/venues/[venueId] — mark a vendor booked (or un-booked).
 * Body: { booked: boolean }. Booking a venue also sets chosen_venue_id.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { booked } = (await request.json()) as { booked?: boolean };
  if (typeof booked !== "boolean") {
    return Response.json({ error: "booked must be a boolean" }, { status: 400 });
  }

  const { data: venueData } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .maybeSingle();
  const venue = venueData as VenueRow | null;
  if (!venue) return Response.json({ error: "Vendor not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("venues")
    .update({ booked_at: booked ? new Date().toISOString() : null })
    .eq("id", venueId)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Booking a venue settles the venue stage.
  if (booked && venue.category === "venue") {
    await supabase
      .from("events")
      .update({ chosen_venue_id: venueId })
      .eq("id", venue.event_id)
      .is("chosen_venue_id", null);
  }

  return Response.json(data);
}
