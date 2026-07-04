import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GUEST_BANDS, weddingTitle, type OnboardingDate } from "@/lib/onboarding";

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
  /** Free-text dream description (Kalas interview) → requirements. */
  description?: string | null;
  /** Co-planner email (Kalas interview) → requirements. */
  partner_email?: string | null;
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
  const date = body.date ?? { precision: "undecided" as const };
  const description = (body.description ?? "").trim();
  const partnerEmail = (body.partner_email ?? "").trim();

  const requirements: Record<string, unknown> = {};
  if (vibes.length > 0) requirements.vibes = vibes;
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

  // Danish welcome so Ava's chat opens mid-conversation, matching the app.
  const firstName = name.split(" ")[0];
  const partnerFirst = partner ? partner.split(" ")[0] : null;
  const knowns = [
    city,
    date.precision === "exact" ? date.iso : date.hint,
    guestCount ? `omkring ${guestCount} gæster` : null,
    description ? `jeres stil: "${description.slice(0, 80)}"` : null,
  ].filter(Boolean);
  const welcome =
    `Hej ${firstName}${partnerFirst ? ` & ${partnerFirst}` : ""}! ` +
    `Jeg er Ava, jeres bryllupsplanlægger. Her er hvad jeg har indtil videre: ${knowns.join(", ")}. ` +
    `Venuet forankrer alt det andet — blomster, musik og catering er alle lokale til det. ` +
    `Skal jeg begynde at researche venues nær ${city}?`;
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
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  return Response.json({ eventId: event.id });
}
