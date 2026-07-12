"use client";

/* The real, full-size public wedding site. Rendered at /w/[slug] and driven
   entirely by the couple's SiteConfig + public-safe couple facts. The builder's
   thumbnail (Website.tsx SitePreview) is a separate compact preview; this is the
   page guests actually see. RSVP + registry claim handlers are injected. */

import { useState } from 'react';
import { IMAGES } from '../data';
import { useLang } from '../i18n';
import type { SiteConfig } from './config';
import { findLens, findColors, findFont } from './config';
import type { RegistryItemRow } from '@/lib/db/types';

export type PublicCouple = { a: string; b: string; dateLabel: string; dateISO: string | null };

const img = (key: string) => IMAGES[key as keyof typeof IMAGES] ?? IMAGES.orangeri;

function daysUntil(dateISO: string | null): number {
  if (!dateISO) return 0;
  const d = new Date(`${dateISO}T00:00:00`).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.ceil((d - Date.now()) / 86400000);
}

export function SiteRenderer({
  couple, config, registryItems = [], claimedByItem = {}, onRsvp, onClaim,
}: {
  couple: PublicCouple;
  config: SiteConfig;
  registryItems?: RegistryItemRow[];
  claimedByItem?: Record<string, number>;
  onRsvp?: () => void;
  onClaim?: (item: RegistryItemRow) => void;
}) {
  const { t } = useLang();
  const lens = findLens(config.lensId);
  const colors = findColors(config.colorId);
  const font = findFont(config.fontId);
  const days = daysUntil(couple.dateISO);
  const on = (id: string) => config.sections.some((s) => s.id === id && s.enabled);
  const names = `${couple.a}${couple.b ? ` & ${couple.b}` : ''}`;

  const heading: React.CSSProperties = { fontFamily: font.style.fontFamily, letterSpacing: font.style.letterSpacing };
  const kicker = (label: string) => (
    <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.28em]" style={{ color: colors.accent }}>{label}</p>
  );

  return (
    <div style={{ background: colors.bg, color: colors.text }} className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 backdrop-blur-md sm:px-10"
        style={{ background: `${colors.bg}E6`, borderBottom: `1px solid ${colors.text}14` }}>
        <span style={heading} className="text-[1.05rem]">{names}</span>
        <div className="hidden items-center gap-5 sm:flex">
          {on('story') && <a href="#story" className="text-[0.72rem] uppercase tracking-[0.14em] opacity-70 hover:opacity-100">{t('Historie')}</a>}
          {on('program') && <a href="#program" className="text-[0.72rem] uppercase tracking-[0.14em] opacity-70 hover:opacity-100">{t('Program')}</a>}
          {on('gifts') && <a href="#gifts" className="text-[0.72rem] uppercase tracking-[0.14em] opacity-70 hover:opacity-100">{t('Gaveønsker')}</a>}
          {on('rsvp') && (
            <button onClick={onRsvp} className="rounded-full px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition-opacity hover:opacity-85"
              style={{ background: colors.accent, color: colors.bg }}>RSVP</button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="relative flex min-h-[78vh] items-center justify-center overflow-hidden px-6 text-center">
        <img src={img(lens.image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: lens.dark ? 'rgba(0,0,0,0.55)' : 'rgba(40,50,40,0.42)' }} />
        <div className="absolute inset-x-0 top-0 h-1 flex">
          {[colors.bg, colors.accent, colors.text, colors.detail, colors.bg].map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <div className="relative">
          <p className="mb-3 text-[0.75rem] uppercase tracking-[0.34em] text-white/80">{couple.dateLabel}</p>
          <h1 className="text-white" style={{ ...heading, fontSize: 'clamp(2.6rem,9vw,6rem)', lineHeight: 1.05 }}>{names}</h1>
          <p className="mt-4 text-[0.95rem] text-white/85">{config.heroTagline}</p>
          {config.countdown && days > 0 && (
            <div className="mt-7 inline-flex items-center gap-2 rounded-full px-5 py-2"
              style={{ background: `${colors.accent}E6`, color: colors.bg }}>
              <span className="text-[1.1rem] font-bold tabular-nums">{days}</span>
              <span className="text-[0.72rem] uppercase tracking-[0.16em]">{t('dage til')}</span>
            </div>
          )}
          {on('rsvp') && (
            <div className="mt-7">
              <button onClick={onRsvp} className="rounded-full px-7 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-85"
                style={{ background: colors.accent, color: colors.bg }}>{t('Svar på invitation')}</button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
        {on('story') && config.storyText && (
          <section id="story" className="mb-24 text-center">
            {kicker(t('Vores historie'))}
            <p className="mx-auto max-w-xl font-serif text-[1.35rem] leading-relaxed" style={{ color: colors.text }}>{config.storyText}</p>
          </section>
        )}

        {on('program') && config.program.length > 0 && (
          <section id="program" className="mb-24">
            <div className="text-center">{kicker(t('Program for dagen'))}</div>
            <div className="mx-auto max-w-md">
              {config.program.map((ev) => (
                <div key={ev.id} className="flex items-baseline gap-5 py-4" style={{ borderBottom: `1px solid ${colors.text}14` }}>
                  <span className="w-14 shrink-0 tabular-nums text-[0.95rem]" style={{ color: colors.accent }}>{ev.time}</span>
                  <div>
                    <p className="text-[1.05rem]" style={{ ...heading, fontSize: '1.1rem' }}>{ev.label}</p>
                    {ev.sublabel && <p className="text-[0.85rem] opacity-60">{ev.sublabel}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {on('gallery') && config.galleryKeys.length > 0 && (
          <section className="mb-24">
            <div className="text-center">{kicker(t('Galleri'))}</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {config.galleryKeys.map((key) => (
                <div key={key} className="aspect-square overflow-hidden rounded-xl">
                  <img src={img(key)} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {on('gifts') && (
          <section id="gifts" className="mb-24">
            <div className="text-center">{kicker(t('Gaveønsker'))}</div>
            {config.giftsText && <p className="mx-auto mb-8 max-w-xl text-center text-[0.98rem] leading-relaxed opacity-80">{config.giftsText}</p>}
            {registryItems.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {registryItems.map((it) => {
                  const claimed = claimedByItem[it.id] ?? 0;
                  const left = Math.max(0, it.quantity - claimed);
                  return (
                    <div key={it.id} className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${colors.text}18` }}>
                      {it.image_url && <img src={it.image_url} alt="" className="h-40 w-full object-cover" />}
                      <div className="p-4">
                        <p className="text-[1rem]" style={{ ...heading, fontSize: '1.05rem' }}>{it.title}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-[0.85rem] opacity-70">
                            {it.price_cents != null ? `${(it.price_cents / 100).toLocaleString('da-DK')} ${it.currency}` : ''}
                            {it.store_name ? ` · ${it.store_name}` : ''}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          {it.product_url && (
                            <a href={it.product_url} target="_blank" rel="noopener noreferrer"
                              className="rounded-full px-3.5 py-1.5 text-[0.72rem] font-medium" style={{ border: `1px solid ${colors.text}25` }}>
                              {t('Se hos {store}', { store: it.store_name || t('butik') })}
                            </a>
                          )}
                          {left > 0 ? (
                            <button onClick={() => onClaim?.(it)} className="rounded-full px-3.5 py-1.5 text-[0.72rem] font-semibold"
                              style={{ background: colors.accent, color: colors.bg }}>{t('Reservér gave')}</button>
                          ) : (
                            <span className="text-[0.72rem] font-medium opacity-60">{t('Reserveret')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {config.giftsUrl && (
              <div className="mt-6 text-center">
                <a href={config.giftsUrl} target="_blank" rel="noopener noreferrer"
                  className="rounded-full px-6 py-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em]"
                  style={{ background: colors.accent, color: colors.bg }}>{t('Se ønskelisten')}</a>
              </div>
            )}
          </section>
        )}

        {on('transport') && config.transport && (
          <TextSection id="transport" kicker={kicker} title={t('Transport')} body={config.transport} colors={colors} />
        )}
        {on('dresscode') && config.dresscode && (
          <TextSection title={t('Dresscode')} kicker={kicker} body={config.dresscode} colors={colors} />
        )}

        {on('hotel') && config.hotels.length > 0 && (
          <section className="mb-24">
            <div className="text-center">{kicker(t('Overnatning'))}</div>
            <div className="mx-auto max-w-md space-y-3">
              {config.hotels.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-4 rounded-xl px-5 py-4" style={{ border: `1px solid ${colors.text}18` }}>
                  <div>
                    <p className="text-[0.98rem]" style={{ ...heading, fontSize: '1rem' }}>{h.name}</p>
                    <p className="text-[0.82rem] opacity-60">{h.dist}</p>
                  </div>
                  <span className="shrink-0 text-[0.82rem] opacity-70">{h.price}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {on('faq') && config.faq.length > 0 && (
          <section className="mb-24">
            <div className="text-center">{kicker(t('FAQ'))}</div>
            <div className="mx-auto max-w-xl space-y-3">
              {config.faq.map((f) => (
                <details key={f.id} className="rounded-xl px-5 py-4" style={{ border: `1px solid ${colors.text}18` }}>
                  <summary className="cursor-pointer text-[0.98rem]" style={{ ...heading, fontSize: '1rem' }}>{f.q}</summary>
                  <p className="mt-2 text-[0.9rem] leading-relaxed opacity-75">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {on('rsvp') && (
          <section id="rsvp" className="mb-8 text-center">
            {kicker(t('RSVP'))}
            <p className="mx-auto mb-6 max-w-md text-[1rem] opacity-80">
              {config.rsvpDeadline
                ? t('Svar venligst inden {date}.', { date: config.rsvpDeadline })
                : t('Vi glæder os til at fejre dagen med jer.')}
            </p>
            <button onClick={onRsvp} className="rounded-full px-8 py-3.5 text-[0.82rem] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-85"
              style={{ background: colors.accent, color: colors.bg }}>{t('Svar på invitation')}</button>
          </section>
        )}
      </main>

      {!config.hideBranding && (
        <footer className="py-10 text-center" style={{ borderTop: `1px solid ${colors.text}12` }}>
          <span className="text-[0.72rem] uppercase tracking-[0.2em] opacity-40">{t('Lavet med')} </span>
          <span className="font-serif text-[0.9rem] tracking-[0.12em] opacity-60">Kalas</span>
        </footer>
      )}
    </div>
  );
}

function TextSection({ id, title, body, colors, kicker }: {
  id?: string; title: string; body: string; colors: { text: string };
  kicker: (label: string) => React.ReactNode;
}) {
  return (
    <section id={id} className="mb-24 text-center">
      {kicker(title)}
      <p className="mx-auto max-w-xl whitespace-pre-line text-[0.98rem] leading-relaxed opacity-80" style={{ color: colors.text }}>{body}</p>
    </section>
  );
}
