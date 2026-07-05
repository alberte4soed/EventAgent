import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { InviteDesignRow } from "@/lib/db/types";

/**
 * POST /api/invites/design/select — mark one design as the selected one for
 * its event, clearing the others. Body: { designId }.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { designId } = (await request.json()) as { designId?: string };
  if (!designId) return Response.json({ error: "designId is required" }, { status: 400 });

  const { data: designData } = await supabase
    .from("invite_designs")
    .select("*")
    .eq("id", designId)
    .maybeSingle();
  const design = designData as InviteDesignRow | null;
  if (!design) return Response.json({ error: "Design not found" }, { status: 404 });

  // RLS scopes these to the user; clear siblings then select this one.
  await supabase
    .from("invite_designs")
    .update({ selected: false })
    .eq("event_id", design.event_id);
  const { error } = await supabase
    .from("invite_designs")
    .update({ selected: true })
    .eq("id", designId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
