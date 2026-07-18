import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SitePhotoRow } from "@/lib/db/types";

export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per photo
const MAX_PHOTOS = 24; // per event
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function signPhoto(path: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.storage.from("site-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/**
 * GET /api/website/photos?eventId=… — the couple's site photos with signed
 * preview URLs for the builder.
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = request.nextUrl.searchParams.get("eventId") ?? "";
  if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });

  const { data } = await supabase
    .from("site_photos")
    .select("*")
    .eq("event_id", eventId)
    .order("sort")
    .order("created_at");
  const rows = (data ?? []) as SitePhotoRow[];

  const photos = await Promise.all(
    rows.map(async (p) => ({ ...p, url: await signPhoto(p.storage_path) }))
  );
  return Response.json({ photos });
}

/**
 * POST /api/website/photos — upload a couple photo (multipart form:
 * file + eventId + optional role). Stored privately; guests get per-request
 * signed URLs from the public page.
 */
export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const eventId = typeof form?.get("eventId") === "string" ? (form.get("eventId") as string) : "";
  const role = form?.get("role") === "hero" ? "hero" : "gallery";
  if (!(file instanceof File) || !eventId) {
    return Response.json({ error: "file and eventId are required" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) return Response.json({ error: "Kun JPEG, PNG eller WebP" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Billedet er for stort (max 8 MB)" }, { status: 413 });

  // Ownership via RLS: the select only returns the event if it's the user's.
  const { data: ev } = await supabase.from("events").select("id").eq("id", eventId).maybeSingle();
  if (!ev) return Response.json({ error: "Event not found" }, { status: 404 });

  const { count } = await supabase
    .from("site_photos")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  if ((count ?? 0) >= MAX_PHOTOS) {
    return Response.json({ error: `Max ${MAX_PHOTOS} billeder — slet nogle først` }, { status: 429 });
  }

  const id = crypto.randomUUID();
  const storagePath = `${user.id}/${eventId}/${id}.${ext}`;
  const admin = createAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("site-photos")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const { data: row, error: insertError } = await admin
    .from("site_photos")
    .insert({ id, event_id: eventId, user_id: user.id, storage_path: storagePath, kind: "upload", role })
    .select()
    .single();
  if (insertError || !row) {
    await admin.storage.from("site-photos").remove([storagePath]);
    return Response.json({ error: insertError?.message ?? "Insert failed" }, { status: 500 });
  }

  return Response.json({ photo: { ...(row as SitePhotoRow), url: await signPhoto(storagePath) } });
}
