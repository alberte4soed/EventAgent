import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SitePhotoRow } from "@/lib/db/types";

/**
 * DELETE /api/site-photos/[id] — the couple removes a photo. The row delete
 * runs through the user client (RLS proves ownership); only then does the
 * service role remove the storage object.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: row } = await supabase
    .from("site_photos").select("*").eq("id", id).maybeSingle();
  const photo = row as SitePhotoRow | null;
  if (!photo) return Response.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase.from("site_photos").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const admin = createAdminClient();
  await admin.storage.from("site-photos").remove([photo.storage_path]);

  return Response.json({ ok: true });
}
