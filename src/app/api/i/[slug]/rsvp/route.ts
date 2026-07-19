import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchGuest } from "@/lib/rsvp";
import type { GuestRow, InvitationRow } from "@/lib/db/types";

/**
 * POST /api/i/[slug]/rsvp — a guest submits an RSVP from the public online
 * invitation. Service role: matches (by personal token, email or name) or
 * creates the guest row on the couple's list. No auth; a honeypot rejects bots.
 * Mirrors /api/w/[slug]/rsvp but keyed on the `invitations` table.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await request.json()) as {
    token?: string | null; name?: string; email?: string | null;
    attending?: boolean; plusOne?: boolean; plusOneName?: string | null;
    meal?: string | null; dietary?: string | null; note?: string | null; company?: string;
  };

  if (body.company) return Response.json({ ok: true }); // honeypot — pretend success
  const name = (body.name ?? "").trim();
  if (!name || typeof body.attending !== "boolean") {
    return Response.json({ error: "name and attending are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: inviteRow } = await admin
    .from("invitations").select("*").ilike("slug", slug).maybeSingle();
  const invite = inviteRow as InvitationRow | null;
  if (!invite || !invite.published) return Response.json({ error: "Invitation not found" }, { status: 404 });

  const { data: guestRows } = await admin
    .from("guests").select("*").eq("event_id", invite.event_id);
  const guests = (guestRows as GuestRow[] | null) ?? [];

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
  };

  if (match) {
    const { error } = await admin.from("guests").update(patch).eq("id", match.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin.from("guests").insert({
      event_id: invite.event_id, user_id: invite.user_id, name, side: "Fælles", ...patch,
    });
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
