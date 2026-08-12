import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { translate } from "@/kalas/i18n";
import type { EventRow, ProfileRow, WeddingSiteRow, AppLanguage } from "@/lib/db/types";

export const dynamic = "force-dynamic";

/**
 * /w/[slug]/tak — the couple's public recap of the day.
 *
 * Gated on config.recapPublished rather than site.published, so the couple can
 * take the wedding site down and keep this up. Guest album photos are never
 * shown here; they stay private to the couple.
 */
export default async function Recap({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: siteRow } = await admin
    .from("wedding_sites").select("*").ilike("domain", slug).maybeSingle();
  const site = siteRow as WeddingSiteRow | null;
  if (!site || site.config?.recapPublished !== true) notFound();

  const [{ data: eventRow }, { data: profileRow }, { count: guestCount }] = await Promise.all([
    admin.from("events").select("*").eq("id", site.event_id).maybeSingle(),
    admin.from("profiles").select("*").eq("user_id", site.user_id).maybeSingle(),
    admin.from("guests").select("id", { count: "exact", head: true })
      .eq("event_id", site.event_id).eq("rsvp", "ja"),
  ]);
  const event = eventRow as EventRow | null;
  if (!event) notFound();
  const profile = (profileRow as ProfileRow | null) ?? null;

  const lang: AppLanguage = profile?.language === "en" ? "en" : "da";
  const t = (s: string, p?: Record<string, string | number>) => translate(lang, s, p);

  const recap = (site.config?.recap ?? {}) as { headline?: string; message?: string };
  const a = (profile?.display_name ?? event.title).split(/\s+/)[0] || "";
  const b = profile?.partner_name?.split(/\s+/)[0] ?? "";
  const names = [a, b].filter(Boolean).join(" & ");
  const dateLabel = event.event_date
    ? new Date(event.event_date).toLocaleDateString(lang === "en" ? "en-GB" : "da-DK", {
        day: "numeric", month: "long", year: "numeric",
      })
    : event.date_hint ?? "";

  return (
    <div className="theme-kalas min-h-screen bg-canvas px-6 py-20">
      <article className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink">
          <span className="font-serif text-[1.3rem] leading-none text-canvas">K</span>
        </div>

        <p className="mt-8 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted">
          {dateLabel}
        </p>
        <h1 className="mt-3 font-serif text-[clamp(2rem,7vw,2.8rem)] leading-[1.1] text-ink">
          {recap.headline?.trim() || t("Tak fordi I fejrede med os")}
        </h1>
        {names && <p className="mt-3 text-[0.95rem] text-muted">{names}</p>}

        {recap.message?.trim() && (
          <p className="mt-8 whitespace-pre-line text-left text-[0.95rem] leading-relaxed text-ink/85">
            {recap.message}
          </p>
        )}

        {(guestCount ?? 0) > 0 && (
          <p className="mt-10 border-t border-[var(--color-line)] pt-6 text-[0.85rem] text-muted">
            {t("{n} af jer var der på dagen.", { n: guestCount ?? 0 })}
          </p>
        )}
      </article>
    </div>
  );
}
