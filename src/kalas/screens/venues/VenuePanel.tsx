"use client";

import { motion } from 'motion/react';
import {
  Star, MapPin, Users, Route, Wallet, Heart, Check, Loader2, ExternalLink, ChevronUp,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../ui';
import { useLang } from '../../i18n';
import { capacityOf } from '@/lib/venue/facts';
import type { VenueBadge } from '@/lib/venue/filter';
import type { VenueSuggestion } from '@/lib/venue/search';

/* A venue opened from the results, unfolded across the full width of the grid
   directly under its own row.
 *
 * Built from the SUGGESTION, never from a saved row. The big VenueDetail needs
 * a database id — for its research pass and its outreach — so reaching it from
 * discovery meant saving the venue first, and "let me look at this one" is not
 * the same sentence as "put this on our list". Everything below is already in
 * the search result; opening a venue writes nothing. */
export default function VenuePanel({ v, badges, saved, saving, onSave, onClose, onPhoto }: {
  v: VenueSuggestion;
  badges: VenueBadge[];
  saved: boolean;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  onPhoto: (index: number) => void;
}) {
  const { t } = useLang();
  const photos = v.photos.length ? v.photos : v.photo ? [v.photo] : [];
  const seats = capacityOf(v.facts);

  return (
    <motion.div
      style={{ gridColumn: '1 / -1' }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-[#24413a] bg-[#ffffff]"
    >
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* Pictures */}
        {photos.length > 0 ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onPhoto(0)}
              aria-label={t('Se billeder af {name}', { name: v.name })}
              className="relative h-52 w-full cursor-pointer overflow-hidden rounded-xl bg-[#e8f0ec]"
            >
              <img src={photos[0]} alt={v.name} className="h-full w-full object-cover" />
            </button>
            {photos.length > 1 && (
              <div className="flex gap-2">
                {photos.slice(1, 5).map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => onPhoto(i + 1)}
                    aria-label={t('Billede {n}', { n: i + 2 })}
                    className="h-16 flex-1 cursor-pointer overflow-hidden rounded-lg bg-[#e8f0ec]"
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-52 items-center justify-center rounded-xl bg-[#e8f0ec]">
            <MapPin size={24} className="text-[#24413a] opacity-40" />
          </div>
        )}

        {/* What it is */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-[clamp(1.35rem,2.4vw,1.75rem)] leading-tight text-[#24413a]">
                {v.name}
              </h3>
              {v.address && (
                <p className="mt-1 flex items-start gap-1.5 text-[0.78rem] text-[#5f6b66]">
                  <MapPin size={12} className="mt-0.5 shrink-0" />{v.address}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('Luk')}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#5f6b66] transition-colors hover:bg-[#eceeeb] hover:text-[#24413a]"
            >
              <ChevronUp size={16} />
            </button>
          </div>

          {/* The four numbers a couple asks for first */}
          <dl className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2 border-y border-[#e6e9e5] py-3">
            {v.rating != null && (
              <Fact icon={<Star size={12} fill="currentColor" className="text-[#e6a34e]" />}
                label={t('Bedømmelse')}
                value={`${v.rating.toFixed(1)}${v.review_count ? ` (${v.review_count})` : ''}`} />
            )}
            {(seats || v.capacity) && (
              <Fact icon={<Users size={12} />} label={t('Kapacitet')}
                value={seats ? t('{n} gæster', { n: seats }) : v.capacity!} />
            )}
            {v.price_hint && (
              <Fact icon={<Wallet size={12} />} label={t('Pris')} value={v.price_hint} />
            )}
            {v.distance_km != null && (
              <Fact icon={<Route size={12} />} label={t('Afstand')}
                value={t('{n} km fra jer', { n: v.distance_km })} />
            )}
          </dl>

          {v.why_fit && (
            <div className="mt-3.5 rounded-xl bg-[#e8f0ec] px-4 py-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#7d938a]">
                {t('Avas note')}
              </p>
              <p className="mt-1 font-serif text-[0.95rem] italic leading-snug text-[#24413a]">
                {v.why_fit}
              </p>
            </div>
          )}

          {v.description && (
            <p className="mt-3.5 text-[0.84rem] leading-relaxed text-ink-soft">{v.description}</p>
          )}

          {badges.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b.id}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[0.68rem] font-semibold',
                    b.tone === 'good' && 'bg-[#e8f0ec] text-[#24413a]',
                    b.tone === 'warn' && 'bg-[#f7ece0] text-[#8a5a22]',
                    b.tone === 'neutral' && 'bg-[#eceeeb] text-[#5f6b66]',
                  )}
                >
                  {b.text}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            <button
              type="button"
              disabled={saved || saving}
              onClick={onSave}
              className={cn(
                'inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-[0.8rem] font-bold transition-colors',
                saved ? 'bg-[#e8f0ec] text-[#24413a] cursor-default' : 'bg-[#24413a] text-white hover:opacity-90 cursor-pointer',
              )}
            >
              {saving ? <Loader2 size={14} className="animate-spin" />
                : saved ? <Check size={14} /> : <Heart size={14} />}
              {saved ? t('På listen') : t('Gem på listen')}
            </button>
            {v.website && (
              <a
                href={v.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#dcdfdb] px-4 text-[0.8rem] font-semibold text-[#5f6b66] transition-colors hover:border-[#24413a] hover:text-[#24413a]"
              >
                <ExternalLink size={13} /> {t('Deres hjemmeside')}
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#7d938a]">{label}</dt>
      <dd className="mt-0.5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[#24413a]">
        {icon}{value}
      </dd>
    </div>
  );
}
