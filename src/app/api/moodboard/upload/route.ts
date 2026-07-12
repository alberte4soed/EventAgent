import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEvent } from "@/lib/active-event";

const MAX_BYTES = 8 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
};

/**
 * POST /api/moodboard/upload — persist an uploaded moodboard image to the
 * private `moodboard` bucket and record it in moodboard_items. Multipart form
 * with a single `file`.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getActiveEvent(supabase, user.id);
  if (!event) return Response.json({ error: "No active wedding" }, { status: 400 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "file is required" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "File too large" }, { status: 413 });
  const ext = EXT[file.type];
  if (!ext) return Response.json({ error: "Unsupported image type" }, { status: 415 });

  const path = `${user.id}/${event.id}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage.from("moodboard").upload(path, bytes, {
    contentType: file.type, upsert: false,
  });
  if (upErr) return Response.json({ error: upErr.message }, { status: 500 });

  const { data, error } = await supabase
    .from("moodboard_items")
    .insert({ event_id: event.id, user_id: user.id, storage_path: path })
    .select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
