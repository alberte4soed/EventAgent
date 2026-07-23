import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTemplateMeta } from "@/kalas/invitations/templates.meta";
import { coerceInvitationData, defaultDataFor } from "@/kalas/invitations/data";
import { INVITATION_FONTS_HREF } from "@/kalas/invitations/fonts";
import type { InvitationRow } from "@/lib/db/types";
import type { Language } from "@/kalas/invitations/types";
import { PublicInvitation } from "./PublicInvitation";

export const dynamic = "force-dynamic";

export default async function PublicInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("invitations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const invitation = row as InvitationRow | null;
  if (!invitation || invitation.status !== "published") notFound();

  const meta = getTemplateMeta(invitation.template_id);
  if (!meta) notFound();

  const raw = invitation.data as Record<string, unknown>;
  const language: Language = raw.language === "en" ? "en" : "da";
  const base = defaultDataFor(meta, { language });
  const data = coerceInvitationData(raw, base);

  return (
    <>
      <link rel="stylesheet" href={INVITATION_FONTS_HREF} />
      <PublicInvitation slug={slug} templateId={meta.id} data={data} />
    </>
  );
}
