import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEvent } from "@/lib/active-event";
import { lookupProduct } from "@/lib/og";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
};

/**
 * POST /api/moodboard/import — import an image from a pasted URL (Pinterest pin
 * or any page). We resolve the page's og:image, download it server-side (no
 * hotlinking), store it in the moodboard bucket, and record it.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getActiveEvent(supabase, user.id);
  if (!event) return Response.json({ error: "No active wedding" }, { status: 400 });

  const { url } = (await request.json()) as { url?: string };
  if (!url?.trim()) return Response.json({ error: "url is required" }, { status: 400 });

  // Accept a direct image URL, otherwise resolve the page's og:image.
  let imageUrl = url.trim();
  const looksImage = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(imageUrl);
  if (!looksImage) {
    const info = await lookupProduct(imageUrl);
    if (!info.image) return Response.json({ error: "no_image_found" }, { status: 422 });
    imageUrl = info.image;
  }

  let res: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    res = await fetch(imageUrl, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0 (KalasBot/1.0)" } });
    clearTimeout(timeout);
  } catch {
    return Response.json({ error: "fetch_failed" }, { status: 422 });
  }
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const ext = EXT[contentType];
  if (!res.ok || !ext) return Response.json({ error: "no_image_found" }, { status: 422 });
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.byteLength > 8 * 1024 * 1024) return Response.json({ error: "File too large" }, { status: 413 });

  const path = `${user.id}/${event.id}/${randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage.from("moodboard").upload(path, bytes, { contentType, upsert: false });
  if (upErr) return Response.json({ error: upErr.message }, { status: 500 });

  const { data, error } = await supabase
    .from("moodboard_items")
    .insert({ event_id: event.id, user_id: user.id, storage_path: path, note: url.trim() })
    .select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
