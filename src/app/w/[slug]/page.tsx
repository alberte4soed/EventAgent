import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseConfig } from "@/kalas/site/config";
import { siteCookieName, isSiteLocked } from "@/lib/site-auth";
import { roomAvailability } from "@/lib/accommodation";
import type {
  EventRow, ProfileRow, RegistryItemRow, RegistryClaimRow, WeddingSiteRow, AppLanguage,
  AccommodationRoomRow, AccommodationReservationRow,
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

  const [{ data: eventRow }, { data: profileRow }, { data: items }, { data: claims }, { data: roomRows }, { data: resRows }] = await Promise.all([
    admin.from("events").select("*").eq("id", site.event_id).maybeSingle(),
    admin.from("profiles").select("*").eq("user_id", site.user_id).maybeSingle(),
    admin.from("registry_items").select("*").eq("event_id", site.event_id).order("sort"),
    admin.from("registry_claims").select("item_id, quantity").eq("event_id", site.event_id),
    admin.from("accommodation_rooms").select("*").eq("event_id", site.event_id).order("sort"),
    admin.from("accommodation_reservations").select("room_id, spots, status").eq("event_id", site.event_id),
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

  const rooms = (roomRows as AccommodationRoomRow[] | null) ?? [];
  const availability = roomAvailability(
    rooms,
    ((resRows as Pick<AccommodationReservationRow, "room_id" | "spots" | "status">[] | null) ?? [])
  );

  // Uploaded monogram lives in the private site-photos bucket → signed URL.
  let monogramUrl: string | null = null;
  if (config.monogram && config.monogramImagePath) {
    const { data: signed } = await admin.storage
      .from("site-photos").createSignedUrl(config.monogramImagePath, 3600);
    monogramUrl = signed?.signedUrl ?? null;
  }

  // Password gate: the raw password never leaves the server; we compare the
  // signed cookie against the expected value.
  const jar = await cookies();
  const locked = isSiteLocked(slug, site.config, jar.get(siteCookieName(slug))?.value);

  return (
    <PublicSite
      slug={slug}
      couple={couple}
      config={config}
      registryItems={registryItems}
      claimedByItem={claimedByItem}
      rooms={rooms}
      availability={availability}
      monogramUrl={monogramUrl}
      lang={lang}
      locked={locked}
      rsvpToken={rsvpToken ?? null}
    />
  );
}
