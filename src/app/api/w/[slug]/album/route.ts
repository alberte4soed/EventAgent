import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sniffImageType, CONTENT_TYPE } from "@/lib/album/sniff";
import { ALBUM_LIMITS, checkLimits, uploaderHash, clientIp } from "@/lib/album/limits";
import type { AlbumPhotoRow, WeddingSiteRow } from "@/lib/db/types";

export const maxDuration = 60;

/**
 * POST /api/w/[slug]/album — a guest adds a photo from the public /del page.
 *
 * The only unauthenticated write in the app, so it is layered: honeypot, the
 * site must be published and the album open, size cap, magic-byte type check
 * (never `file.type` — the client controls that), and three DB-counted rate
 * limits. Uploads land in the couple's private bucket folder; a guest can
 * never read anyone else's photo back.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "Ugyldig upload" }, { status: 400 });

  if (form.get("company")) return Response.json({ ok: true }); // honeypot

  const file = form.get("file");
  const uploaderName = String(form.get("name") ?? "").trim().slice(0, ALBUM_LIMITS.maxNameLength);
  const caption = String(form.get("caption") ?? "").trim().slice(0, ALBUM_LIMITS.maxCaptionLength);
  if (!(file instanceof File)) return Response.json({ error: "Vælg et billede" }, { status: 400 });
  if (!uploaderName) return Response.json({ error: "Skriv dit navn" }, { status: 400 });
  if (file.size > ALBUM_LIMITS.maxBytes) {
    return Response.json({ error: "Billedet er for stort (max 8 MB)" }, { status: 413 });
  }

  const admin = createAdminClient();
  const { data: siteRow } = await admin
    .from("wedding_sites").select("*").ilike("domain", slug).maybeSingle();
  const site = siteRow as WeddingSiteRow | null;
  if (!site || !site.published) return Response.json({ error: "Site not found" }, { status: 404 });
  if (site.config?.albumOpen === false) {
    return Response.json({ error: "Albummet er lukket" }, { status: 403 });
  }

  // Type comes from the bytes, not the declared Content-Type.
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sniffImageType(buffer);
  if (!ext) return Response.json({ error: "Kun JPEG, PNG eller WebP" }, { status: 415 });

  const hash = uploaderHash(clientIp(request.headers), slug);
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [total, hour, day] = await Promise.all([
    admin.from("album_photos").select("id", { count: "exact", head: true }).eq("event_id", site.event_id),
    admin.from("album_photos").select("id", { count: "exact", head: true }).eq("event_id", site.event_id).gte("created_at", hourAgo),
    admin.from("album_photos").select("id", { count: "exact", head: true }).eq("uploader_hash", hash).gte("created_at", dayAgo),
  ]);
  const limit = checkLimits({
    eventTotal: total.count ?? 0,
    lastHourEvent: hour.count ?? 0,
    last24hUploader: day.count ?? 0,
  });
  if (!limit.ok) return Response.json({ error: limit.message }, { status: limit.status });

  // Owner uid first so the existing storage select policy (foldername[1] =
  // auth.uid()) keeps letting the couple — and only the couple — read it.
  const id = crypto.randomUUID();
  const storagePath = `${site.user_id}/album/${site.event_id}/${id}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from("site-photos")
    .upload(storagePath, buffer, { contentType: CONTENT_TYPE[ext], upsert: false });
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const { data: row, error: insertError } = await admin
    .from("album_photos")
    .insert({
      id,
      event_id: site.event_id,
      user_id: site.user_id,
      storage_path: storagePath,
      uploader_name: uploaderName,
      caption: caption || null,
      bytes: file.size,
      uploader_hash: hash,
    })
    .select()
    .single();
  if (insertError || !row) {
    // Never leave an orphan object behind.
    await admin.storage.from("site-photos").remove([storagePath]);
    return Response.json({ error: insertError?.message ?? "Kunne ikke gemme" }, { status: 500 });
  }

  return Response.json({
    ok: true,
    id: (row as AlbumPhotoRow).id,
    total: (total.count ?? 0) + 1,
  });
}
