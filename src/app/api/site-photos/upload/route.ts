import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEvent } from "@/lib/active-event";

const MAX_BYTES = 25 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "image/svg+xml": "svg",
};

/**
 * POST /api/site-photos/upload — the couple uploads their own photos (pre-day
 * gallery) or a custom monogram to the private 'site-photos' bucket.
 * Multipart: file, kind ("photo" | "monogram"). Monograms only get a storage
 * object (path returned for the site config); photos also get a site_photos
 * row with uploaded_by='couple'.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getActiveEvent(supabase, user.id);
  if (!event) return Response.json({ error: "No active wedding" }, { status: 400 });

  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind") === "monogram" ? "monogram" : "photo";
  if (!(file instanceof File)) return Response.json({ error: "file is required" }, { status: 400 });
  const maxBytes = kind === "monogram" ? 1024 * 1024 : MAX_BYTES;
  if (file.size > maxBytes) return Response.json({ error: "file_too_large" }, { status: 413 });
  const ext = EXT[file.type];
  if (!ext || (kind === "photo" && ext === "svg")) {
    return Response.json({ error: "unsupported_type" }, { status: 415 });
  }

  const path = kind === "monogram"
    ? `${user.id}/${event.id}/monogram.${ext}`
    : `${user.id}/${event.id}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage.from("site-photos").upload(path, bytes, {
    contentType: file.type, upsert: kind === "monogram", // re-upload replaces the monogram
  });
  if (upErr) return Response.json({ error: upErr.message }, { status: 500 });

  if (kind === "monogram") return Response.json({ ok: true, path });

  const { data, error } = await supabase
    .from("site_photos")
    .insert({
      event_id: event.id, user_id: user.id, storage_path: path,
      content_type: file.type, size_bytes: file.size, uploaded_by: "couple",
    })
    .select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
