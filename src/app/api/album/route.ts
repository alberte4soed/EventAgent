import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AlbumPhotoRow } from "@/lib/db/types";

const PAGE_SIZE = 60;

/**
 * GET /api/album?eventId=…&page=0 — the couple's guest album.
 *
 * The bucket is private, so every view needs signed URLs. They are minted in
 * one batched call per page: an album can hold 500 photos, and one round-trip
 * each would be a wall.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = request.nextUrl.searchParams.get("eventId") ?? "";
  if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
  const page = Math.max(0, Number(request.nextUrl.searchParams.get("page") ?? 0) || 0);

  // RLS scopes this to the couple's own rows; no ownership check needed.
  const { data, count, error } = await supabase
    .from("album_photos")
    .select("*", { count: "exact" })
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as AlbumPhotoRow[];
  const admin = createAdminClient();
  const { data: signed } = await admin.storage
    .from("site-photos")
    .createSignedUrls(rows.map((r) => r.storage_path), 3600);

  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return Response.json({
    photos: rows.map((r) => ({ ...r, url: urlByPath.get(r.storage_path) ?? null })),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    hasMore: (page + 1) * PAGE_SIZE < (count ?? 0),
  });
}
