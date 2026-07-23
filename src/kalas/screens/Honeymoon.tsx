"use client";

/* Honeymoon screen — a sibling to the venue discovery flow, but for the couple's
   trip after the wedding. Three tabs:
     · Udforsk    — spin the globe, pick a country, browse AI-curated honeymoon
                    destinations, then real romantic hotels for a chosen place.
     · Inspiration — an editorial gallery of honeymoon themes, destination
                    spotlights and idea cards (trips / routes / hotels).
     · Gemte      — everything the couple hearted, grouped by kind.
   Content is AI-generated (Gemini + Google Places) via /api/honeymoon/*, and
   favourites persist to honeymoon_saves through useWedding(). */

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart, MapPin, Star, Loader2, Globe as GlobeIcon, Search, PenLine,
  ArrowRight, ArrowUpRight, Plane, Hotel, Route, Sparkles, Expand, Trash2,
} from 'lucide-react';
import { Lightbox } from '../onboarding/Lightbox';
import { useWedding } from '../useWedding';
import { cn } from '../ui';
import type { NavigateTarget } from '../lib/hub-nav';
import { useLang } from '../i18n';
import type { HoneymoonSaveRow } from '@/lib/db/types';
import type { HoneymoonDestination } from '@/app/api/honeymoon/destinations/route';
import type { HoneymoonHotel } from '@/app/api/honeymoon/hotels/route';
import type {
  HoneymoonInspiration,
  HoneymoonIdeaKind,
} from '@/app/api/honeymoon/inspiration/route';

const DestinationGlobe = dynamic(() => import('../onboarding/DestinationGlobe'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 size={22} className="animate-spin text-muted" />
    </div>
  ),
});

type HTab = 'udforsk' | 'inspiration' | 'gemte';

/* ── Heart / save toggle ─────────────────────────────────────────────────── */
function SaveHeart({ saved, onClick, className }: {
  saved: boolean; onClick: () => void; className?: string;
}) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={saved ? t('Fjern fra gemte') : t('Gem')}
      aria-pressed={saved}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors cursor-pointer',
        saved ? 'bg-[#b34e37] text-white' : 'bg-canvas/90 text-[#59634f] hover:text-[#b34e37]',
        className,
      )}
    >
      <Heart size={16} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
    </button>
  );
}

function RatingBadge({ rating, className }: { rating: number | null; className?: string }) {
  if (rating == null) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-canvas/90 px-2.5 py-1 text-[0.68rem] font-semibold text-ink backdrop-blur-sm', className)}>
      <Star size={11} fill="currentColor" className="text-[#e6a34e]" />
      {rating.toFixed(1)}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════════ */
export default function Honeymoon({ onNavigate }: { onNavigate?: (s: NavigateTarget) => void }) {
  const { t, lang } = useLang();
  const { couple, honeymoonSaves, addHoneymoonSave, removeHoneymoonSave } = useWedding();
  const [tab, setTab] = useState<HTab>('udforsk');

  // Shared save helpers (dedupe on place_id when present, else on name+kind).
  const savedKey = (kind: string, placeId: string | null, name: string) =>
    placeId ? `${kind}:${placeId}` : `${kind}:${name.toLowerCase()}`;
  const savedIndex = new Map(
    honeymoonSaves.map((h) => [savedKey(h.kind, h.place_id, h.name), h]),
  );
  const findSaved = (kind: string, placeId: string | null, name: string) =>
    savedIndex.get(savedKey(kind, placeId, name)) ?? null;

  const toggleSave = async (
    row: {
      kind: HoneymoonSaveRow['kind'];
      name: string;
      location?: string | null;
      blurb?: string | null;
      image_url?: string | null;
      place_id?: string | null;
      rating?: number | null;
      meta?: Record<string, unknown>;
    },
  ) => {
    const existing = findSaved(row.kind, row.place_id ?? null, row.name);
    if (existing) {
      await removeHoneymoonSave(existing.id);
    } else {
      await addHoneymoonSave(row);
    }
  };

  // Cross-tab jump: Inspiration "Se hoteller" hands a destination to Udforsk.
  const udforskRef = useRef<{ searchHotels: (dest: string) => void } | null>(null);
  const goToHotels = (dest: string) => {
    setTab('udforsk');
    // Wait for Udforsk to mount before driving its search.
    requestAnimationFrame(() => udforskRef.current?.searchHotels(dest));
  };

  const TABS: { id: HTab; label: string; Icon: typeof GlobeIcon }[] = [
    { id: 'udforsk', label: 'Udforsk', Icon: GlobeIcon },
    { id: 'inspiration', label: 'Inspiration', Icon: Sparkles },
    { id: 'gemte', label: 'Gemte', Icon: Heart },
  ];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-8 sm:px-9 lg:px-12">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9079]">{t('Planlægning')}</p>
        <h1 className="mt-1 flex items-center gap-2.5 font-serif text-[clamp(2rem,4vw,2.4rem)] leading-[1.1] tracking-[-0.02em] text-[#314523]">
          <Plane size={26} strokeWidth={1.7} className="shrink-0 text-[#8a9079]" />
          {t('Bryllupsrejse')}
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-[#6c7561]">
          {t('Drøm jer væk sammen — find destinationer på kloden, bliv inspireret, og gem de steder I forelsker jer i.')}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[#e0ddd2]">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          const count = id === 'gemte' && honeymoonSaves.length > 0 ? honeymoonSaves.length : null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'relative flex items-center gap-2 px-3 py-2.5 text-[0.82rem] font-semibold transition-colors cursor-pointer',
                active ? 'text-[#314523]' : 'text-muted hover:text-ink',
              )}
            >
              <Icon size={15} strokeWidth={2} />
              {t(label)}
              {count != null && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#eef1e6] px-1 text-[0.6rem] font-bold text-[#314523]">
                  {count}
                </span>
              )}
              {active && (
                <motion.span layoutId="honeymoon-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#314523]" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'udforsk' && (
          <UdforskTab
            key="udforsk"
            ref={udforskRef}
            region={couple.region}
            lang={lang}
            findSaved={findSaved}
            onToggleSave={toggleSave}
          />
        )}
        {tab === 'inspiration' && (
          <InspirationTab
            key="inspiration"
            lang={lang}
            findSaved={findSaved}
            onToggleSave={toggleSave}
            onSeeHotels={goToHotels}
            onExplore={() => setTab('udforsk')}
          />
        )}
        {tab === 'gemte' && (
          <GemteTab
            key="gemte"
            saves={honeymoonSaves}
            onRemove={removeHoneymoonSave}
            onExplore={() => setTab('udforsk')}
            onInspire={() => setTab('inspiration')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

type FindSaved = (kind: string, placeId: string | null, name: string) => HoneymoonSaveRow | null;
type ToggleSave = (row: {
  kind: HoneymoonSaveRow['kind'];
  name: string;
  location?: string | null;
  blurb?: string | null;
  image_url?: string | null;
  place_id?: string | null;
  rating?: number | null;
  meta?: Record<string, unknown>;
}) => void;

/* ══════════════════════════════════════════════════════════════════════════
   UDFORSK — globe → country → destinations → hotels
══════════════════════════════════════════════════════════════════════════ */
const UdforskTab = forwardRef<
  { searchHotels: (dest: string) => void },
  { region: string; lang: string; findSaved: FindSaved; onToggleSave: ToggleSave }
>(function UdforskTab({ region, lang, findSaved, onToggleSave }, ref) {
  const { t } = useLang();

  const [country, setCountry] = useState<string | null>(null);
  const [dests, setDests] = useState<HoneymoonDestination[]>([]);
  const [destLoading, setDestLoading] = useState(false);
  const [destFailed, setDestFailed] = useState(false);
  const seenDest = useRef<Record<string, HoneymoonDestination[]>>({});

  const [custom, setCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const [destination, setDestination] = useState<string | null>(null);
  const [hotels, setHotels] = useState<HoneymoonHotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsFailed, setHotelsFailed] = useState(false);
  const seenHotels = useRef<Record<string, HoneymoonHotel[]>>({});

  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number; alt: string } | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const scrollToResults = () =>
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  const loadDestinations = async (c: string) => {
    setDestFailed(false);
    const hit = seenDest.current[c];
    if (hit) { setDests(hit); return; }
    setDestLoading(true);
    setDests([]);
    try {
      const res = await fetch(`/api/honeymoon/destinations?country=${encodeURIComponent(c)}&lang=${lang}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { suggestions?: HoneymoonDestination[] };
      const list = data.suggestions ?? [];
      if (list.length === 0) { setDestFailed(true); return; }
      seenDest.current[c] = list;
      setDests(list);
    } catch {
      setDestFailed(true);
    } finally {
      setDestLoading(false);
    }
  };

  const pickCountry = (c: string) => {
    setCustom(false);
    setCountry(c);
    void loadDestinations(c);
  };

  const searchHotels = async (dest: string) => {
    setDestination(dest);
    setHotelsFailed(false);
    scrollToResults();
    const hit = seenHotels.current[dest];
    if (hit) { setHotels(hit); return; }
    setHotelsLoading(true);
    setHotels([]);
    try {
      const res = await fetch('/api/honeymoon/hotels', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: dest, lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { hotels?: HoneymoonHotel[] };
      const list = data.hotels ?? [];
      if (list.length === 0) { setHotelsFailed(true); return; }
      seenHotels.current[dest] = list;
      setHotels(list);
    } catch {
      setHotelsFailed(true);
    } finally {
      setHotelsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ searchHotels }));

  const submitCustom = () => {
    const v = customValue.trim();
    if (v) void searchHotels(v);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-1 flex-col gap-6"
    >
      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Globe */}
        <div className="relative h-[min(58vh,520px)] overflow-hidden rounded-[28px] border border-[#d8d4c7] bg-[#f7f5ef]">
          <DestinationGlobe selectedCountry={country} onCountryPick={pickCountry} />
        </div>

        {/* Destination panel */}
        <div className="flex min-h-[320px] max-h-[min(58vh,520px)] flex-col overflow-hidden rounded-[28px] border border-[#d8d4c7] bg-[#fcfbf7]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e4e0d4] px-5 py-4">
            <div className="min-w-0">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted">{t('Destination')}</p>
              <h3 className="truncate font-serif text-[1.2rem] leading-tight text-ink">{country ?? t('Vælg et sted')}</h3>
            </div>
            <button
              type="button"
              onClick={() => setCustom((c) => !c)}
              aria-pressed={custom}
              className={cn(
                'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.72rem] font-semibold transition-colors cursor-pointer',
                custom
                  ? 'border-[#314523] bg-[#eef1e6] text-[#314523]'
                  : 'border-[#d8d4c7] text-[#6c7561] hover:border-[#314523] hover:text-[#314523]',
              )}
            >
              <PenLine size={13} /> {t('Skriv selv')}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {custom && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0 overflow-hidden border-b border-[#e4e0d4] bg-[#f7f5ef]"
              >
                <div className="flex items-center gap-2 px-4 py-3">
                  <input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitCustom(); }}
                    placeholder={t('f.eks. Maldiverne · Toscana · Bali')}
                    className="h-9 min-w-0 flex-1 rounded-full border border-[#d8d4c7] bg-[#fcfbf7] px-4 text-[0.82rem] text-ink placeholder:text-[#9a9686] focus:border-[#314523] focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={submitCustom}
                    disabled={!customValue.trim()}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#314523] px-3.5 text-[0.72rem] font-semibold text-[#f7f5ef] transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  >
                    <Search size={13} /> {t('Søg')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!country ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#314523]">
                  <GlobeIcon size={19} className="text-white" />
                </div>
                <p className="text-[0.88rem] leading-relaxed text-ink-soft">
                  {t('Tryk på et land på kloden — eller skriv selv et sted — for at se honeymoon-destinationer.')}
                </p>
                {region && (
                  <button
                    type="button"
                    onClick={() => void searchHotels(region)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#314523] px-4 py-2.5 text-[0.78rem] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <MapPin size={13} />
                    {t('Søg hoteller nær {area}', { area: region })}
                  </button>
                )}
              </div>
            ) : destLoading ? (
              <PanelSpinner label={t('Finder honeymoon-destinationer i {country}…', { country: country! })} />
            ) : destFailed ? (
              <PanelError label={t('Kunne ikke hente destinationer.')} onRetry={() => void loadDestinations(country)} />
            ) : (
              <div className="flex flex-col gap-3">
                {dests.map((s) => {
                  const saved = Boolean(findSaved('destination', null, s.name));
                  return (
                    <DestCard
                      key={`${s.kind}-${s.name}`}
                      s={s}
                      active={destination === `${s.name}, ${country}`}
                      saved={saved}
                      onChoose={() => void searchHotels(`${s.name}, ${country}`)}
                      onToggleSave={() => onToggleSave({
                        kind: 'destination', name: s.name,
                        location: [s.region, country].filter(Boolean).join(', ') || country,
                        blurb: s.blurb, image_url: s.photo, rating: s.rating,
                        meta: { kind: s.kind },
                      })}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chosen destination → hotels */}
      <div ref={resultsRef} className="scroll-mt-6">
        {destination && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e0ddd2] pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9079]">{t('Honeymoon-hoteller')}</p>
                <h2 className="mt-1 font-serif text-[clamp(1.5rem,3vw,2rem)] leading-tight text-[#314523]">{destination}</h2>
                <p className="mt-1 text-[13px] text-[#6c7561]">
                  {t('Romantiske ophold til jeres bryllupsrejse — tryk på hjertet for at gemme.')}
                </p>
              </div>
            </div>

            {hotelsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7]">
                    <div className="h-44 bg-[#f0ede5]" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-1/2 rounded bg-[#f0ede5]" />
                      <div className="h-3 w-5/6 rounded bg-[#f0ede5]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hotelsFailed ? (
              <div className="rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7] p-8 text-center">
                <p className="text-[0.9rem] text-ink-soft">{t('Kunne ikke finde hoteller her.')}</p>
                <button
                  type="button"
                  onClick={() => void searchHotels(destination)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#314523] px-4 py-2 text-[0.78rem] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                >
                  {t('Prøv igen')}
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {hotels.map((h) => (
                  <HotelCard
                    key={h.id}
                    h={h}
                    saved={Boolean(findSaved('hotel', h.place_id, h.name))}
                    onToggleSave={() => onToggleSave({
                      kind: 'hotel', name: h.name, location: h.address ?? destination,
                      blurb: h.why_fit ?? h.description, image_url: h.photo,
                      place_id: h.place_id, rating: h.rating,
                      meta: { price_hint: h.price_hint, photos: h.photos },
                    })}
                    onExpand={h.photos.length ? () => setLightbox({ photos: h.photos, index: 0, alt: h.name }) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {lightbox && lightbox.photos.length > 0 && (
        <Lightbox
          photos={lightbox.photos}
          index={Math.min(Math.max(lightbox.index, 0), lightbox.photos.length - 1)}
          onIndex={(i) => setLightbox((lb) => (lb ? { ...lb, index: i } : lb))}
          onClose={() => setLightbox(null)}
          alt={lightbox.alt}
        />
      )}
    </motion.div>
  );
});

/* Destination card in the side panel. */
function DestCard({ s, active, saved, onChoose, onToggleSave }: {
  s: HoneymoonDestination; active: boolean; saved: boolean;
  onChoose: () => void; onToggleSave: () => void;
}) {
  const { t } = useLang();
  const KIND_LABEL: Record<HoneymoonDestination['kind'], string> = {
    beach: t('Strand'), adventure: t('Eventyr'), city: t('By'), nature: t('Natur'),
  };
  return (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl border transition-colors',
      active ? 'border-[#314523] shadow-[0_6px_18px_rgba(23,60,50,0.12)]' : 'border-[#e4e0d4] hover:border-[#314523]/40',
    )}>
      <div className="absolute right-2 top-2 z-10">
        <SaveHeart saved={saved} onClick={onToggleSave} className="h-8 w-8" />
      </div>
      <button type="button" onClick={onChoose} className="block w-full text-left cursor-pointer">
        {s.photo ? (
          <div className="relative h-28 w-full overflow-hidden">
            <img src={s.photo} alt={s.name} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="flex h-28 w-full items-center justify-center bg-[#eef1e6]">
            <MapPin size={18} className="text-[#314523] opacity-40" />
          </div>
        )}
        <div className="p-3">
          <div className="flex items-center gap-2">
            <p className="truncate font-serif text-[0.98rem] text-[#314523]">{s.name}</p>
            <span className="shrink-0 rounded-full bg-[#f0ede5] px-2 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.1em] text-[#314523]">
              {KIND_LABEL[s.kind]}
            </span>
            {s.rating != null && (
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[0.7rem] text-ink-soft">
                <Star size={11} className="fill-[#e6a34e] text-[#e6a34e]" />{s.rating.toFixed(1)}
              </span>
            )}
          </div>
          {s.blurb && <p className="mt-1 line-clamp-2 text-[0.76rem] leading-snug text-ink-soft">{s.blurb}</p>}
          <span className="mt-1.5 inline-flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#314523]">
            {t('Se hoteller')} <ArrowRight size={12} />
          </span>
        </div>
      </button>
    </div>
  );
}

/* Hotel result card. */
function HotelCard({ h, saved, onToggleSave, onExpand }: {
  h: HoneymoonHotel; saved: boolean; onToggleSave: () => void; onExpand?: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7] transition-shadow hover:shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden">
        {h.photo ? (
          <img src={h.photo} alt={h.name} loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#eef1e6]"><Hotel size={22} className="text-[#314523] opacity-40" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a221533] to-transparent" />
        <div className="absolute right-2 top-2"><SaveHeart saved={saved} onClick={onToggleSave} /></div>
        <RatingBadge rating={h.rating} className="absolute left-2 top-2" />
        {onExpand && (
          <button type="button" onClick={onExpand} aria-label="Se billeder"
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/90 text-[#59634f] backdrop-blur-sm transition-colors hover:text-ink cursor-pointer">
            <Expand size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-serif text-[1.02rem] leading-tight text-ink">{h.name}</p>
        {h.address && <p className="mt-0.5 truncate text-[0.7rem] text-muted">{h.address}</p>}
        {(h.why_fit || h.description) && (
          <p className="mt-2 line-clamp-2 text-[0.8rem] leading-snug text-ink-soft">{h.why_fit || h.description}</p>
        )}
        {h.price_hint && (
          <span className="mt-2.5 inline-block w-fit rounded-full bg-shell px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#6c7561]">{h.price_hint}</span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   INSPIRATION — editorial gallery
══════════════════════════════════════════════════════════════════════════ */
function InspirationTab({ lang, findSaved, onToggleSave, onSeeHotels, onExplore }: {
  lang: string; findSaved: FindSaved; onToggleSave: ToggleSave;
  onSeeHotels: (dest: string) => void; onExplore: () => void;
}) {
  const { t } = useLang();
  const [data, setData] = useState<HoneymoonInspiration | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`/api/honeymoon/inspiration?lang=${lang}`);
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as HoneymoonInspiration;
        if (!alive) return;
        if ((json.themes?.length ?? 0) === 0 && (json.spotlights?.length ?? 0) === 0) setFailed(true);
        else setData(json);
      } catch {
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [lang]);

  const IDEA_META: Record<HoneymoonIdeaKind, { label: string; Icon: typeof Plane }> = {
    trip: { label: t('Tur'), Icon: Plane },
    route: { label: t('Rute'), Icon: Route },
    hotel: { label: t('Hotel'), Icon: Hotel },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-1 flex-col gap-9"
    >
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-muted" />
          <p className="text-[0.85rem] text-ink-soft">{t('Samler inspiration…')}</p>
        </div>
      ) : failed || !data ? (
        <div className="rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7] p-10 text-center">
          <p className="font-serif text-[1.2rem] text-ink">{t('Ingen inspiration lige nu')}</p>
          <p className="mt-1 text-[0.85rem] text-ink-soft">{t('Prøv i stedet at udforske destinationer på kloden.')}</p>
          <button type="button" onClick={onExplore}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#314523] px-4 py-2.5 text-[0.78rem] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer">
            <GlobeIcon size={14} /> {t('Udforsk')}
          </button>
        </div>
      ) : (
        <>
          {/* Themes — full-bleed editorial cards */}
          {data.themes.length > 0 && (
            <section>
              <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">{t('Honeymoon-typer')}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.themes.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={onExplore}
                    className="group relative flex h-52 items-center justify-center overflow-hidden rounded-[20px] text-center cursor-pointer"
                  >
                    {th.photo ? (
                      <img src={th.photo} alt={th.title} loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#4d5638] to-[#314523]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10" />
                    <div className="relative px-5">
                      <h3 className="font-serif text-[1.4rem] uppercase tracking-[0.18em] text-white drop-shadow">{th.title}</h3>
                      {th.blurb && <p className="mx-auto mt-1.5 max-w-[240px] text-[0.78rem] leading-snug text-white/85">{th.blurb}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Spotlights — destination cards with a CTA into hotels */}
          {data.spotlights.length > 0 && (
            <section>
              <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">{t('Destinations-spotlight')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.spotlights.map((sp) => {
                  const dest = [sp.name, sp.country].filter(Boolean).join(', ');
                  const saved = Boolean(findSaved('destination', null, sp.name));
                  return (
                    <div key={sp.name} className="group relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-[20px]">
                      {sp.photo ? (
                        <img src={sp.photo} alt={sp.name} loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4d5638] to-[#314523]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                      <div className="absolute right-3 top-3">
                        <SaveHeart saved={saved} onClick={() => onToggleSave({
                          kind: 'destination', name: sp.name, location: sp.country,
                          blurb: sp.blurb, image_url: sp.photo, rating: sp.rating, meta: { spotlight: true },
                        })} />
                      </div>
                      <div className="relative p-5">
                        {sp.country && <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/70">{sp.country}</p>}
                        <h3 className="mt-0.5 font-serif text-[1.5rem] leading-tight text-white">{sp.name}</h3>
                        {sp.blurb && <p className="mt-1 max-w-[440px] text-[0.82rem] leading-snug text-white/85">{sp.blurb}</p>}
                        <button
                          type="button"
                          onClick={() => onSeeHotels(dest)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f7f5ef] px-4 py-2 text-[0.74rem] font-bold text-[#314523] transition-opacity hover:opacity-90 cursor-pointer"
                        >
                          {t('Se hoteller')} <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Ideas — trips / routes / hotels */}
          {data.ideas.length > 0 && (
            <section>
              <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">{t('Idéer til turen')}</p>
              <h2 className="mb-3 font-serif text-[clamp(1.4rem,3vw,1.9rem)] leading-tight text-[#314523]">
                {t('Ture, ruter & romantiske ophold')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.ideas.map((idea, i) => {
                  const meta = IDEA_META[idea.kind];
                  const saved = Boolean(findSaved('idea', null, idea.title));
                  return (
                    <div key={`${idea.title}-${i}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7] transition-shadow hover:shadow-sm">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {idea.photo ? (
                          <img src={idea.photo} alt={idea.title} loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#eef1e6]"><meta.Icon size={22} className="text-[#314523] opacity-40" /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a221533] to-transparent" />
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-canvas/90 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[#314523] backdrop-blur-sm">
                          <meta.Icon size={11} /> {meta.label}
                        </span>
                        <div className="absolute right-2 top-2">
                          <SaveHeart saved={saved} onClick={() => onToggleSave({
                            kind: 'idea', name: idea.title, location: idea.location,
                            blurb: idea.blurb, image_url: idea.photo, meta: { idea_kind: idea.kind },
                          })} />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <p className="font-serif text-[1.02rem] leading-tight text-ink">{idea.title}</p>
                        {idea.location && <p className="mt-0.5 truncate text-[0.7rem] text-muted">{idea.location}</p>}
                        {idea.blurb && <p className="mt-2 line-clamp-2 text-[0.8rem] leading-snug text-ink-soft">{idea.blurb}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   GEMTE — saved favourites, grouped by kind
══════════════════════════════════════════════════════════════════════════ */
function GemteTab({ saves, onRemove, onExplore, onInspire }: {
  saves: HoneymoonSaveRow[];
  onRemove: (id: string) => void;
  onExplore: () => void; onInspire: () => void;
}) {
  const { t } = useLang();
  const groups: { kind: HoneymoonSaveRow['kind']; label: string; Icon: typeof Plane }[] = [
    { kind: 'destination', label: t('Destinationer'), Icon: MapPin },
    { kind: 'hotel', label: t('Hoteller'), Icon: Hotel },
    { kind: 'idea', label: t('Idéer'), Icon: Sparkles },
  ];

  if (saves.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-card p-10 text-center"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef1e6]">
          <Heart size={20} className="text-[#314523]" />
        </span>
        <p className="mt-3 font-serif text-[1.25rem] text-ink">{t('Ingen gemte endnu')}</p>
        <p className="mx-auto mt-1 max-w-sm text-[0.85rem] text-ink-soft">
          {t('Tryk på hjertet ved en destination, et hotel eller en idé, så samler vi dem her.')}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          <button type="button" onClick={onExplore}
            className="inline-flex items-center gap-2 rounded-full bg-[#314523] px-4 py-2.5 text-[0.78rem] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer">
            <GlobeIcon size={14} /> {t('Udforsk')}
          </button>
          <button type="button" onClick={onInspire}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8d4c7] px-4 py-2.5 text-[0.78rem] font-bold text-[#314523] transition-colors hover:bg-[#eef1e6] cursor-pointer">
            <Sparkles size={14} /> {t('Inspiration')}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-8"
    >
      {groups.map(({ kind, label, Icon }) => {
        const rows = saves.filter((s) => s.kind === kind);
        if (rows.length === 0) return null;
        return (
          <section key={kind}>
            <p className="mb-3 flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
              <Icon size={13} /> {label} · {rows.length}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((s) => (
                <div key={s.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7]">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#eef1e6]"><Icon size={22} className="text-[#314523] opacity-40" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a221533] to-transparent" />
                    <button
                      type="button"
                      onClick={() => onRemove(s.id)}
                      aria-label={t('Fjern fra gemte')}
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-canvas/90 text-[#59634f] backdrop-blur-sm transition-colors hover:text-[#b34e37] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                    <RatingBadge rating={s.rating} className="absolute left-2 top-2" />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="font-serif text-[1.02rem] leading-tight text-ink">{s.name}</p>
                    {s.location && <p className="mt-0.5 truncate text-[0.7rem] text-muted">{s.location}</p>}
                    {s.blurb && <p className="mt-2 line-clamp-2 text-[0.8rem] leading-snug text-ink-soft">{s.blurb}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </motion.div>
  );
}

/* ── Small panel helpers (mirror Venues.tsx) ─────────────────────────────── */
function PanelSpinner({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <Loader2 size={20} className="animate-spin text-muted" />
      <p className="text-[0.82rem] text-ink-soft">{label}</p>
    </div>
  );
}

function PanelError({ label, onRetry }: { label: string; onRetry: () => void }) {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-[0.85rem] text-ink-soft">{label}</p>
      <button type="button" onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#314523] px-4 py-2 text-[0.76rem] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer">
        {t('Prøv igen')}
      </button>
    </div>
  );
}
