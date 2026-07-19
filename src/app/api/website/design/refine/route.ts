import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasWebsiteAccess } from "@/lib/website/generate";
import { buildSiteHtml } from "@/lib/website/buildSite";
import { logAgentError } from "@/lib/gemini/log";
import type { EventRow } from "@/lib/db/types";

export const maxDuration = 120;

/**
 * POST /api/website/design/refine — apply a change request ("gør den
 * mørkere", "større forsidebillede") to the active design; saves a new
 * version. Body: { eventId, instruction }.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { eventId?: string; instruction?: string };
  const eventId = body.eventId ?? "";
  const instruction = (body.instruction ?? "").trim();
  if (!eventId || !instruction) {
    return Response.json({ error: "eventId and instruction are required" }, { status: 400 });
  }

  const { data: eventData } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
  const event = eventData as EventRow | null;
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

  if (!(await hasWebsiteAccess(supabase, eventId))) {
    return Response.json({ error: "payment_required" }, { status: 402 });
  }

  const { count } = await supabase
    .from("website_designs")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("active", true);
  if ((count ?? 0) === 0) {
    return Response.json({ error: "Ingen aktivt design at justere — generér først." }, { status: 409 });
  }

  try {
    const { row } = await buildSiteHtml({
      supabase,
      event,
      userId: user.id,
      instruction: instruction.slice(0, 1000),
    });
    return Response.json({ designId: row.id });
  } catch (err) {
    logAgentError("api/website/design/refine", err, { eventId });
    return Response.json({ error: "Ava kunne ikke justere designet lige nu — prøv igen." }, { status: 502 });
  }
}
