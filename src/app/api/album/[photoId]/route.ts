import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AlbumPhotoRow } from "@/lib/db/types";

async function loadOwned(photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, status: 401 };
  // RLS returns the row only if it belongs to this user.
  const { data } = await supabase.from("album_photos").select("*").eq("id", photoId).maybeSingle();
  const row = data as AlbumPhotoRow | null;
  if (!row) return { error: "Not found" as const, status: 404 };
  return { supabase, row };
}

/** DELETE /api/album/[photoId] — remove the object, then the row. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  const res = await loadOwned(photoId);
  if ("error" in res) return Response.json({ error: res.error }, { status: res.status });

  const admin = createAdminClient();
  await admin.storage.from("site-photos").remove([res.row.storage_path]);
  const { error } = await res.supabase.from("album_photos").delete().eq("id", photoId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

/** PATCH /api/album/[photoId] — favorite / hide / caption. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  const res = await loadOwned(photoId);
  if ("error" in res) return Response.json({ error: res.error }, { status: res.status });

  const body = (await request.json().catch(() => ({}))) as {
    favorite?: boolean; status?: string; caption?: string | null;
  };
  const patch: Record<string, unknown> = {};
  if (typeof body.favorite === "boolean") patch.favorite = body.favorite;
  if (body.status === "visible" || body.status === "hidden") patch.status = body.status;
  if (body.caption !== undefined) patch.caption = body.caption?.trim() || null;
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await res.supabase
    .from("album_photos").update(patch).eq("id", photoId).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ photo: data });
}
