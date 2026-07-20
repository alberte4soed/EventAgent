import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/kalas/site/config";
import { getTemplateMeta } from "@/kalas/invitations/templates.meta";
import type { EventRow, InvitationRow, ProfileRow } from "@/lib/db/types";

/** Resolve a unique, published-safe slug (case-insensitive) for an invitation,
    checking across all users via the service-role client. */
async function uniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  base: string,
  excludeId: string | null
): Promise<string> {
  const root = slugify(base);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await admin
      .from("invitations")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    const row = data as { id: string } | null;
    if (!row || row.id === excludeId) return candidate;
  }
  // Extremely unlikely — fall back to a random suffix.
  return `${root}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * POST /api/invitations — create or update the couple's digital invitation.
 * Assigns a unique share slug server-side. Body: { id?, templateId, data, publish? }.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    id?: string;
    templateId?: string;
    data?: Record<string, unknown>;
    publish?: boolean;
  };

  const meta = getTemplateMeta(body.templateId ?? "");
  if (!meta) return Response.json({ error: "Unknown template" }, { status: 400 });
  const data = body.data && typeof body.data === "object" ? body.data : {};

  // Resolve the couple's active event (profile pointer, else most recent).
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("active_event_id")
    .eq("user_id", user.id)
    .maybeSingle();
  let eventId = (profileRow as Pick<ProfileRow, "active_event_id"> | null)?.active_event_id ?? null;
  if (!eventId) {
    const { data: ev } = await supabase
      .from("events")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    eventId = (ev as Pick<EventRow, "id"> | null)?.id ?? null;
  }
  if (!eventId) return Response.json({ error: "No wedding found" }, { status: 400 });

  const admin = createAdminClient();
  const partnerA = typeof data.partnerA === "string" ? data.partnerA : "";
  const partnerB = typeof data.partnerB === "string" ? data.partnerB : "";
  const slugBase = [partnerA, partnerB].filter(Boolean).join("-") || "invitation";

  const status = body.publish ? "published" : "draft";
  const now = new Date().toISOString();

  if (body.id) {
    // Update existing (RLS scopes to the owner). Keep the existing slug.
    const { data: existing } = await supabase
      .from("invitations")
      .select("slug")
      .eq("id", body.id)
      .maybeSingle();
    const currentSlug = (existing as { slug: string | null } | null)?.slug ?? null;
    const slug = currentSlug ?? (await uniqueSlug(admin, slugBase, body.id));
    const { data: row, error } = await supabase
      .from("invitations")
      .update({ template_id: meta.id, data, slug, status, updated_at: now })
      .eq("id", body.id)
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(row as InvitationRow);
  }

  const slug = await uniqueSlug(admin, slugBase, null);
  const { data: row, error } = await supabase
    .from("invitations")
    .insert({
      event_id: eventId,
      user_id: user.id,
      template_id: meta.id,
      data,
      slug,
      status,
      updated_at: now,
    })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(row as InvitationRow);
}
