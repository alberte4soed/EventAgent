import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SitePhotoRow } from "@/lib/db/types";

/**
 * DELETE /api/website/photos/[photoId] — remove a site photo (storage object
 * + row). PATCH — update role ('hero' promotes a photo to forsidebillede).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // RLS scopes the select to the owner; no row → not yours or gone.
  const { data } = await supabase.from("site_photos").select("*").eq("id", photoId).maybeSingle();
  const photo = data as SitePhotoRow | null;
  if (!photo) return Response.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  await admin.storage.from("site-photos").remove([photo.storage_path]);
  const { error } = await supabase.from("site_photos").delete().eq("id", photoId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { role?: string };
  const role = body.role === "hero" ? "hero" : body.role === "gallery" ? "gallery" : null;
  if (!role) return Response.json({ error: "role must be 'hero' or 'gallery'" }, { status: 400 });

  const { data } = await supabase.from("site_photos").select("event_id").eq("id", photoId).maybeSingle();
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });

  // Only one hero: demote any existing hero for the event first.
  if (role === "hero") {
    await supabase.from("site_photos").update({ role: "gallery" }).eq("event_id", data.event_id).eq("role", "hero");
  }
  const { data: row, error } = await supabase
    .from("site_photos")
    .update({ role })
    .eq("id", photoId)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ photo: row });
}
