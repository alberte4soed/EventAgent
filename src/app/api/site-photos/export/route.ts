import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEvent } from "@/lib/active-event";
import { zipStream, type ZipEntry } from "@/lib/zip";
import type { SitePhotoRow } from "@/lib/db/types";

/**
 * GET /api/site-photos/export — download-alt: streams every photo of the
 * couple's active wedding as one STORE-only ZIP (images are already
 * compressed). Couple-authed; rows come through RLS.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getActiveEvent(supabase, user.id);
  if (!event) return Response.json({ error: "No active wedding" }, { status: 400 });

  const { data: rows } = await supabase
    .from("site_photos").select("*").eq("event_id", event.id).order("created_at");
  const photos = (rows as SitePhotoRow[] | null) ?? [];
  if (photos.length === 0) return Response.json({ error: "no_photos" }, { status: 404 });

  const admin = createAdminClient();
  const seen = new Set<string>();

  async function* entries(): AsyncGenerator<ZipEntry> {
    for (const photo of photos) {
      const { data: blob } = await admin.storage.from("site-photos").download(photo.storage_path);
      if (!blob) continue;
      const base = photo.storage_path.split("/").pop() ?? `${photo.id}.jpg`;
      const who = photo.uploaded_by === "couple" ? "os-selv" : (photo.uploader_name || "gaester");
      let name = `${who.replace(/[^\p{L}\p{N} _.-]/gu, "").trim() || "gaester"}/${base}`;
      while (seen.has(name)) name = `${photo.id.slice(0, 8)}-${name}`;
      seen.add(name);
      yield {
        name,
        data: new Uint8Array(await blob.arrayBuffer()),
        mtime: new Date(photo.created_at),
      };
    }
  }

  const iterator = zipStream(entries());
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) controller.close();
      else controller.enqueue(value);
    },
    async cancel() {
      await iterator.return(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="bryllupsbilleder.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
