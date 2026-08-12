import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseConfig } from "@/kalas/site/config";
import { siteCookieName, siteCookieValue } from "@/lib/site-auth";
import type { EventRow, ProfileRow, WeddingSiteRow, AppLanguage } from "@/lib/db/types";
import { GuestUpload } from "./GuestUpload";

export const dynamic = "force-dynamic";

/**
 * /w/[slug]/del — where guests add their own photos after the wedding.
 *
 * Nested under /w/[slug] on purpose: it inherits the published check, the slug
 * lookup and the password cookie (which is scoped to path /w/{slug}) for free.
 */
export default async function GuestAlbumUpload({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: siteRow } = await admin
    .from("wedding_sites").select("*").ilike("domain", slug).maybeSingle();
  const site = siteRow as WeddingSiteRow | null;
  if (!site || !site.published) notFound();

  const [{ data: eventRow }, { data: profileRow }, { count }] = await Promise.all([
    admin.from("events").select("*").eq("id", site.event_id).maybeSingle(),
    admin.from("profiles").select("*").eq("user_id", site.user_id).maybeSingle(),
    admin.from("album_photos").select("id", { count: "exact", head: true }).eq("event_id", site.event_id),
  ]);
  const event = eventRow as EventRow | null;
  if (!event) notFound();
  const profile = (profileRow as ProfileRow | null) ?? null;

  const config = parseConfig(site.config);
  const lang: AppLanguage = profile?.language === "en" ? "en" : "da";

  const a = (profile?.display_name ?? event.title).split(/\s+/)[0] || "";
  const b = profile?.partner_name?.split(/\s+/)[0] ?? "";

  // Same gate as the wedding site itself — the couple's existing mental model.
  const rawPassword = typeof site.config?.sitePassword === "string" ? (site.config.sitePassword as string) : "";
  let locked = false;
  if (config.pwProtected && rawPassword) {
    const jar = await cookies();
    locked = jar.get(siteCookieName(slug))?.value !== siteCookieValue(slug, rawPassword);
  }

  return (
    <GuestUpload
      slug={slug}
      names={[a, b].filter(Boolean).join(" & ")}
      total={count ?? 0}
      closed={site.config?.albumOpen === false}
      locked={locked}
      lang={lang}
    />
  );
}
