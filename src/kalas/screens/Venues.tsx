"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart, Check, MessageCircle, ArrowLeft, MapPin, ArrowUpRight,
  Star, Loader2, Sparkles, Globe as GlobeIcon,
} from 'lucide-react';
import { IMAGES } from '../data';
import { useWedding, type Couple } from '../useWedding';
import { Eyebrow, Pill, cn } from '../ui';
import type { ScreenId } from '../Shell';
import OnboardingHint from '../OnboardingHint';
import { useLang } from '../i18n';
import type { VenueRow } from '@/lib/db/types';
import type { VenueResearchProfile } from '@/lib/venue/research';
import type { DestinationSuggestion } from '@/app/api/onboarding/destinations/route';
import type { OnboardingVenueSuggestion } from '@/app/api/onboarding/venues/route';

const DestinationGlobe = dynamic(() => import('../onboarding/DestinationGlobe'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 size={22} className="animate-spin text-muted" />
    </div>
  ),
});

/* Real venue row → the display shape the discovery views render. */
interface DisplayVenue {
  id: string;
  name: string;
  location: string;
  image: string;      // real URL, or an IMAGES key fallback
  rating: number | null;
  reviewCount: number;
  price: string;
  capacity: string;
  why: string[];
  quote: string;
  photos: string[];
  description: string | null;
  research: VenueResearchProfile | null;
}

function toDisplay(v: VenueRow): DisplayVenue {
  const reviewSnippets = (v.reviews ?? [])
    .map((r) => r.text ?? '')
    .filter(Boolean);
  return {
    id: v.id,
    name: v.name,
    location: v.address ?? '',
    image: v.image_url ?? v.photo_urls?.[0] ?? 'orangeri',
    rating: v.rating != null ? Number(v.rating) : null,
    reviewCount: v.review_count ?? 0,
    price: v.price_hint ?? '—',
    capacity: v.capacity ?? '—',
    why: v.why_fit ? [v.why_fit, ...reviewSnippets.slice(0, 2)] : reviewSnippets.slice(0, 3),
    quote: v.why_fit ?? '',
    photos: v.photo_urls ?? [],
    description: v.description,
    research: v.venue_research ?? null,
  };
}

/* Resolve an image that may be a real URL or a mock IMAGES key. */
const imgSrc = (src: string) =>
  src.startsWith('http') ? src : IMAGES[src as keyof typeof IMAGES] ?? IMAGES.orangeri;

function venueAreaLabel(region: string): string {
  return region.trim().replace(/\bnær\s+/gi, '').trim();
}

function RatingBadge({ rating, count, className }: { rating: number | null; count?: number; className?: string }) {
  if (rating == null) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-canvas/90 px-2.5 py-1 text-[0.68rem] font-semibold text-ink backdrop-blur-sm', className)}>
      <Star size={11} fill="currentColor" className="text-[#e6a34e]" />
      {rating.toFixed(1)}
      {count ? <span className="font-normal text-muted">({count})</span> : null}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — venue discovery & management
══════════════════════════════════════════════════════════════════════ */
export default function VenueDiscovery({ onNavigate }: { onNavigate?: (s: ScreenId) => void }) {
  type VView = 'hub' | 'discover' | 'picks';
  const { couple, event, venues: allVenues, outbound, refresh } = useWedding();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Real venues for this wedding (never vendors).
  const venues = allVenues.filter((v) => v.category === 'venue');
  const displayVenues = venues.map(toDisplay);

  const hasRealVenues = displayVenues.length > 0;
  const [vview, setVView] = useState<VView>(() => {
    if (typeof window === 'undefined') return 'hub';
    const fromAva = sessionStorage.getItem('kalas_venues_view');
    if (fromAva === 'picks') {
      sessionStorage.removeItem('kalas_venues_view');
      return 'picks';
    }
    return 'hub';
  });

  // Derived state from real rows.
  const saved = new Set(venues.filter((v) => v.swipe_status === 'liked').map((v) => v.id));
  const savedPlaceIds = new Set(venues.map((v) => v.place_id).filter(Boolean) as string[]);
  const sent = new Set(outbound.map((o) => o.venue_id));
  const booked = event?.chosen_venue_id ?? venues.find((v) => v.booked_at)?.id ?? null;

  const toggleSave = async (id: string) => {
    const v = venues.find((x) => x.id === id);
    const next = v?.swipe_status === 'liked' ? 'rejected' : 'liked';
    await fetch(`/api/venues/${id}/swipe`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: next }),
    });
    await refresh();
  };
  const reqOutreach = async (id: string) => {
    await fetch(`/api/venues/${id}/swipe`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'liked' }),
    });
    await refresh();
  };
  const bookVenue = async (id: string) => {
    await fetch(`/api/venues/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booked: true }),
    });
    await refresh();
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {vview === 'hub' && (
          <VenuesHubView
            key="hub"
            couple={couple}
            venues={displayVenues}
            savedIds={saved}
            onDiscover={() => setVView('discover')}
            onViewPicks={hasRealVenues ? () => setVView('picks') : undefined}
            onAva={() => onNavigate?.('ava')}
          />
        )}
        {vview === 'discover' && (
          <DiscoverView
            key="discover"
            couple={couple}
            savedPlaceIds={savedPlaceIds}
            onSaved={refresh}
            onBack={() => setVView('hub')}
            onViewPicks={() => setVView('picks')}
          />
        )}
        {vview === 'picks' && (
          <PicksView key="picks"
            venues={displayVenues} couple={couple}
            saved={saved} sent={sent} booked={booked}
            onToggleSave={toggleSave} onOutreach={reqOutreach}
            onBook={bookVenue}
            onDiscover={() => setVView('discover')}
            onAva={() => onNavigate?.('ava')}
            onBackToHub={() => setVView('hub')}
            onNextStep={() => onNavigate?.('vendors')}
            onRefresh={refresh} />
        )}
      </AnimatePresence>

      <OnboardingHint id="venues" />

      {/* ── Floating saved bar ──────────────────────────────────────── */}
      <AnimatePresence>
        {saved.size >= 1 && vview === 'picks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed inset-x-0 bottom-24 z-30 flex justify-center lg:bottom-8 pointer-events-none">
            <div className="flex items-center gap-4 rounded-full bg-ink px-6 py-3.5 shadow-[0_16px_48px_rgba(58,79,55,0.3)] pointer-events-auto">
              <Heart size={14} fill="currentColor" className="text-sage" />
              <span className="font-serif text-[0.95rem] text-canvas">
                {saved.size} {saved.size === 1 ? 'venue gemt' : 'venues gemt'}
              </span>
              {saved.size >= 2 && (
                <>
                  <span className="h-4 w-px bg-canvas/20" />
                  <button onClick={() => onNavigate?.('ava')}
                    className="text-[0.78rem] font-medium uppercase tracking-[0.1em] text-sage hover:text-canvas transition-colors cursor-pointer">
                    Sammenlign med Ava →
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   VENUES HUB — landing before discovery / picks
═══════════════════════════════════════════════════════════════════════ */
function VenuesHubView({
  couple,
  venues,
  savedIds,
  onDiscover,
  onViewPicks,
  onAva,
}: {
  couple: Couple;
  venues: DisplayVenue[];
  savedIds: Set<string>;
  onDiscover: () => void;
  onViewPicks?: () => void;
  onAva: () => void;
}) {
  const venueArea = venueAreaLabel(couple.region);
  const savedVenues = venues.filter((v) => savedIds.has(v.id));
  const shortlist = savedVenues.length > 0 ? savedVenues : venues;
  const featured = shortlist[0] ?? null;
  const subtitle = couple.guests > 0 && venueArea
    ? `Skræddersyet til ${couple.guests} gæster nær ${venueArea}.`
    : venueArea
      ? `Skræddersyet til bryllupper nær ${venueArea}.`
      : 'Fortæl Ava hvor I vil giftes — så starter søgningen.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-1 flex-col gap-[22px] px-6 py-7 sm:px-9 lg:px-[34px]"
    >
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-[5px]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e66b4e]">
          Venue discovery
        </p>
        <h1 className="font-serif text-[clamp(2rem,4vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-[#173c32]">
          Find et sted der føles som jer
        </h1>
        <p className="text-[13px] text-[#526a61]">{subtitle}</p>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-[18px] xl:flex-row">
        {/* Left — featured + actions */}
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#173c32]">
              {venues.length > 0 ? `${venues.length} venues på jeres liste` : 'Ingen venues endnu'}
            </span>
            {onViewPicks && (
              <button
                type="button"
                onClick={onViewPicks}
                className="text-[11px] font-semibold text-[#526a61] hover:text-[#173c32] transition-colors cursor-pointer"
              >
                Se alle →
              </button>
            )}
          </div>

          {/* Featured card — populated when the couple has venues */}
          <div className="flex min-h-[286px] flex-col overflow-hidden rounded-[18px] bg-[#173c32] sm:flex-row">
            <div className="relative flex min-h-[180px] w-full shrink-0 flex-col justify-end overflow-hidden sm:min-h-0 sm:w-[48%]">
              {featured ? (
                <>
                  <img src={imgSrc(featured.image)} alt={featured.name} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#173c32]/90 via-[#173c32]/30 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#3d6b58] via-[#2a5245] to-[#173c32]" />
              )}
              <div className="relative p-6">
                <div className="flex flex-wrap gap-2">
                  {venueArea && (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                      {venueArea}
                    </span>
                  )}
                  {couple.dateLabel && (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                      {couple.dateLabel}
                    </span>
                  )}
                  {couple.guests > 0 && (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                      {couple.guests} gæster
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between gap-6 p-6">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#e66b4e] px-[9px] py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                    {featured ? 'Ava pick' : 'Kom i gang'}
                  </span>
                  {featured?.rating != null && (
                    <RatingBadge rating={featured.rating} count={featured.reviewCount} />
                  )}
                </div>
                <h2 className="font-serif text-[1.75rem] leading-snug text-white">
                  {featured ? featured.name : 'Ava er klar til at finde jeres venue'}
                </h2>
                <p className="max-w-[380px] text-xs leading-[1.6] text-[#b8ccc3]">
                  {featured
                    ? featured.quote || featured.why[0] || featured.location
                    : 'Udforsk verdenskortet og lad Ava researche rigtige venues med billeder, priser og kapacitet — eller beskriv drømmen direkte i chatten.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {onViewPicks ? (
                  <button
                    type="button"
                    onClick={onViewPicks}
                    className="inline-flex items-center gap-2 rounded-full bg-[#fffdf7] px-5 py-2.5 text-[13px] font-bold text-[#173c32] transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <Heart size={15} />
                    Se jeres venues
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onDiscover}
                    className="inline-flex items-center gap-2 rounded-full bg-[#fffdf7] px-5 py-2.5 text-[13px] font-bold text-[#173c32] transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <GlobeIcon size={15} />
                    Udforsk venues
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAva}
                  className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
                  aria-label="Tal med Ava"
                >
                  <ArrowUpRight size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* Action cards */}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={onDiscover}
              className="overflow-hidden rounded-2xl border border-[#d4dbd5] bg-white text-left transition-shadow hover:shadow-sm cursor-pointer"
            >
              <div className="flex h-[120px] flex-col justify-end bg-gradient-to-br from-[#e8f2ed] to-[#d4e8de] p-4">
                <GlobeIcon size={20} className="text-[#173c32]" />
              </div>
              <div className="flex flex-col gap-[5px] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-[17px] text-[#173c32]">Udforsk verdenskortet</span>
                  <MapPin size={15} className="text-[#e66b4e]" />
                </div>
                <span className="text-[10px] text-[#526a61]">Vælg land og by — Ava finder rigtige venues</span>
              </div>
            </button>
            <button
              type="button"
              onClick={onAva}
              className="overflow-hidden rounded-2xl border border-[#d4dbd5] bg-white text-left transition-shadow hover:shadow-sm cursor-pointer"
            >
              <div className="flex h-[120px] flex-col justify-end bg-gradient-to-br from-[#f5e6df] to-[#e6c8bc] p-4">
                <MessageCircle size={20} className="text-[#173c32]" />
              </div>
              <div className="flex flex-col gap-[5px] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-[17px] text-[#173c32]">Tal med Ava</span>
                  <Heart size={15} className="text-[#e66b4e]" />
                </div>
                <span className="text-[10px] text-[#526a61]">Beskriv drømmevenue — Ava søger for jer</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right — shortlist panel */}
        <div className="flex w-full shrink-0 flex-col gap-4 rounded-[18px] bg-[#e6c8bc] p-[22px] xl:w-[330px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-[3px]">
              <h2 className="font-serif text-[22px] text-[#173c32]">Jeres shortlist</h2>
              <p className="text-[10px] text-[#526a61]">
                {savedVenues.length === 0
                  ? '0 venues gemt'
                  : `${savedVenues.length} ${savedVenues.length === 1 ? 'venue gemt' : 'venues gemt'}`}
              </p>
            </div>
            <Star size={19} className="text-[#173c32]" />
          </div>

          {shortlist.length > 0 ? (
            <div className="flex flex-col gap-2">
              {shortlist.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center gap-2.5 rounded-[11px] bg-[#fff9f4] p-2.5">
                  <img src={imgSrc(v.image)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-[#173c32]">{v.name}</p>
                    <p className="text-[9px] text-[#6b766f]">
                      {v.rating != null ? `★ ${v.rating.toFixed(1)}` : v.location || '—'}
                    </p>
                  </div>
                </div>
              ))}
              {onViewPicks && venues.length > 3 && (
                <button
                  type="button"
                  onClick={onViewPicks}
                  className="text-[10px] font-bold text-[#173c32] hover:underline cursor-pointer"
                >
                  Se alle {venues.length} venues →
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[11px] bg-[#fff9f4] px-4 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#173c32]">
                <Heart size={16} className="text-white" />
              </div>
              <p className="mt-3 text-[11px] font-bold text-[#173c32]">Ingen favoritter endnu</p>
              <p className="mt-1 text-[9px] leading-relaxed text-[#6b766f]">
                Gem venues undervejs — så sammenligner Ava dem for jer.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-[#173c32]/15 pt-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#173c32]">
                <MessageCircle size={14} className="text-white" />
              </div>
              <span className="text-[11px] font-bold text-[#173c32]">Ava bemærkede</span>
            </div>
            <p className="text-[11px] leading-[1.55] text-[#465b53]">
              {venueArea
                ? `Jeg prioriterer venues nær ${venueArea}${couple.guests > 0 ? ` med plads til ${couple.guests} gæster` : ''}.`
                : 'Fortæl mig hvor I vil giftes — så finder jeg venues der matcher jeres stil og budget.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onDiscover}
            className="flex items-center justify-center gap-2 rounded-[11px] bg-[#e66b4e] px-3.5 py-3 text-[11px] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
          >
            <GlobeIcon size={15} />
            Udforsk flere venues
          </button>
          <button
            type="button"
            onClick={onAva}
            className="flex items-center justify-center gap-2 rounded-[11px] border border-[#173c32]/15 bg-[#fff9f4] px-3.5 py-3 text-[11px] font-bold text-[#173c32] transition-colors hover:bg-white cursor-pointer"
          >
            <MessageCircle size={14} />
            Spørg Ava
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DISCOVER VIEW — globe → country → destination → real venues
═══════════════════════════════════════════════════════════════════════ */
function DiscoverView({
  couple, savedPlaceIds, onSaved, onBack, onViewPicks,
}: {
  couple: Couple;
  savedPlaceIds: Set<string>;
  onSaved: () => Promise<void>;
  onBack: () => void;
  onViewPicks: () => void;
}) {
  const { lang } = useLang();
  const venueArea = venueAreaLabel(couple.region);

  const [country, setCountry] = useState<string | null>(null);
  const [destCards, setDestCards] = useState<DestinationSuggestion[]>([]);
  const [destLoading, setDestLoading] = useState(false);
  const [destFailed, setDestFailed] = useState(false);
  const seenDest = useRef<Record<string, DestinationSuggestion[]>>({});

  const [destination, setDestination] = useState<string | null>(null);
  const [results, setResults] = useState<OnboardingVenueSuggestion[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsFailed, setResultsFailed] = useState(false);
  const seenVenues = useRef<Record<string, OnboardingVenueSuggestion[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());

  const loadDestinations = async (c: string) => {
    setDestFailed(false);
    const hit = seenDest.current[c];
    if (hit) { setDestCards(hit); return; }
    setDestLoading(true);
    setDestCards([]);
    try {
      const res = await fetch(`/api/onboarding/destinations?country=${encodeURIComponent(c)}&lang=${lang}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { suggestions?: DestinationSuggestion[] };
      const list = data.suggestions ?? [];
      if (list.length === 0) { setDestFailed(true); return; }
      seenDest.current[c] = list;
      setDestCards(list);
    } catch {
      setDestFailed(true);
    } finally {
      setDestLoading(false);
    }
  };

  const pickCountry = (c: string) => {
    setCountry(c);
    setDestination(null);
    void loadDestinations(c);
  };

  const searchVenues = async (dest: string) => {
    setDestination(dest);
    setResultsFailed(false);
    const hit = seenVenues.current[dest];
    if (hit) { setResults(hit); return; }
    setResultsLoading(true);
    setResults([]);
    try {
      const res = await fetch('/api/onboarding/venues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: dest,
          guest_count: couple.guests > 0 ? couple.guests : undefined,
          budget: couple.budgetTotal > 0 ? String(couple.budgetTotal) : undefined,
          lang,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { venues?: OnboardingVenueSuggestion[] };
      const list = data.venues ?? [];
      if (list.length === 0) { setResultsFailed(true); return; }
      seenVenues.current[dest] = list;
      setResults(list);
    } catch {
      setResultsFailed(true);
    } finally {
      setResultsLoading(false);
    }
  };

  const saveVenue = async (v: OnboardingVenueSuggestion) => {
    setSavingId(v.id);
    try {
      const res = await fetch('/api/venues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue: v }),
      });
      if (res.ok) {
        setJustSaved((prev) => new Set(prev).add(v.id));
        await onSaved();
      }
    } finally {
      setSavingId(null);
    }
  };

  const isSaved = (v: OnboardingVenueSuggestion) =>
    justSaved.has(v.id) || (v.place_id != null && savedPlaceIds.has(v.place_id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-1 flex-col gap-5 px-6 py-7 sm:px-9 lg:px-[34px]"
    >
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} /> Tilbage
        </button>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e66b4e]">Venue discovery</p>
        <h1 className="mt-1 font-serif text-[clamp(2rem,4vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-[#173c32]">
          Udforsk venues i hele verden
        </h1>
        <p className="mt-1 text-[13px] text-[#526a61]">
          Drej på kloden og tryk på et land — Ava finder byer og destinationer og researcher rigtige venues med billeder og priser.
        </p>
      </div>

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Globe */}
        <div className="relative h-[min(62vh,560px)] overflow-hidden rounded-3xl border border-[#d4dbd5] bg-[#f4f1ea]">
          <DestinationGlobe selectedCountry={country} onCountryPick={pickCountry} />
        </div>

        {/* Panel */}
        <div className="flex min-h-[320px] max-h-[min(62vh,560px)] flex-col overflow-hidden rounded-3xl border border-[#d4dbd5] bg-white">
          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e6e9e5] px-5 py-4">
            <div className="min-w-0">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted">
                {destination ? 'Venues' : 'Destination'}
              </p>
              <h3 className="truncate font-serif text-[1.2rem] leading-tight text-ink">
                {destination ?? country ?? 'Vælg et land'}
              </h3>
            </div>
            {destination && (
              <button
                type="button"
                onClick={() => setDestination(null)}
                className="shrink-0 text-[0.72rem] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
              >
                ← {country ?? 'Tilbage'}
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {/* Nothing picked yet */}
            {!country && !destination && (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#173c32]">
                  <GlobeIcon size={19} className="text-white" />
                </div>
                <p className="text-[0.88rem] leading-relaxed text-ink-soft">
                  Tryk på et land på kloden for at se byer og bryllupsdestinationer.
                </p>
                {venueArea && (
                  <button
                    type="button"
                    onClick={() => void searchVenues(venueArea)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#173c32] px-4 py-2.5 text-[0.78rem] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <MapPin size={13} />
                    Søg venues nær {venueArea}
                  </button>
                )}
              </div>
            )}

            {/* Destination list for a picked country */}
            {country && !destination && (
              destLoading ? (
                <PanelSpinner label={`Finder byer og destinationer i ${country}…`} />
              ) : destFailed ? (
                <PanelError label="Kunne ikke hente destinationer." onRetry={() => void loadDestinations(country)} />
              ) : (
                <div className="flex flex-col gap-2">
                  {destCards.map((s) => (
                    <button
                      key={`${s.kind}-${s.name}`}
                      type="button"
                      onClick={() => void searchVenues(`${s.name}, ${country}`)}
                      className="flex items-center gap-3 rounded-2xl border border-[#e6e9e5] p-2.5 text-left transition-colors hover:border-[#173c32]/40 hover:bg-[#fafaf8] cursor-pointer"
                    >
                      {s.photo ? (
                        <img src={s.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ed]">
                          <MapPin size={17} className="text-[#173c32]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[0.88rem] font-bold text-[#173c32]">{s.name}</p>
                          <span className="shrink-0 rounded-full bg-[#eaf0ec] px-2 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.1em] text-[#173c32]">
                            {s.kind === 'city' ? 'By' : 'Bryllup'}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[0.72rem] leading-snug text-[#526a61]">{s.blurb}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* Venue results for a destination */}
            {destination && (
              resultsLoading ? (
                <PanelSpinner label={`Ava researcher rigtige venues i ${destination}… Det tager typisk under et minut.`} />
              ) : resultsFailed ? (
                <PanelError label="Kunne ikke finde venues her." onRetry={() => void searchVenues(destination)} />
              ) : (
                <div className="flex flex-col gap-3">
                  {results.map((v) => {
                    const already = isSaved(v);
                    return (
                      <div key={v.id} className="overflow-hidden rounded-2xl border border-[#e6e9e5]">
                        {v.photo && (
                          <div className="relative h-32 w-full overflow-hidden">
                            <img src={v.photo} alt={v.name} className="absolute inset-0 h-full w-full object-cover" />
                            <RatingBadge rating={v.rating} count={v.review_count ?? 0} className="absolute left-2.5 top-2.5" />
                          </div>
                        )}
                        <div className="p-3.5">
                          <p className="text-[0.92rem] font-bold text-[#173c32]">{v.name}</p>
                          {v.address && <p className="mt-0.5 text-[0.7rem] text-[#526a61]">{v.address}</p>}
                          {v.why_fit && (
                            <p className="mt-1.5 text-[0.76rem] leading-snug text-ink-soft">{v.why_fit}</p>
                          )}
                          {(v.capacity || v.price_hint) && (
                            <p className="mt-1.5 text-[0.68rem] font-medium text-[#526a61]">
                              {[v.capacity, v.price_hint].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          <button
                            type="button"
                            disabled={already || savingId === v.id}
                            onClick={() => void saveVenue(v)}
                            className={cn(
                              'mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.72rem] font-bold transition-colors',
                              already
                                ? 'bg-[#e8f2ed] text-[#236b53] cursor-default'
                                : 'bg-[#173c32] text-white hover:opacity-90 cursor-pointer',
                            )}
                          >
                            {savingId === v.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : already ? (
                              <Check size={12} />
                            ) : (
                              <Heart size={12} />
                            )}
                            {already ? 'På jeres liste' : 'Gem til shortlist'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {justSaved.size > 0 && (
                    <button
                      type="button"
                      onClick={onViewPicks}
                      className="rounded-full bg-[#e66b4e] px-4 py-2.5 text-[0.78rem] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      Se jeres venues →
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PanelSpinner({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 px-4 text-center">
      <Loader2 size={20} className="animate-spin text-muted" />
      <p className="max-w-[260px] text-[0.8rem] leading-relaxed text-ink-soft">{label}</p>
    </div>
  );
}

function PanelError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-[0.85rem] text-ink-soft">{label}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border border-[#173c32]/20 px-4 py-2 text-[0.75rem] font-bold text-[#173c32] hover:bg-[#f4f1ea] transition-colors cursor-pointer"
      >
        Prøv igen
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PICKS VIEW — venue management
═══════════════════════════════════════════════════════════════════════ */
function PicksView({
  venues, couple, saved, sent, booked, onToggleSave, onOutreach, onBook, onDiscover, onAva, onBackToHub, onNextStep, onRefresh,
}: {
  venues: DisplayVenue[];
  couple: Couple;
  saved: Set<string>; sent: Set<string>; booked: string | null;
  onToggleSave: (id: string) => void; onOutreach: (id: string) => void;
  onBook: (id: string) => void; onDiscover: () => void; onAva: () => void;
  onBackToHub?: () => void;
  onNextStep?: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const venueCity = venueAreaLabel(couple.region);
  const savedVenues = venues.filter(v => saved.has(v.id));
  const selectedVenue = selectedId ? venues.find((v) => v.id === selectedId) ?? null : null;

  // Booked first, then saved, then the rest.
  const sortedVenues = [...venues].sort((a, b) => {
    const rank = (v: DisplayVenue) => (v.id === booked ? 0 : saved.has(v.id) ? 1 : 2);
    return rank(a) - rank(b);
  });

  if (comparing && savedVenues.length >= 2) {
    return (
      <ComparisonView
        venues={savedVenues}
        saved={saved}
        booked={booked}
        onBack={() => setComparing(false)}
        onToggleSave={onToggleSave}
        onBook={onBook}
      />
    );
  }

  if (selectedVenue) {
    return (
      <AnimatePresence mode="wait">
        <VenueDetail
          key={selectedVenue.id}
          venue={selectedVenue}
          allVenues={venues}
          saved={saved.has(selectedVenue.id)}
          sent={sent.has(selectedVenue.id)}
          isBooked={booked === selectedVenue.id}
          onBack={() => setSelectedId(null)}
          onSave={() => onToggleSave(selectedVenue.id)}
          onContact={() => { onOutreach(selectedVenue.id); setSelectedId(null); }}
          onBook={() => onBook(selectedVenue.id)}
          onSelectOther={(id) => setSelectedId(id)}
          onRefresh={onRefresh}
        />
      </AnimatePresence>
    );
  }

  // Nothing found yet — point to discovery.
  if (venues.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#173c32]">
          <MapPin size={22} className="text-white" />
        </div>
        <h2 className="display mt-5 text-[1.8rem] text-ink">Ingen venues på listen endnu</h2>
        <p className="mt-2 max-w-sm text-[0.9rem] text-ink-soft">
          Udforsk verdenskortet eller fortæl Ava mere om jeres drøm{venueCity ? ` nær ${venueCity}` : ''} — så researcher hun rigtige venues.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Pill arrow onClick={onDiscover}><GlobeIcon size={14} /> Udforsk venues</Pill>
          <Pill arrow onClick={onAva}><MessageCircle size={14} /> Tal med Ava</Pill>
        </div>
      </motion.div>
    );
  }

  const bookedVenue = booked ? venues.find((v) => v.id === booked) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="pb-24">

      {/* ── Booked celebration banner ────────────────────────────────── */}
      {bookedVenue && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-8 sm:mx-10 lg:mx-16 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink px-6 py-5 text-canvas">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas/15">
              <Check size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-[1.15rem] leading-snug">{bookedVenue.name} er booket</p>
              <p className="mt-0.5 text-[0.78rem] text-canvas/70">Det sværeste er klaret. Næste skridt: fotograf og catering.</p>
            </div>
          </div>
          {onNextStep && (
            <button onClick={onNextStep}
              className="shrink-0 rounded-full bg-canvas px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink hover:opacity-90 transition-opacity cursor-pointer">
              Find fotograf →
            </button>
          )}
        </motion.div>
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="px-6 pt-8 sm:px-10 lg:px-16">
        {onBackToHub && (
          <button
            type="button"
            onClick={onBackToHub}
            className="mb-6 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} /> Tilbage til venue discovery
          </button>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Jeres venues</Eyebrow>
            <h2 className="display mt-3 text-[clamp(2.2rem,5vw,3.4rem)] text-ink">
              Venues der <span className="italic">passer til jer.</span>
            </h2>
            <p className="mt-3 max-w-md text-ink-soft">
              {venues.length} {venues.length === 1 ? 'venue' : 'venues'} på listen
              {savedVenues.length > 0 ? ` · ${savedVenues.length} gemt` : ''}
              {venueCity ? ` · nær ${venueCity}` : ''}
            </p>
          </div>
          {savedVenues.length >= 2 && (
            <button onClick={() => setComparing(true)}
              className="rounded-full bg-ink px-5 py-2.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-canvas hover:opacity-85 transition-opacity cursor-pointer">
              Sammenlign gemte ({savedVenues.length})
            </button>
          )}
        </div>
      </div>

      {/* ── Venue grid ───────────────────────────────────────────────── */}
      <div className="px-6 pt-8 sm:px-10 lg:px-16">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sortedVenues.map((venue, i) => (
            <VenueGridCard key={venue.id} venue={venue} index={i}
              saved={saved.has(venue.id)} sent={sent.has(venue.id)} isBooked={booked === venue.id}
              onToggleSave={() => onToggleSave(venue.id)}
              onSelect={() => setSelectedId(venue.id)} />
          ))}

          {/* Discover-more card */}
          <button
            type="button"
            onClick={onDiscover}
            className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[var(--color-line-strong)] p-6 text-center transition-colors hover:border-ink/40 hover:bg-card cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#173c32]">
              <GlobeIcon size={18} className="text-white" />
            </div>
            <div>
              <p className="font-serif text-[1.15rem] text-ink">Udforsk flere venues</p>
              <p className="mt-1 text-[0.8rem] text-muted">
                Vælg land og by på kloden — Ava researcher rigtige venues.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Ask Ava ──────────────────────────────────────────────────── */}
      <div className="px-6 pt-12 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rule rounded-2xl bg-card p-8 text-center">
          <Eyebrow className="text-center">Spørg Ava</Eyebrow>
          <p className="mt-3 text-[0.95rem] text-ink-soft max-w-md mx-auto">
            Ava kender jeres profil og kan sammenligne venues, tjekke datoer og skrive henvendelser for jer.
          </p>
          <div className="mt-6 flex justify-center">
            <Pill arrow onClick={onAva}><MessageCircle size={14} /> Tal med Ava</Pill>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Venue management grid card ───────────────────────────────────────── */
function VenueGridCard({
  venue, index, saved, sent, isBooked, onToggleSave, onSelect,
}: {
  venue: DisplayVenue; index: number; saved: boolean; sent: boolean; isBooked: boolean;
  onToggleSave: () => void; onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col overflow-hidden rounded-2xl rule bg-card">

      <button type="button" onClick={onSelect} className="relative block aspect-[4/3] overflow-hidden cursor-pointer text-left">
        <img src={imgSrc(venue.image)} alt={venue.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a221570] to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <RatingBadge rating={venue.rating} count={venue.reviewCount} />
          {isBooked && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-canvas">
              Booket
            </span>
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-[1.15rem] leading-tight text-ink">{venue.name}</h3>
            {venue.location && <p className="mt-0.5 truncate text-[0.72rem] text-muted">{venue.location}</p>}
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={onToggleSave} aria-label={saved ? 'Fjern fra gemte' : 'Gem venue'}
            className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full rule transition-all cursor-pointer',
              saved ? 'bg-sage text-ink' : 'text-muted hover:text-ink hover:bg-shell')}>
            <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
          </motion.button>
        </div>

        {venue.quote && (
          <p className="mt-2 line-clamp-2 text-[0.78rem] leading-snug text-ink-soft">{venue.quote}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="flex gap-5">
            <div>
              <p className="eyebrow">Pris</p>
              <p className="mt-0.5 font-serif text-[0.95rem] leading-none text-ink">{venue.price}</p>
            </div>
            <div>
              <p className="eyebrow">Kapacitet</p>
              <p className="mt-0.5 font-serif text-[0.95rem] leading-none text-ink">{venue.capacity}</p>
            </div>
          </div>
          <button onClick={onSelect}
            className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[0.7rem] font-medium text-canvas hover:opacity-85 transition-opacity cursor-pointer">
            Se venue →
          </button>
        </div>

        {sent && !isBooked && (
          <p className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] text-muted">
            <Check size={10} className="text-sage" /> Ava har kontaktet venuet
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   VENUE COMPARISON VIEW
═══════════════════════════════════════════════════════════════════════ */
function ComparisonView({
  venues, saved, booked, onBack, onToggleSave, onBook,
}: {
  venues: DisplayVenue[]; saved: Set<string>; booked: string | null;
  onBack: () => void; onToggleSave: (id: string) => void; onBook: (id: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <div className="px-6 pt-8 sm:px-10 lg:px-16">
        <button onClick={onBack}
          className="flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors cursor-pointer mb-8">
          <ArrowLeft size={13} /> Tilbage
        </button>
        <Eyebrow>Sammenligning · {venues.length} venues</Eyebrow>
        <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-ink">
          Side om <span className="italic">side</span>
        </h2>
      </div>

      <div className="mt-8 px-6 pb-16 sm:px-10 lg:px-16">
        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${Math.min(venues.length, 3)}, 1fr)` }}>
          {venues.map((v) => {
            const isBooked = booked === v.id;
            const isSaved = saved.has(v.id);
            return (
              <motion.div key={v.id}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="rule rounded-2xl bg-card overflow-hidden flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={imgSrc(v.image)} alt={v.name}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a221580] to-transparent" />
                  <div className="absolute left-3 top-3">
                    <RatingBadge rating={v.rating} count={v.reviewCount} />
                  </div>
                  {isBooked && (
                    <div className="absolute right-3 top-3 rounded-full bg-ink px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-canvas">
                      Booket
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-[1.2rem] text-ink leading-tight">{v.name}</h3>
                  <p className="mt-0.5 text-[0.75rem] text-muted">{v.location}</p>

                  <div className="mt-4 space-y-2 rule-t pt-4">
                    {[
                      { k: 'Pris', val: v.price },
                      { k: 'Kapacitet', val: v.capacity },
                    ].map(({ k, val }) => (
                      <div key={k} className="flex justify-between text-[0.8rem]">
                        <span className="text-muted">{k}</span>
                        <span className="text-ink font-medium">{val}</span>
                      </div>
                    ))}
                  </div>

                  <ul className="mt-4 space-y-2 rule-t pt-4 flex-1">
                    {v.why.slice(0, 3).map((r) => (
                      <li key={r} className="flex items-start gap-2 text-[0.78rem] text-ink-soft leading-snug">
                        <Check size={11} className="mt-0.5 shrink-0 text-sage" />
                        {r}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex gap-2 rule-t pt-4">
                    <button onClick={() => onToggleSave(v.id)}
                      className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full rule transition-all cursor-pointer',
                        isSaved ? 'bg-ink text-canvas' : 'hover:bg-shell')}>
                      <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => onBook(v.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                      {isBooked ? <><Check size={12} /> Booket</> : 'Book venue'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   VENUE DETAIL PAGE — real data only; Ava research fills the gaps
═══════════════════════════════════════════════════════════════════════ */
function VenueDetail({
  venue, allVenues, saved, sent, isBooked, onBack, onSave, onContact, onBook, onSelectOther, onRefresh,
}: {
  venue: DisplayVenue; allVenues: DisplayVenue[]; saved: boolean; sent: boolean; isBooked: boolean;
  onBack: () => void; onSave: () => void; onContact: () => void; onBook: () => void;
  onSelectOther: (id: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [notes, setNotes]         = useState('');
  const [activePackage, setPkg]   = useState<number | null>(null);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const realPhotos = venue.photos ?? [];
  const research = venue.research;
  const description = venue.description ?? venue.quote;
  const highlights = research?.highlights.length ? research.highlights : venue.why;
  const practical  = research?.practical ?? [];
  const packages   = research?.packages ?? [];
  const directions = research?.directions ?? null;

  async function runResearch() {
    setResearching(true);
    setResearchError(null);
    try {
      const res = await fetch(`/api/venues/${venue.id}/research`, { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Research failed');
      }
      await onRefresh();
    } catch (err) {
      setResearchError(err instanceof Error ? err.message : 'Kunne ikke researche venue');
    } finally {
      setResearching(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen pb-24">

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-canvas/90 px-6 py-4 backdrop-blur-md rule-b sm:px-10 lg:px-16">
        <button onClick={onBack}
          className="flex cursor-pointer items-center gap-2 text-[0.85rem] text-muted hover:text-ink transition-colors">
          <ArrowLeft size={16} /> Tilbage
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void runResearch()}
            disabled={researching}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[0.8rem] font-medium rule transition-all',
              researching ? 'bg-card text-muted' : 'bg-canvas text-ink hover:bg-card',
            )}>
            {researching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {researching ? 'Ava researcher…' : research ? 'Opdater research' : 'Research venue'}
          </button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onSave}
            className={cn('flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[0.8rem] font-medium rule transition-all',
              saved ? 'bg-sage-tint text-ink' : 'bg-canvas text-ink hover:bg-card')}>
            <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Gemt' : 'Gem'}
          </motion.button>
        </div>
      </div>

      {/* ── Photos — only what the venue actually has ─────────────── */}
      {realPhotos.length > 1 ? (
        <div className="grid gap-1 sm:grid-cols-[2fr_1fr_1fr] sm:grid-rows-2 h-[300px] sm:h-[460px]">
          <div className="relative overflow-hidden sm:row-span-2">
            <img src={imgSrc(venue.image)} alt={venue.name}
              className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-canvas/90 px-3 py-1.5 backdrop-blur-sm">
              <span className="text-[0.68rem] font-medium text-ink">{realPhotos.length} billeder</span>
            </div>
          </div>
          {realPhotos.slice(1, 5).map((url, i) => (
            <div key={i} className="relative hidden overflow-hidden sm:block">
              <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative h-[300px] overflow-hidden sm:h-[420px]">
          <img src={imgSrc(venue.image)} alt={venue.name}
            className="absolute inset-0 h-full w-full object-cover object-center" />
        </div>
      )}

      {/* ── Main info ─────────────────────────────────────────────── */}
      <div className="px-6 pt-8 sm:px-10 lg:px-16">

        {/* Badges + name */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-sage px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink">
            Ava pick
          </span>
          {venue.rating != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-shell px-3 py-1 text-[0.72rem] font-medium text-ink">
              <Star size={12} fill="currentColor" className="text-[#e6a34e]" />
              {venue.rating.toFixed(1)}
              {venue.reviewCount > 0 && <span className="text-muted">· {venue.reviewCount} anmeldelser</span>}
            </span>
          )}
        </div>
        <h1 className="display mt-3 text-[clamp(2.4rem,5vw,4rem)] text-ink">{venue.name}</h1>
        <p className="mt-1 text-[0.88rem] text-muted">{venue.location}</p>
        {directions && (
          <p className="mt-1 text-[0.8rem] text-muted/70">{directions}</p>
        )}

        {researchError && (
          <p className="mt-4 rounded-xl bg-shell px-4 py-3 text-[0.85rem] text-ink-soft">{researchError}</p>
        )}

        {research?.briefing?.length ? (
          <div className="mt-6 rounded-2xl bg-[#173c32] p-6 text-canvas">
            <Eyebrow className="!text-canvas/55">Avas briefing</Eyebrow>
            <ul className="mt-4 space-y-2.5">
              {research.briefing.map((line) => (
                <li key={line} className="flex items-start gap-3 text-[0.92rem] leading-snug">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : !research && !researching ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-line)] bg-card/50 px-5 py-4">
            <p className="text-[0.88rem] leading-relaxed text-ink-soft">
              Tryk <span className="font-medium text-ink">Research venue</span> — så søger Ava på nettet og udfylder kapacitet, priser og praktisk info fra venueets egne sider.
            </p>
          </div>
        ) : null}

        {/* Description */}
        {description && (
          <p className="mt-7 max-w-2xl text-[1.02rem] leading-relaxed text-ink-soft">{description}</p>
        )}

        {/* Stats strip */}
        <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl rule bg-[var(--color-line)]">
          <div className="bg-card px-5 py-5">
            <Eyebrow>Kapacitet</Eyebrow>
            <p className="mt-1.5 font-serif text-[1.4rem] leading-none text-ink">{venue.capacity}</p>
          </div>
          <div className="bg-card px-5 py-5">
            <Eyebrow>Pris fra</Eyebrow>
            <p className="mt-1.5 font-serif text-[1.4rem] leading-none text-ink">{venue.price}</p>
          </div>
          <div className="bg-ink px-5 py-5">
            <Eyebrow className="!text-canvas/50">Bedømmelse</Eyebrow>
            <p className="mt-1.5 font-serif text-[1.4rem] leading-none text-canvas">
              {venue.rating != null ? `★ ${venue.rating.toFixed(1)}` : '—'}
            </p>
          </div>
        </div>

        {/* Praktisk info — only when Ava's research found it */}
        {practical.length > 0 && (
          <div className="mt-10 rule-t pt-8">
            <Eyebrow>Praktisk info</Eyebrow>
            <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
              {practical.map(({ key, value }) => (
                <div key={key}>
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">{key}</dt>
                  <dd className="mt-1 text-[0.95rem] text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="mt-10 rule-t pt-8">
            <Eyebrow>Faciliteter & fordele</Eyebrow>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-3">
                  <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-sage" />
                  <span className="text-[0.92rem] text-ink-soft leading-snug">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Priser & pakker — only when Ava's research found them */}
        {packages.length > 0 && (
          <div className="mt-10 rule-t pt-8">
            <Eyebrow>Priser & pakker</Eyebrow>
            <p className="mt-1 text-[0.8rem] text-muted">Fra venueets egne sider — bekræft altid pris og dato direkte.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {packages.map((pkg, i) => {
                const active = activePackage === i;
                return (
                  <button key={pkg.name} onClick={() => setPkg(active ? null : i)}
                    className={cn(
                      'group flex flex-col rounded-2xl p-5 text-left cursor-pointer transition-all',
                      pkg.featured
                        ? 'bg-ink text-canvas'
                        : active ? 'bg-card ring-2 ring-ink' : 'bg-card rule hover:shadow-sm',
                    )}>
                    {pkg.featured && (
                      <span className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-sage">Mest valgt</span>
                    )}
                    <span className={cn('font-serif text-[1.15rem]', pkg.featured ? 'text-canvas' : 'text-ink')}>
                      {pkg.name}
                    </span>
                    <span className={cn('mt-1 text-[0.76rem] leading-relaxed', pkg.featured ? 'text-canvas/60' : 'text-muted')}>
                      {pkg.desc}
                    </span>
                    <span className={cn('mt-4 font-serif text-[1.5rem] leading-none', pkg.featured ? 'text-canvas' : 'text-ink')}>
                      {pkg.price}
                    </span>
                    {active && !pkg.featured && (
                      <span className="mt-3 flex items-center gap-1 text-[0.72rem] text-sage">
                        <Check size={12} /> Valgt
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ava's analysis — only when there is a real why-fit */}
        {(venue.quote || venue.why.length > 0) && (
          <div className="mt-10 rule-t pt-8">
            <Eyebrow>Derfor matcher det jer</Eyebrow>
            <div className="mt-5 rounded-2xl bg-card rule p-6">
              {venue.quote && (
                <blockquote className="font-serif text-[1.2rem] italic leading-relaxed text-ink">
                  &ldquo;{venue.quote}&rdquo;
                </blockquote>
              )}
              {venue.why.length > 0 && (
                <ul className={cn('space-y-3', venue.quote && 'mt-5 rule-t pt-5')}>
                  {venue.why.map((reason) => (
                    <li key={reason} className="flex items-start gap-3">
                      <Check size={13} className="mt-1 shrink-0 text-sage" />
                      <span className="text-[0.9rem] text-ink-soft leading-relaxed">{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Other venues on the list */}
        {allVenues.length > 1 && (
          <div className="mt-10 rule-t pt-8">
            <Eyebrow>Flere fra jeres liste</Eyebrow>
            <div className="mt-5 flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {allVenues.filter((v) => v.id !== venue.id).slice(0, 4).map((v) => (
                <button key={v.id} type="button" onClick={() => onSelectOther(v.id)}
                  className="relative shrink-0 overflow-hidden rounded-xl cursor-pointer text-left"
                  style={{ width: 'min(180px, 45vw)', aspectRatio: '3/4' }}>
                  <img src={imgSrc(v.image)} alt={v.name}
                    className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a2215e8] via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="font-serif text-[0.95rem] leading-tight text-canvas">{v.name}</p>
                    {v.rating != null && (
                      <p className="mt-0.5 text-[0.65rem] text-canvas/55">★ {v.rating.toFixed(1)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mt-10 rule-t pt-8">
          <Eyebrow>Jeres noter</Eyebrow>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Skriv noter om dette venue — spørgsmål, mavefornemmelser, hvad I vil spørge om til visning…"
            rows={4}
            className="mt-3 w-full resize-none rounded-2xl rule bg-card px-5 py-4 text-[0.9rem] text-ink placeholder:text-muted focus:outline-none leading-relaxed"
          />
        </div>

        {/* CTAs */}
        <div className="mt-8 rule-t pt-8">
          <p className="text-[0.8rem] text-muted mb-4">
            Ava forbereder en personlig henvendelse og sender den på jeres vegne.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <AnimatePresence mode="wait">
              {isBooked ? (
                <motion.div key="booked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 rounded-full bg-sage px-6 py-3 text-[0.85rem] font-medium text-ink">
                  <Check size={14} /> Booket
                </motion.div>
              ) : sent ? (
                <motion.button key="book" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onBook}
                  className="cursor-pointer rounded-full bg-ink px-6 py-3 text-[0.85rem] font-medium text-canvas hover:opacity-80 transition-opacity">
                  Bekræft booking →
                </motion.button>
              ) : (
                <motion.button key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onContact}
                  className="cursor-pointer rounded-full bg-ink px-6 py-3 text-[0.85rem] font-medium text-canvas hover:opacity-80 transition-opacity">
                  Book visning via Ava →
                </motion.button>
              )}
            </AnimatePresence>
            <button onClick={onSave}
              className={cn('cursor-pointer flex items-center gap-2 rounded-full px-5 py-3 text-[0.85rem] font-medium rule transition-colors',
                saved ? 'bg-sage-tint text-ink' : 'bg-canvas text-ink hover:bg-card')}>
              <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Gemt' : 'Gem venue'}
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
