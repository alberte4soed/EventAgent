import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimedCount } from "@/kalas/registry/gifts";
import type { RegistryItemRow, WeddingSiteRow } from "@/lib/db/types";

/**
 * POST /api/w/[slug]/registry/claim — a guest reserves a registry gift.
 * Service role: validates the item belongs to this site and isn't already fully
 * claimed, then records the claim. The couple sees the guest's name and message
 * on their registry screen; other guests only ever see that it is taken.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await request.json()) as {
    itemId?: string; name?: string; email?: string | null; message?: string | null;
  };
  const name = (body.name ?? "").trim();
  if (!body.itemId || !name) return Response.json({ error: "itemId and name are required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: siteRow } = await admin
    .from("wedding_sites").select("event_id, published").ilike("domain", slug).maybeSingle();
  const site = siteRow as Pick<WeddingSiteRow, "event_id" | "published"> | null;
  if (!site || !site.published) return Response.json({ error: "Site not found" }, { status: 404 });

  const { data: itemRow } = await admin
    .from("registry_items").select("*").eq("id", body.itemId).eq("event_id", site.event_id).maybeSingle();
  const item = itemRow as RegistryItemRow | null;
  if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

  // Sum `quantity`, don't count rows: both UIs sum, and the two only agree
  // while every claim happens to be for one. See claimedCount in
  // src/kalas/registry/gifts.ts.
  const { data: claimRows } = await admin
    .from("registry_claims").select("quantity").eq("item_id", item.id);
  const taken = claimedCount((claimRows as { quantity: number | null }[] | null) ?? []);
  if (taken >= item.quantity) {
    return Response.json({ error: "fully_claimed" }, { status: 409 });
  }

  const { error } = await admin.from("registry_claims").insert({
    item_id: item.id, event_id: item.event_id, user_id: item.user_id,
    guest_name: name, guest_email: body.email?.trim() || null, message: body.message?.trim() || null,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
