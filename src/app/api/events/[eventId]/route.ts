import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DatePrecision } from "@/lib/db/types";

const DATE_PRECISIONS: DatePrecision[] = ["exact", "month", "season", "undecided"];

/**
 * PATCH /api/events/[eventId] — journey facts only (choose venue, set date,
 * manual stage overrides). Everything else goes through the chat agent.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    chosen_venue_id?: string | null;
    journey_overrides?: Record<string, string>;
    event_date?: string | null;
    date_precision?: DatePrecision;
  };

  const patch: Record<string, unknown> = {};

  if (body.chosen_venue_id !== undefined) {
    if (body.chosen_venue_id !== null) {
      // The venue must belong to this event (RLS already scopes to the user).
      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("id", body.chosen_venue_id)
        .eq("event_id", eventId)
        .maybeSingle();
      if (!venue) {
        return Response.json({ error: "Venue not found on this event" }, { status: 400 });
      }
    }
    patch.chosen_venue_id = body.chosen_venue_id;
  }

  if (body.journey_overrides && typeof body.journey_overrides === "object") {
    const { data: current } = await supabase
      .from("events")
      .select("journey_overrides")
      .eq("id", eventId)
      .maybeSingle();
    patch.journey_overrides = {
      ...((current?.journey_overrides as Record<string, string>) ?? {}),
      ...body.journey_overrides,
    };
  }

  if (body.event_date !== undefined) patch.event_date = body.event_date;
  if (body.date_precision && DATE_PRECISIONS.includes(body.date_precision)) {
    patch.date_precision = body.date_precision;
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", eventId)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
