"use client";

import { motion } from 'motion/react';
import { venueFunnel } from '@/lib/dashboard';
import { useWedding } from '../../useWedding';
import { useLang } from '../../i18n';
import type { ScreenId } from '../../Shell';
import { Chip, Eyebrow, Pill } from '../../ui';
import { kr } from './stages';

/* The venue hunt at a glance: shortlist → contacted → quoted → booked. */
export default function VenuePipeline({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { journey, venues, outbound, replies, event } = useWedding();
  const { t } = useLang();

  const stage = journey.find((s) => s.key === 'venue');
  if (!stage || stage.status === 'locked') return null;

  const funnel = venueFunnel(venues, outbound, replies, event);
  const bestQuoteVenue = funnel.bestQuote
    ? venues.find((v) => v.id === funnel.bestQuote!.venueId)?.name
    : null;

  const steps: { label: string; count: number }[] = [
    { label: t('Shortlistet'), count: funnel.shortlisted },
    { label: t('Kontaktet'), count: funnel.contacted },
    { label: t('Tilbud'), count: funnel.quoted },
    { label: t('Booket'), count: funnel.booked },
  ];

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between rule-b pb-4">
        <Eyebrow>{t('Venue-jagten')}</Eyebrow>
        <button onClick={() => onNavigate('venues')} className="eyebrow hover:text-ink transition-colors cursor-pointer">
          {t('Åbn venues')}
        </button>
      </div>

      {funnel.empty ? (
        <div className="mt-6 rule rounded-2xl bg-card px-6 py-8 text-center">
          <p className="font-serif text-[1.25rem] text-ink">{t('Venue-jagten venter på jer')}</p>
          <p className="mx-auto mt-2 max-w-sm text-[0.85rem] leading-relaxed text-muted">
            {t('Swipe jer gennem steder, der matcher jeres stil — Ava kontakter dem, I kan lide.')}
          </p>
          <Pill arrow onClick={() => onNavigate('venues')} className="mt-6">{t('Start venue-jagten')}</Pill>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl rule bg-[var(--color-line)] sm:grid-cols-4"
          >
            {steps.map((step, i) => (
              <button key={step.label} onClick={() => onNavigate(i === 2 ? 'inbox' : 'venues')}
                className="bg-canvas px-5 py-5 text-left transition-colors hover:bg-card cursor-pointer">
                <div className="font-serif text-[1.8rem] leading-none text-ink">{step.count}</div>
                <div className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted">{step.label}</div>
              </button>
            ))}
          </motion.div>
          {funnel.bestQuote && (
            <button onClick={() => onNavigate('inbox')} className="mt-4 flex items-center gap-3 cursor-pointer group">
              <Chip tone="sage">{t('Bedste tilbud')}</Chip>
              <span className="text-[0.85rem] text-ink-soft group-hover:text-ink transition-colors">
                {kr(funnel.bestQuote.amount)} {funnel.bestQuote.currency ?? 'kr'}
                {bestQuoteVenue ? ` · ${bestQuoteVenue}` : ''}
              </span>
            </button>
          )}
        </>
      )}
    </section>
  );
}
