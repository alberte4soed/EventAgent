import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteImage } from "@/lib/gemini/image";
import type { EventRow, InviteDesignRow } from "@/lib/db/types";

export const maxDuration = 120; // several sequential image generations

const OPTIONS_PER_ROUND = 3;
const MAX_DESIGNS_PER_DAY = 15; // cost guard (~5 rounds)

/**
 * POST /api/invites/design — generate a few invitation design options,
 * store them privately, and return signed preview URLs.
 * Body: { eventId, style, palette, wording }.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    eventId?: string;
    style?: string;
    palette?: string;
    wording?: string;
  };
  const eventId = body.eventId ?? "";
  const wording = (body.wording ?? "").trim();
  if (!eventId || !wording) {
    return Response.json({ error: "eventId and wording are required" }, { status: 400 });
  }

  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  const event = eventData as EventRow | null;
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

  // Cost guard: cap designs generated per event per day.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("invite_designs")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_DESIGNS_PER_DAY) {
    return Response.json(
      { error: "design_limit", message: "You've hit today's design limit — try again tomorrow." },
      { status: 429 }
    );
  }

  const vibes = Array.isArray(event.requirements?.vibes)
    ? (event.requirements.vibes as string[])
    : [];
  const style = body.style ?? "botanical";
  const palette = body.palette ?? "cream_sage";

  const admin = createAdminClient();
  const created: { id: string; url: string | null }[] = [];

  for (let i = 0; i < OPTIONS_PER_ROUND; i++) {
    const image = await generateInviteImage({ style, palette, wording, vibes });
    if (!image) continue;

    const id = crypto.randomUUID();
    const storagePath = `${user.id}/${eventId}/${id}.png`;
    const { error: uploadError } = await admin.storage
      .from("invite-designs")
      .upload(storagePath, image.data, { contentType: image.mimeType, upsert: true });
    if (uploadError) continue;

    const { data: row } = await admin
      .from("invite_designs")
      .insert({ id, event_id: eventId, user_id: user.id, style, palette, storage_path: storagePath })
      .select()
      .single();
    if (!row) continue;

    const { data: signed } = await admin.storage
      .from("invite-designs")
      .createSignedUrl(storagePath, 3600);
    created.push({ id: (row as InviteDesignRow).id, url: signed?.signedUrl ?? null });
  }

  if (created.length === 0) {
    return Response.json({ error: "Design generation failed — try again" }, { status: 502 });
  }
  return Response.json({ designs: created });
}
