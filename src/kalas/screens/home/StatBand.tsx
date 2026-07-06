"use client";

import * as React from 'react';
import { motion } from 'motion/react';
import { budgetSummary, daysUntil, rsvpSummary } from '@/lib/dashboard';
import AnimateNumber from '../../AnimateNumber';
import { useWedding } from '../../useWedding';
import { useLang } from '../../i18n';
import type { ScreenId } from '../../Shell';

/* Four live numbers: countdown, RSVP, budget, quotes. Every tile deep-links
   to the screen where the number can be acted on. */
export default function StatBand({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { event, guests, budgetItems, replies } = useWedding();
  const { t, lang } = useLang();
  const locale = lang === 'da' ? 'da-DK' : 'en-GB';

  const days = daysUntil(event?.event_date ?? null);
  const rsvp = rsvpSummary(guests);
  const budget = budgetSummary(budgetItems, event?.budget ?? null);
  const quotes = replies.filter((r) => r.quote_status === 'quoted').length;

  const dayTile =
    days == null
      ? {
          value: <span className="font-serif text-[1.35rem] leading-tight">{event?.date_hint ?? '—'}</span>,
          label: event?.date_hint ? t('Bryllupsdato') : t('Dato ikke fastsat'),
        }
      : days < 0
        ? {
            value: <span className="font-serif text-[1.6rem] leading-tight">{t('Tillykke!')} 🤍</span>,
            label: t('Brylluppet er holdt'),
          }
        : {
            value: <AnimateNumber value={days} locale={locale} />,
            label: event?.date_precision === 'exact' ? t('Dage til brylluppet') : t('Dage til brylluppet · ca.'),
          };

  const tiles: { key: string; value: React.ReactNode; label: string; screen: ScreenId }[] = [
    { key: 'days', ...dayTile, screen: 'planning' },
    {
      key: 'rsvp',
      value:
        rsvp.total > 0 ? (
          <AnimateNumber value={rsvp.ja} locale={locale} suffix={<span className="text-[1.1rem] text-muted"> / {rsvp.total}</span>} />
        ) : (
          '—'
        ),
      label: rsvp.total > 0 ? t('Gæster har sagt ja') : t('Gæsteliste'),
      screen: 'guests',
    },
    {
      key: 'budget',
      value:
        budget.pctPlanned != null ? (
          <AnimateNumber value={Math.round(budget.pctPlanned * 100)} locale={locale} suffix={<span className="text-[1.1rem] text-muted"> %</span>} />
        ) : budget.planned > 0 ? (
          <AnimateNumber value={budget.planned} locale={locale} />
        ) : (
          '—'
        ),
      label: budget.pctPlanned != null ? t('Budget disponeret') : budget.planned > 0 ? t('Kr planlagt') : t('Budget'),
      screen: 'budget',
    },
    {
      key: 'quotes',
      value: quotes > 0 ? <AnimateNumber value={quotes} locale={locale} /> : '—',
      label: t('Tilbud modtaget'),
      screen: 'inbox',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl rule bg-[var(--color-line)] lg:grid-cols-4"
    >
      {tiles.map((tile) => (
        <button key={tile.key} onClick={() => onNavigate(tile.screen)}
          className="bg-canvas px-5 py-6 text-left transition-colors hover:bg-card cursor-pointer">
          <div className="font-serif text-[2.2rem] leading-none text-ink">{tile.value}</div>
          <div className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">{tile.label}</div>
        </button>
      ))}
    </motion.div>
  );
}
