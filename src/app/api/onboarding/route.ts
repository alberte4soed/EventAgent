import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GUEST_BANDS, weddingTitle, type OnboardingDate } from "@/lib/onboarding";

interface OnboardingBody {
  name?: string;
  partner_name?: string | null;
  city?: string;
  date?: OnboardingDate;
  guest_band?: string | null;
  budget?: string | null;
  vibes?: string[];
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
  const vibes = (body.vibes ?? []).filter((v) => typeof v === "string").slice(0, 12);
  const date = body.date ?? { precision: "undecided" as const };

  const requirements: Record<string, unknown> = {};
  if (vibes.length > 0) requirements.vibes = vibes;
  if (band) requirements.guest_band = band.label;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      title: weddingTitle(name, partner),
      event_type: "wedding",
      location: city,
      guest_count: band?.count ?? null,
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

  // Welcome message so the workspace opens mid-conversation, not empty.
  const knowns = [
    city,
    date.precision === "exact" ? date.iso : date.hint,
    band?.count ? `around ${band.count} guests` : null,
    vibes.length > 0 ? `a ${vibes[0].toLowerCase()} feel` : null,
  ].filter(Boolean);
  const welcome =
    `Hi ${name.split(" ")[0]}${partner ? ` & ${partner.split(" ")[0]}` : ""}! ` +
    `I'm Ava, your wedding planner. Here's what I've got so far: ${knowns.join(", ")}. ` +
    `The venue anchors everything else — flowers, music, catering are all local to it. ` +
    `Shall I start researching venues in ${city}?`;
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
