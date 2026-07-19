import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSectionImages } from "@/lib/website/buildSite";
import { parseConfig } from "@/kalas/site/config";
import { parseSiteDesign, DEFAULT_DESIGN } from "@/kalas/site/design";
import { logAgentError } from "@/lib/gemini/log";
import type { EventRow, WeddingSiteRow, WebsiteDesignRow } from "@/lib/db/types";

export const maxDuration = 120; // several sequential image generations

/**
 * POST /api/website/images — step 2 of the build pipeline, callable on its
 * own: generate Nano Banana illustrations for the sections toggled on under
 * "AI-billede" (reusing ones that already exist). Body: { eventId }.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { eventId?: string };
  const eventId = body.eventId ?? "";
  if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });

  const { data: eventData } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
  const event = eventData as EventRow | null;
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

  const [{ data: siteRow }, { data: activeRow }] = await Promise.all([
    supabase.from("wedding_sites").select("*").eq("event_id", eventId).maybeSingle(),
    supabase.from("website_designs").select("*").eq("event_id", eventId).eq("active", true).maybeSingle(),
  ]);
  const config = parseConfig((siteRow as WeddingSiteRow | null)?.config);
  const active = activeRow as WebsiteDesignRow | null;
  const design = active ? parseSiteDesign(active.design) : DEFAULT_DESIGN;
  const brief = (active?.brief ?? {}) as { styleDirection?: string; vibes?: string[] };

  try {
    const rows = await ensureSectionImages({
      supabase,
      event,
      userId: user.id,
      config,
      paletteHexes: [design.palette.bg, design.palette.accent, design.palette.text],
      styleDirection: brief.styleDirection ?? "",
      vibes: brief.vibes ?? [],
    });
    const admin = createAdminClient();
    const photos = await Promise.all(
      rows.map(async (p) => {
        const { data } = await admin.storage.from("site-photos").createSignedUrl(p.storage_path, 3600);
        return { ...p, url: data?.signedUrl ?? null };
      })
    );
    return Response.json({ photos });
  } catch (err) {
    logAgentError("api/website/images", err, { eventId });
    return Response.json({ error: "Billedgenerering fejlede — prøv igen." }, { status: 502 });
  }
}
