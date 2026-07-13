import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingVenueSuggestion } from "@/app/api/onboarding/venues/route";
import type { EventRow, ProfileRow, VenueRow } from "@/lib/db/types";

/**
 * POST /api/venues — save a discovered venue to the couple's active wedding.
 *
 * Body: { venue: OnboardingVenueSuggestion } — the enriched suggestion the
 * discovery flow got from /api/onboarding/venues. Deduped on place_id, so
 * saving the same venue twice just re-likes the existing row.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { venue?: OnboardingVenueSuggestion };
  const venue = body.venue;
  if (!venue || typeof venue.name !== "string" || !venue.name.trim()) {
    return Response.json({ error: "venue with a name is required" }, { status: 400 });
  }

  // The active wedding: profile pointer, else the most recent event.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("active_event_id")
    .eq("user_id", user.id)
    .maybeSingle();
  let event: EventRow | null = null;
  const activeId = (profileRow as Pick<ProfileRow, "active_event_id"> | null)?.active_event_id;
  if (activeId) {
    const { data } = await supabase.from("events").select("*").eq("id", activeId).maybeSingle();
    event = (data as EventRow | null) ?? null;
  }
  if (!event) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    event = (data as EventRow | null) ?? null;
  }
  if (!event) return Response.json({ error: "No wedding found" }, { status: 404 });

  if (venue.place_id) {
    const { data: existing } = await supabase
      .from("venues")
      .select("*")
      .eq("event_id", event.id)
      .eq("place_id", venue.place_id)
      .maybeSingle();
    if (existing) {
      const { data: updated } = await supabase
        .from("venues")
        .update({ swipe_status: "liked" })
        .eq("id", (existing as VenueRow).id)
        .select()
        .single();
      return Response.json({ venue: updated ?? existing });
    }
  }

  const { data: inserted, error } = await supabase
    .from("venues")
    .insert({
      event_id: event.id,
      user_id: user.id,
      name: venue.name.trim(),
      description: venue.description ?? null,
      address: venue.address ?? null,
      capacity: venue.capacity ?? null,
      price_hint: venue.price_hint ?? null,
      image_url: venue.photo ?? null,
      photo_urls: venue.photos?.length ? venue.photos : venue.photo ? [venue.photo] : [],
      place_id: venue.place_id ?? null,
      rating: venue.rating ?? null,
      review_count: venue.review_count ?? null,
      why_fit: venue.why_fit ?? null,
      swipe_status: "liked" as const,
      category: "venue" as const,
      source_urls: [],
      reviews: [],
      email_lookup_status: "pending" as const,
      contact_verified: false,
    })
    .select()
    .single();
  if (error || !inserted) {
    return Response.json({ error: error?.message ?? "Could not save venue" }, { status: 500 });
  }
  return Response.json({ venue: inserted });
}
