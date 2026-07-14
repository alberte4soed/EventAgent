import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchGuest, sanitizeRsvpExtras } from "@/lib/rsvp";
import { notifyCoupleOfRsvp } from "@/lib/rsvp-notify";
import { parseConfig } from "@/kalas/site/config";
import type { GuestRow, WeddingSiteRow } from "@/lib/db/types";

/**
 * POST /api/w/[slug]/rsvp — a guest submits an RSVP from the public site.
 * Service role: matches or creates the guest row on the couple's list. No auth;
 * a honeypot field rejects bots.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await request.json()) as {
    token?: string | null; name?: string; email?: string | null;
    attending?: boolean; plusOne?: boolean; plusOneName?: string | null;
    meal?: string | null; dietary?: string | null; note?: string | null; company?: string;
    events?: Record<string, unknown> | null;
    answers?: Record<string, unknown> | null;
    childrenCount?: unknown;
  };

  if (body.company) return Response.json({ ok: true }); // honeypot — pretend success
  const name = (body.name ?? "").trim();
  if (!name || typeof body.attending !== "boolean") {
    return Response.json({ error: "name and attending are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: siteRow } = await admin
    .from("wedding_sites").select("*").ilike("domain", slug).maybeSingle();
  const site = siteRow as WeddingSiteRow | null;
  if (!site || !site.published) return Response.json({ error: "Site not found" }, { status: 404 });

  const { data: guestRows } = await admin
    .from("guests").select("*").eq("event_id", site.event_id);
  const guests = (guestRows as GuestRow[] | null) ?? [];

  const config = parseConfig(site.config);
  const extras = sanitizeRsvpExtras(config, {
    events: body.events, answers: body.answers, childrenCount: body.childrenCount,
  });

  const match = matchGuest(guests, { token: body.token, email: body.email ?? null, name });
  const patch = {
    rsvp: body.attending ? "ja" : "nej",
    email: body.email?.trim() || null,
    plus_one: Boolean(body.plusOne),
    plus_one_name: body.plusOneName?.trim() || null,
    meal: body.meal?.trim() || null,
    dietary: body.dietary?.trim() || null,
    notes: body.note?.trim() || null,
    responded_at: new Date().toISOString(),
    ...extras,
  };

  let guestId: string;
  if (match) {
    const { error } = await admin.from("guests").update(patch).eq("id", match.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    guestId = match.id;
  } else {
    const { data, error } = await admin.from("guests").insert({
      event_id: site.event_id, user_id: site.user_id, name, side: "Fælles", ...patch,
    }).select("id").single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    guestId = (data as { id: string }).id;
  }

  // Best-effort notification to the couple — never blocks the guest's answer.
  try {
    await notifyCoupleOfRsvp({ site, config, guest: { name, ...patch } });
  } catch (err) {
    console.error("[rsvp] notification failed:", err);
  }

  return Response.json({ ok: true, guestId });
}
