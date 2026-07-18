import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/website/design/activate — make an earlier generation the live
 * design (rollback / version switch). Body: { designId }.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { designId?: string };
  const designId = body.designId ?? "";
  if (!designId) return Response.json({ error: "designId is required" }, { status: 400 });

  // RLS scopes to the owner; no row → not yours.
  const { data: target } = await supabase
    .from("website_designs")
    .select("id, event_id, active")
    .eq("id", designId)
    .maybeSingle();
  if (!target) return Response.json({ error: "Not found" }, { status: 404 });
  if (target.active) return Response.json({ ok: true });

  await supabase.from("website_designs").update({ active: false }).eq("event_id", target.event_id).eq("active", true);
  const { error } = await supabase.from("website_designs").update({ active: true }).eq("id", designId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
