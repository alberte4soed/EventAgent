import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseConfig } from "@/kalas/site/config";
import { parseSiteDesign, DEFAULT_DESIGN, type SiteDesign } from "@/kalas/site/design";
import { googleFontsHref } from "@/kalas/site/fonts";
import { siteCookieName, siteCookieValue } from "@/lib/site-auth";
import type {
  EventRow, ProfileRow, RegistryItemRow, RegistryClaimRow, WeddingSiteRow,
  WebsiteDesignRow, SitePhotoRow, AppLanguage,
} from "@/lib/db/types";
import { PublicSite } from "./PublicSite";

export const dynamic = "force-dynamic";

function coupleFrom(event: EventRow, profile: ProfileRow | null) {
  const a = (profile?.display_name ?? event.title).split(/\s+/)[0] || "";
  const b = profile?.partner_name?.split(/\s+/)[0] ?? "";
  const dateISO = event.event_date;
  const dateLabel = dateISO
    ? new Date(dateISO).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })
    : event.date_hint ?? "";
  return { a, b, dateISO, dateLabel };
}

export default async function PublicWeddingSite({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rsvp?: string }>;
}) {
  const { slug } = await params;
  const { rsvp: rsvpToken } = await searchParams;
  const admin = createAdminClient();

  // Look up the published site by its (case-insensitive) domain.
  const { data: siteRow } = await admin
    .from("wedding_sites")
    .select("*")
    .ilike("domain", slug)
    .maybeSingle();
  const site = siteRow as WeddingSiteRow | null;
  if (!site || !site.published) notFound();

  const [{ data: eventRow }, { data: profileRow }, { data: items }, { data: claims }, { data: designRow }, { data: photoRows }] = await Promise.all([
    admin.from("events").select("*").eq("id", site.event_id).maybeSingle(),
    admin.from("profiles").select("*").eq("user_id", site.user_id).maybeSingle(),
    admin.from("registry_items").select("*").eq("event_id", site.event_id).order("sort"),
    admin.from("registry_claims").select("item_id, quantity").eq("event_id", site.event_id),
    admin.from("website_designs").select("*").eq("event_id", site.event_id).eq("active", true).maybeSingle(),
    admin.from("site_photos").select("*").eq("event_id", site.event_id).order("sort"),
  ]);
  const event = eventRow as EventRow | null;
  if (!event) notFound();
  const profile = (profileRow as ProfileRow | null) ?? null;

  const config = parseConfig(site.config); // strips sitePassword by construction
  const couple = coupleFrom(event, profile);
  const lang: AppLanguage = profile?.language === "en" ? "en" : "da";
  const registryItems = (items as RegistryItemRow[] | null) ?? [];
  const claimedByItem: Record<string, number> = {};
  for (const c of (claims as Pick<RegistryClaimRow, "item_id" | "quantity">[] | null) ?? []) {
    claimedByItem[c.item_id] = (claimedByItem[c.item_id] ?? 0) + (c.quantity ?? 1);
  }

  // Ava's design (validated server-side) + per-request signed URLs for the
  // photos it references. The page is force-dynamic, so 1-hour URLs are
  // always fresh for guests while the bucket stays private.
  const activeDesign = designRow as WebsiteDesignRow | null;
  const design: SiteDesign = activeDesign ? parseSiteDesign(activeDesign.design) : DEFAULT_DESIGN;
  const photos = (photoRows as SitePhotoRow[] | null) ?? [];
  const referenced = new Set([design.images.heroPhotoId, ...design.images.galleryPhotoIds].filter(Boolean));
  const photoUrls: Record<string, string> = {};
  await Promise.all(
    photos
      .filter((p) => referenced.has(p.id))
      .map(async (p) => {
        const { data } = await admin.storage.from("site-photos").createSignedUrl(p.storage_path, 3600);
        if (data?.signedUrl) photoUrls[p.id] = data.signedUrl;
      })
  );

  // Password gate: the raw password never leaves the server; we compare the
  // signed cookie against the expected value.
  const rawPassword = typeof site.config?.sitePassword === "string" ? (site.config.sitePassword as string) : "";
  let locked = false;
  if (config.pwProtected && rawPassword) {
    const jar = await cookies();
    locked = jar.get(siteCookieName(slug))?.value !== siteCookieValue(slug, rawPassword);
  }

  return (
    <>
      {/* Fonts vary per site design, so they resolve at request time — next/font can't. */}
      <link rel="stylesheet" href={googleFontsHref([design.typography.displayFont, design.typography.bodyFont])} />
      <PublicSite
        slug={slug}
        couple={couple}
        config={config}
        design={design}
        photoUrls={photoUrls}
        registryItems={registryItems}
        claimedByItem={claimedByItem}
        lang={lang}
        locked={locked}
        rsvpToken={rsvpToken ?? null}
      />
    </>
  );
}
