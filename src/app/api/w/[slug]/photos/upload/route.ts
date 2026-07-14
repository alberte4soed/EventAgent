import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WeddingSiteRow } from "@/lib/db/types";

const MAX_BYTES = 25 * 1024 * 1024; // original quality — phones shoot big files
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "image/heic": "heic", "image/heif": "heif",
};
const MAX_PHOTOS_PER_EVENT = 500;

/**
 * POST /api/w/[slug]/photos/upload — a guest uploads a photo from the public
 * site, no login. Service role writes to the private 'site-photos' bucket and
 * records a site_photos row. Multipart form: file, uploaderName (optional),
 * consent ("true" required — GDPR), company (honeypot).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await request.formData();

  if (form.get("company")) return Response.json({ ok: true }); // honeypot
  if (form.get("consent") !== "true") {
    return Response.json({ error: "consent_required" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "file is required" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "file_too_large" }, { status: 413 });
  const ext = EXT[file.type];
  if (!ext) return Response.json({ error: "unsupported_type" }, { status: 415 });

  const admin = createAdminClient();
  const { data: siteRow } = await admin
    .from("wedding_sites").select("*").ilike("domain", slug).maybeSingle();
  const site = siteRow as WeddingSiteRow | null;
  if (!site || !site.published) return Response.json({ error: "Site not found" }, { status: 404 });

  const { count } = await admin
    .from("site_photos").select("id", { count: "exact", head: true }).eq("event_id", site.event_id);
  if ((count ?? 0) >= MAX_PHOTOS_PER_EVENT) {
    return Response.json({ error: "photo_limit_reached" }, { status: 429 });
  }

  const path = `${site.user_id}/${site.event_id}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from("site-photos").upload(path, bytes, {
    contentType: file.type, upsert: false,
  });
  if (upErr) return Response.json({ error: upErr.message }, { status: 500 });

  const uploaderName = String(form.get("uploaderName") ?? "").trim().slice(0, 120) || null;
  const { error } = await admin.from("site_photos").insert({
    event_id: site.event_id,
    user_id: site.user_id,
    uploader_name: uploaderName,
    storage_path: path,
    content_type: file.type,
    size_bytes: file.size,
    uploaded_by: "guest",
    consent_at: new Date().toISOString(),
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
