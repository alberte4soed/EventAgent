import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseConfig } from "@/kalas/site/config";
import { siteCookieName, isSiteLocked } from "@/lib/site-auth";
import type { EventRow, ProfileRow, SitePhotoRow, WeddingSiteRow, AppLanguage } from "@/lib/db/types";
import { PhotosClient } from "./PhotosClient";

export const dynamic = "force-dynamic";

// Outside the component so the react-compiler lint doesn't flag the
// Date.now() call as impure render work.
function hasDatePassed(eventDate: string | null): boolean {
  if (!eventDate) return false;
  return new Date(`${eventDate}T00:00:00`).getTime() <= Date.now();
}

/**
 * /w/[slug]/photos — the QR-friendly photo page: guests upload from the phone
 * without login and browse the shared gallery. Same publish + password gate
 * as the main site; a locked site bounces to the front page's gate.
 */
export default async function PhotosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: siteRow } = await admin
    .from("wedding_sites").select("*").ilike("domain", slug).maybeSingle();
  const site = siteRow as WeddingSiteRow | null;
  if (!site || !site.published) notFound();

  const jar = await cookies();
  if (isSiteLocked(slug, site.config, jar.get(siteCookieName(slug))?.value)) {
    redirect(`/w/${slug}`);
  }

  const config = parseConfig(site.config);
  if (!config.sections.some((s) => s.id === "photos" && s.enabled)) notFound();

  const [{ data: eventRow }, { data: profileRow }, { data: photoRows }] = await Promise.all([
    admin.from("events").select("*").eq("id", site.event_id).maybeSingle(),
    admin.from("profiles").select("*").eq("user_id", site.user_id).maybeSingle(),
    admin.from("site_photos").select("*").eq("event_id", site.event_id)
      .eq("hidden", false).order("created_at", { ascending: false }),
  ]);
  const event = eventRow as EventRow | null;
  if (!event) notFound();
  const profile = (profileRow as ProfileRow | null) ?? null;
  const lang: AppLanguage = profile?.language === "en" ? "en" : "da";

  // Couple photos always show; guest photos only once the couple opens the
  // wall or the wedding date has passed (so the feed stays curated pre-day).
  const wallOpen = config.photoWallOpen || hasDatePassed(event.event_date);
  const photos = ((photoRows as SitePhotoRow[] | null) ?? [])
    .filter((p) => p.uploaded_by === "couple" || wallOpen);

  // Batch-sign the private storage paths (1 h).
  const paths = photos.map((p) => p.storage_path);
  const urlByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await admin.storage.from("site-photos").createSignedUrls(paths, 3600);
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) urlByPath[s.path] = s.signedUrl;
    }
  }

  const a = (profile?.display_name ?? event.title).split(/\s+/)[0] || "";
  const b = profile?.partner_name?.split(/\s+/)[0] ?? "";

  return (
    <PhotosClient
      slug={slug}
      coupleNames={`${a}${b ? ` & ${b}` : ""}`}
      lang={lang}
      wallOpen={wallOpen}
      photos={photos.map((p) => ({
        id: p.id,
        url: urlByPath[p.storage_path] ?? null,
        uploaderName: p.uploader_name,
        uploadedBy: p.uploaded_by,
      })).filter((p) => p.url)}
    />
  );
}
