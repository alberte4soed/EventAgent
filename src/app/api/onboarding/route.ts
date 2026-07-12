import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GUEST_BANDS, weddingTitle, type OnboardingDate } from "@/lib/onboarding";
import type { OnboardingVenueSuggestion } from "@/app/api/onboarding/venues/route";

interface OnboardingBody {
  name?: string;
  partner_name?: string | null;
  city?: string;
  date?: OnboardingDate;
  /** Direct guest count (Kalas interview) — takes precedence over guest_band. */
  guest_count?: number | null;
  guest_band?: string | null;
  budget?: string | null;
  vibes?: string[];
  /** "City, Country" places hearted on the onboarding globe. */
  loved_destinations?: string[];
  /** Venues liked during onboarding swipe step. */
  liked_venues?: OnboardingVenueSuggestion[];
  /** Free-text dream description (Kalas interview) → requirements. */
  description?: string | null;
  /** Co-planner email (Kalas interview) → requirements. */
  partner_email?: string | null;
  /** UI + assistant language chosen during onboarding. */
  language?: string;
}

/**
 * POST /api/onboarding — complete onboarding in one shot:
 * seed the wedding event, drop a welcome message into its chat, and mark
 * the profile onboarded with the event as its active wedding.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as OnboardingBody;
  const name = (body.name ?? "").trim();
  const partner = (body.partner_name ?? "").trim() || null;
  const city = (body.city ?? "").trim();
  if (!name || !city) {
    return Response.json({ error: "name and city are required" }, { status: 400 });
  }

  const band = GUEST_BANDS.find((b) => b.key === body.guest_band);
  const guestCount =
    typeof body.guest_count === "number" && body.guest_count > 0
      ? Math.round(body.guest_count)
      : band?.count ?? null;
  const vibes = (body.vibes ?? []).filter((v) => typeof v === "string").slice(0, 12);
  const lovedDestinations = (body.loved_destinations ?? [])
    .filter((v) => typeof v === "string" && v.trim())
    .map((v) => v.trim().slice(0, 80))
    .slice(0, 20);
  const likedVenues = (body.liked_venues ?? [])
    .filter((v) => v && typeof v.name === "string" && v.name.trim())
    .slice(0, 20);
  const date = body.date ?? { precision: "undecided" as const };
  const description = (body.description ?? "").trim();
  const partnerEmail = (body.partner_email ?? "").trim();
  const language = body.language === "en" ? "en" : "da";

  const requirements: Record<string, unknown> = {};
  if (vibes.length > 0) requirements.vibes = vibes;
  if (lovedDestinations.length > 0) requirements.loved_destinations = lovedDestinations;
  if (likedVenues.length > 0) {
    requirements.liked_venue_names = likedVenues.map((v) => v.name);
  }
  if (band) requirements.guest_band = band.label;
  if (description) requirements.description = description;
  if (partnerEmail) requirements.partner_email = partnerEmail;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      title: weddingTitle(name, partner),
      event_type: "wedding",
      location: city,
      guest_count: guestCount,
      event_date: date.precision === "exact" ? date.iso ?? null : null,
      date_precision: date.precision,
      date_hint: date.precision === "season" ? date.hint ?? null : null,
      budget: (body.budget ?? "").trim() || null,
      requirements,
    })
    .select()
    .single();
  if (eventError || !event) {
    return Response.json(
      { error: eventError?.message ?? "Could not create wedding" },
      { status: 500 }
    );
  }

  if (likedVenues.length > 0) {
    const rows = likedVenues.map((v) => ({
      event_id: event.id,
      user_id: user.id,
      name: v.name,
      description: v.description,
      address: v.address,
      capacity: v.capacity,
      price_hint: v.price_hint,
      image_url: v.photo,
      photo_urls: v.photos?.length ? v.photos : v.photo ? [v.photo] : [],
      place_id: v.place_id,
      rating: v.rating,
      review_count: v.review_count,
      why_fit: v.why_fit,
      swipe_status: "liked" as const,
      category: "venue" as const,
      source_urls: [],
      reviews: [],
      email_lookup_status: "pending" as const,
      contact_verified: false,
    }));
    await supabase.from("venues").insert(rows);
    await supabase.from("events").update({ status: "swiping" }).eq("id", event.id);
  }

  // Welcome so Ava's chat opens mid-conversation, matching the app language.
  const firstName = name.split(" ")[0];
  const partnerFirst = partner ? partner.split(" ")[0] : null;
  const names = `${firstName}${partnerFirst ? ` & ${partnerFirst}` : ""}`;
  const dateKnown = date.precision === "exact" ? date.iso : date.hint;
  const styleHint =
    likedVenues.length > 0
      ? language === "en"
        ? `${likedVenues.length} venues you liked during onboarding`
        : `${likedVenues.length} venues I har gemt under onboarding`
      : description
        ? language === "en"
          ? `your style: "${description.slice(0, 80)}"`
          : `jeres stil: "${description.slice(0, 80)}"`
        : null;
  const welcome =
    language === "en"
      ? `Hi ${names}! I'm Ava, your wedding planner. Here's what I have so far: ${[
          city,
          dateKnown,
          guestCount ? `around ${guestCount} guests` : null,
          styleHint,
        ]
          .filter(Boolean)
          .join(", ")}. ${likedVenues.length > 0 ? "Your shortlist is already on the Venues board — want me to draft outreach to your favourites?" : `The venue anchors everything else — flowers, music and catering are all local to it. Shall I start researching venues near ${city}?`}`
      : `Hej ${names}! Jeg er Ava, jeres bryllupsplanlægger. Her er hvad jeg har indtil videre: ${[
          city,
          dateKnown,
          guestCount ? `omkring ${guestCount} gæster` : null,
          styleHint,
        ]
          .filter(Boolean)
          .join(", ")}. ${likedVenues.length > 0 ? "Jeres shortlist ligger allerede på Venues — skal jeg skrive henvendelser til favoritterne?" : `Venuet forankrer alt det andet — blomster, musik og catering er alle lokale til det. Skal jeg begynde at researche venues nær ${city}?`}`;
  await supabase.from("chat_messages").insert({
    event_id: event.id,
    user_id: user.id,
    role: "assistant",
    content: welcome,
  });

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: name,
      partner_name: partner,
      home_city: city,
      active_event_id: event.id,
      onboarded: true,
      language,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  return Response.json({ eventId: event.id });
}
