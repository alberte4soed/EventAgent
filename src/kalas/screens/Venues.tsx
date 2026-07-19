"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart, Check, MessageCircle, ArrowLeft, MapPin, ArrowUpRight,
  Star, Loader2, Sparkles, Globe as GlobeIcon, Plus, X, Send, Mail, Clock, ArrowRight,
  Expand, Search, PenLine,
} from 'lucide-react';
import { Lightbox } from '../onboarding/Lightbox';
import { IMAGES } from '../data';
import { useWedding, type Couple } from '../useWedding';
import { Eyebrow, Pill, cn } from '../ui';
import type { NavigateTarget } from '../lib/hub-nav';
import { useLang } from '../i18n';
import type { VenueRow, EmailDraftRow } from '@/lib/db/types';
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

/* Outreach progress a couple can see on their list. */
type VenueStage = 'idle' | 'contacted' | 'replied' | 'quoted';
const STAGE_META: Record<VenueStage, { label: string; cls: string; Icon: typeof Mail }> = {
  idle:      { label: 'Ikke kontaktet', cls: 'bg-shell text-muted',                 Icon: Clock },
  contacted: { label: 'Kontaktet',      cls: 'bg-[#e9edf2] text-[#3f5b6b]',          Icon: Send },
  replied:   { label: 'Svar modtaget',  cls: 'bg-[#e5ead8] text-[#59634f]',          Icon: Mail },
  quoted:    { label: 'Tilbud',         cls: 'bg-[#f3d8cf] text-[#7b4032]',          Icon: Mail },
};

function StageChip({ stage, className }: { stage: VenueStage; className?: string }) {
  const { label, cls, Icon } = STAGE_META[stage];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em]', cls, className)}>
      <Icon size={11} /> {label}
    </span>
  );
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
import type { HubCat, HubTab } from './team/shared';

export type VenueHubView = 'discover' | 'list' | 'review';

export type VenueHubConfig = {
  view: VenueHubView;
  onViewChange: (view: VenueHubView) => void;
  onSwitchTab?: (tab: HubTab, cat?: HubCat) => void;
  searchQuery?: string;
  category?: HubCat;
  showHint?: boolean;
};

export default function VenueDiscovery({
  onNavigate,
  hub,
}: {
  onNavigate?: (s: NavigateTarget) => void;
  hub?: VenueHubConfig;
}) {
  type VView = 'home' | 'discover' | 'list' | 'review';
  const { couple, event, venues: allVenues, outbound, replies, refresh } = useWedding();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Real venues for this wedding (never vendors).
  const venues = allVenues.filter((v) => v.category === 'venue');
  const displayVenues = venues.map(toDisplay);

  const hasRealVenues = displayVenues.length > 0;
  // Landing is derived: once the couple has venues (or Ava routed here) we open
  // the list, otherwise discovery — until they navigate, which pins `navView`.
  const [navView, setVView] = useState<VView | null>(() => {
    if (hub) return hub.view;
    if (typeof window === 'undefined') return null;
    const fromAva = sessionStorage.getItem('kalas_venues_view');
    if (fromAva === 'picks' || fromAva === 'list') {
      sessionStorage.removeItem('kalas_venues_view');
      return 'list';
    }
    return null;
  });
  // Hub mode: controlled view from parent. Standalone: home until user navigates.
  const vview: VView = hub ? hub.view : (navView ?? 'home');

  const setView = (next: VView) => {
    if (hub) {
      if (next === 'discover' || next === 'list' || next === 'review') hub.onViewChange(next);
      return;
    }
    setVView(next);
  };

  const goInbox = () => {
    onNavigate?.('inbox');
  };

  const goVendorsExplore = () => {
    if (hub?.onSwitchTab) hub.onSwitchTab('explore', 'fotografi');
    else onNavigate?.('vendors');
  };

  // Derived state from real rows.
  const saved = new Set(venues.filter((v) => v.swipe_status === 'liked').map((v) => v.id));
  const savedPlaceIds = new Set(venues.map((v) => v.place_id).filter(Boolean) as string[]);
  const sent = new Set(outbound.map((o) => o.venue_id));
  const booked = event?.chosen_venue_id ?? venues.find((v) => v.booked_at)?.id ?? null;

  // Per-venue outreach stage, derived from real outbound + replies.
  const repliedIds = new Set(replies.map((r) => r.venue_id).filter(Boolean) as string[]);
  const quotedIds = new Set(
    replies.filter((r) => r.quote_status === 'quoted').map((r) => r.venue_id).filter(Boolean) as string[],
  );
  const stageOf = (id: string): VenueStage =>
    quotedIds.has(id) ? 'quoted' : repliedIds.has(id) ? 'replied' : sent.has(id) ? 'contacted' : 'idle';

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
  // Confirmation toast shown the moment a venue becomes "jeres venue".
  const [chosenToast, setChosenToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bookVenue = async (id: string) => {
    const alreadyChosen = booked === id;
    await fetch(`/api/venues/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booked: true }),
    });
    await refresh();
    if (!alreadyChosen) {
      const name = displayVenues.find((v) => v.id === id)?.name ?? null;
      setChosenToast(name);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setChosenToast(null), 3800);
    }
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Open the list, optionally straight into a venue's detail.
  const [pendingSelect, setPendingSelect] = useState<string | null>(null);
  const goList = (id: string | null = null) => { setPendingSelect(id); setView('list'); };

  // "Find flere som disse" seeds discovery with the names already on the list.
  const [similarSeed, setSimilarSeed] = useState(false);
  const likedNames = displayVenues.filter((v) => saved.has(v.id)).map((v) => v.name);
  const goDiscover = (similar = false) => { setSimilarSeed(similar); setView('discover'); };

  const likedNotContacted = displayVenues.filter((v) => saved.has(v.id) && !sent.has(v.id));
  const likedVenues = displayVenues.filter((v) => saved.has(v.id));
  const journeyCounts = {
    listed: likedVenues.length,
    contacted: likedVenues.filter((v) => sent.has(v.id)).length,
    replied: likedVenues.filter((v) => repliedIds.has(v.id)).length,
    quoted: likedVenues.filter((v) => quotedIds.has(v.id)).length,
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {vview === 'home' && (
          <VenuesHome
            key="home"
            couple={couple}
            chosen={booked ? displayVenues.find((v) => v.id === booked) ?? null : null}
            counts={journeyCounts}
            list={likedVenues}
            stageOf={stageOf}
            onDiscover={() => goDiscover(false)}
            onList={() => goList()}
            onReview={() => setView('review')}
            onOpenVenue={(id) => goList(id)}
            onOpenDetail={booked ? () => goList(booked) : undefined}
            onInbox={goInbox}
          />
        )}
        {vview === 'discover' && (
          <DiscoverView
            key="discover"
            couple={couple}
            savedPlaceIds={savedPlaceIds}
            listCount={saved.size}
            similarNames={similarSeed ? likedNames : null}
            onSaved={refresh}
            onBack={hub ? undefined : () => setView('home')}
            onViewList={hasRealVenues ? () => goList() : undefined}
            embedded={Boolean(hub)}
          />
        )}
        {vview === 'list' && (
          <PicksView key="list"
            venues={displayVenues} couple={couple}
            saved={saved} sent={sent} booked={booked}
            stageOf={stageOf}
            initialSelectedId={pendingSelect}
            onToggleSave={toggleSave} onOutreach={reqOutreach}
            onBook={bookVenue}
            onBack={hub ? undefined : () => setView('home')}
            onDiscover={() => goDiscover(false)}
            onFindMore={likedNames.length > 0 ? () => goDiscover(true) : undefined}
            onReview={() => setView('review')}
            onAva={() => onNavigate?.('ava')}
            onNextStep={goVendorsExplore}
            onRefresh={refresh}
            embedded={Boolean(hub)} />
        )}
        {vview === 'review' && (
          <OutreachReview key="review"
            recipients={likedNotContacted}
            onBack={() => setView('list')}
            onApproved={() => { void refresh(); goInbox(); }}
            onAva={() => onNavigate?.('ava')}
          />
        )}
      </AnimatePresence>


      {/* ── "Venue valgt" confirmation toast ───────────────────────────── */}
      <AnimatePresence>
        {chosenToast !== null && (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            role="status" aria-live="polite"
            className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-8 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-3.5 rounded-full bg-[#314523] py-3 pl-4 pr-5 shadow-[0_16px_48px_rgba(23,60,50,0.32)]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8a9079]">
                <Check size={16} className="text-white" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-serif text-[0.98rem] leading-snug text-[#f7f5ef]">
                  {chosenToast ? `${chosenToast} er nu jeres venue` : 'Venue valgt'}
                </p>
                <p className="text-[0.72rem] text-[#a6b0aa]">Alt om stedet samles nu på jeres oversigt.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Chosen-venue overview — read-only "jeres venue" status header ────── */
function ChosenOverview({ chosen, couple, onOpenDetail, onDiscover }: {
  chosen: DisplayVenue | null; couple: Couple;
  onOpenDetail?: () => void; onDiscover: () => void;
}) {
  return (
    <div className="flex min-h-[210px] flex-col overflow-hidden rounded-[18px] bg-[#314523] sm:flex-row">
      <div className="relative flex min-h-[150px] w-full shrink-0 flex-col justify-end overflow-hidden sm:min-h-0 sm:w-[42%]">
        {chosen ? (
          <>
            <img src={imgSrc(chosen.image)} alt={chosen.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#314523]/90 via-[#314523]/25 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#4d5638] via-[#3B432A] to-[#314523]" />
        )}
        <div className="relative p-5">
          {chosen ? (
            <div className="flex flex-wrap gap-2">
              {chosen.location && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">{chosen.location}</span>
              )}
              {couple.dateLabel && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">{couple.dateLabel}</span>
              )}
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><MapPin size={19} className="text-white/70" /></div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4 p-6">
        <div className="flex flex-col gap-2">
          {chosen ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f7f5ef] px-[10px] py-1 text-[9px] font-bold uppercase tracking-wide text-[#314523]"><Check size={11} /> Valgt venue</span>
          ) : (
            <span className="inline-flex w-fit rounded-full bg-white/15 px-[10px] py-1 text-[9px] font-bold uppercase tracking-wide text-white/80">Ingen venue valgt endnu</span>
          )}
          <h2 className="font-serif text-[1.6rem] leading-snug text-white">{chosen ? chosen.name : 'I har ikke valgt et sted endnu'}</h2>
          <p className="max-w-[420px] text-xs leading-[1.6] text-[#a6b0aa]">
            {chosen
              ? (chosen.quote || chosen.why[0] || chosen.location || 'Jeres valgte sted.')
              : 'Byg jeres liste nedenfor, lad Ava kontakte dem, og vælg til sidst det sted der føles rigtigt.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {chosen && onOpenDetail && (
            <button type="button" onClick={onOpenDetail} className="inline-flex items-center gap-2 rounded-full bg-[#f7f5ef] px-5 py-2.5 text-[13px] font-bold text-[#314523] transition-opacity hover:opacity-90 cursor-pointer">Se detaljer</button>
          )}
          <button type="button" onClick={onDiscover} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white/20 cursor-pointer"><GlobeIcon size={15} /> Udforsk venues</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   VENUES HOME — project-management overview + the 1-2-3 steps as a tree
═══════════════════════════════════════════════════════════════════════ */
type HomeCounts = { listed: number; contacted: number; replied: number; quoted: number };

function VenuesHome({
  couple, chosen, counts, list, stageOf, onDiscover, onList, onReview, onOpenVenue, onOpenDetail, onInbox,
}: {
  couple: Couple; chosen: DisplayVenue | null; counts: HomeCounts;
  list: DisplayVenue[]; stageOf: (id: string) => VenueStage;
  onDiscover: () => void; onList: () => void; onReview: () => void;
  onOpenVenue: (id: string) => void; onOpenDetail?: () => void; onInbox: () => void;
}) {
  const metrics = [
    { label: 'På listen', value: String(counts.listed) },
    { label: 'Kontaktet', value: String(counts.contacted) },
    { label: 'Tilbud', value: String(counts.quoted) },
    { label: 'Valgt', value: chosen ? '1' : '0', accent: !chosen },
  ];

  type StepState = 'done' | 'active' | 'todo';
  const steps: {
    n: number; title: string; desc: string; stat: string; cta: string;
    Icon: typeof GlobeIcon; onClick: () => void; disabled?: boolean; state: StepState;
  }[] = [
    {
      n: 1, title: 'Opdag',
      desc: 'Find rigtige venues på kloden og tilføj dem I kan lide til listen.',
      stat: counts.listed > 0 ? `${counts.listed} tilføjet` : 'Ikke startet',
      cta: counts.listed > 0 ? 'Opdag flere' : 'Start søgning',
      Icon: GlobeIcon, onClick: onDiscover, state: counts.listed > 0 ? 'done' : 'active',
    },
    {
      n: 2, title: 'Byg jeres liste',
      desc: 'Sammenlign, research og forfin listen — fjern dem der ikke passer.',
      stat: counts.listed > 0 ? `${counts.listed} på listen` : 'Tom endnu',
      cta: 'Rediger liste', Icon: Heart, onClick: onList,
      disabled: counts.listed === 0, state: counts.listed > 0 ? 'active' : 'todo',
    },
    {
      n: 3, title: 'Lad Ava kontakte',
      desc: 'Godkend Avas henvendelse og følg samtalerne under Henvendelser.',
      stat: counts.contacted > 0 ? `${counts.contacted} kontaktet · ${counts.replied} svar` : 'Klar til at sende',
      cta: counts.contacted > 0 ? 'Følg svarene' : 'Gennemgå & send',
      Icon: Send, onClick: counts.contacted > 0 ? onInbox : onReview,
      disabled: counts.listed === 0,
      state: counts.contacted > 0 ? 'done' : counts.listed > 0 ? 'active' : 'todo',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-8 sm:px-9 lg:px-12"
    >
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9079]">Planlægning</p>
        <h1 className="mt-1 font-serif text-[clamp(2rem,4vw,2.4rem)] leading-[1.1] tracking-[-0.02em] text-[#314523]">Venues</h1>
        <p className="mt-1 max-w-xl text-[13px] text-[#6c7561]">
          Fra opdagelse til det endelige ja — her er jeres overblik og de næste skridt.
        </p>
      </div>

      {/* Chosen overview */}
      <ChosenOverview chosen={chosen} couple={couple} onOpenDetail={onOpenDetail} onDiscover={onDiscover} />

      {/* Metrics strip */}
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-card sm:grid-cols-4">
        {metrics.map((m, i) => (
          <div key={m.label} className={cn('px-5 py-4', i < 3 && 'sm:border-r border-[var(--color-line)]', i % 2 === 0 && 'border-r sm:border-r')}>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">{m.label}</p>
            <p className={cn('mt-1 font-serif text-[1.6rem] leading-none', m.accent ? 'text-[#8a9079]' : 'text-ink')}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* What you've built so far */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
            {list.length > 0 ? `Jeres liste indtil videre · ${list.length}` : 'Jeres liste indtil videre'}
          </p>
          {list.length > 0 && (
            <button type="button" onClick={onList}
              className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#314523] hover:underline cursor-pointer">
              Rediger liste →
            </button>
          )}
        </div>
        {list.length === 0 ? (
          <button
            type="button"
            onClick={onDiscover}
            className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-card p-5 text-left transition-colors hover:border-[#314523]/40 cursor-pointer"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#314523]">
              <GlobeIcon size={18} className="text-white" />
            </span>
            <div>
              <p className="font-serif text-[1.1rem] text-ink">Ingen venues endnu</p>
              <p className="mt-0.5 text-[0.8rem] text-ink-soft">Start i Opdag og tilføj de steder I bliver forelsket i.</p>
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {list.slice(0, 8).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onOpenVenue(v.id)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-card text-left transition-shadow hover:shadow-sm cursor-pointer"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={imgSrc(v.image)} alt={v.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a221566] to-transparent" />
                  {chosen && v.id === chosen.id ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-canvas">
                      <Check size={9} /> Valgt
                    </span>
                  ) : stageOf(v.id) !== 'idle' ? (
                    <div className="absolute left-2 top-2"><StageChip stage={stageOf(v.id)} /></div>
                  ) : null}
                </div>
                <div className="p-2.5">
                  <p className="truncate font-serif text-[0.92rem] leading-tight text-ink">{v.name}</p>
                  <p className="truncate text-[0.66rem] text-muted">
                    {v.rating != null ? `★ ${v.rating.toFixed(1)}` : v.location || v.price}
                  </p>
                </div>
              </button>
            ))}
            {list.length > 8 && (
              <button
                type="button"
                onClick={onList}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-card p-4 text-center transition-colors hover:border-[#314523]/40 cursor-pointer"
              >
                <span className="font-serif text-[1.4rem] text-ink">+{list.length - 8}</span>
                <span className="text-[0.7rem] font-semibold text-muted">flere på listen</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Steps tree */}
      <div>
        <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">Sådan gør I</p>
        <div className="relative">
          {steps.map((s, i) => {
            const badge = s.state === 'done'
              ? 'bg-[#314523] text-white'
              : s.state === 'active'
                ? 'bg-[#8a9079] text-white'
                : 'bg-shell text-muted';
            return (
              <div key={s.n} className="relative flex gap-4 pb-3 last:pb-0">
                {i < steps.length - 1 && (
                  <span className="absolute left-[19px] top-11 bottom-1 w-px bg-[var(--color-line-strong)]" />
                )}
                <div className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-[1rem]', badge)}>
                  {s.state === 'done' ? <Check size={17} /> : s.n}
                </div>
                <button
                  type="button"
                  onClick={s.onClick}
                  disabled={s.disabled}
                  className={cn(
                    'flex flex-1 items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all',
                    s.disabled
                      ? 'cursor-not-allowed border-[var(--color-line)] bg-card opacity-55'
                      : 'border-[var(--color-line)] bg-card hover:border-[#314523]/40 hover:shadow-sm cursor-pointer',
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef1e6] text-[#314523]">
                      <s.Icon size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-serif text-[1.15rem] leading-tight text-ink">{s.title}</p>
                      <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-soft">{s.desc}</p>
                      <span className="mt-1.5 inline-block rounded-full bg-shell px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#6c7561]">{s.stat}</span>
                    </div>
                  </div>
                  {!s.disabled && (
                    <span className="flex shrink-0 items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#314523]">
                      {s.cta} <ArrowRight size={14} />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DISCOVER VIEW — globe → country → destination → real venues
═══════════════════════════════════════════════════════════════════════ */
function DiscoverView({
  couple, savedPlaceIds, listCount, similarNames, onSaved, onBack, onViewList, embedded = false,
}: {
  couple: Couple;
  savedPlaceIds: Set<string>;
  listCount: number;
  similarNames: string[] | null;
  onSaved: () => Promise<void>;
  onBack?: () => void;
  onViewList?: () => void;
  embedded?: boolean;
}) {
  const { lang } = useLang();
  const venueArea = venueAreaLabel(couple.region);

  const [country, setCountry] = useState<string | null>(null);
  const [destCards, setDestCards] = useState<DestinationSuggestion[]>([]);
  const [destLoading, setDestLoading] = useState(false);
  const [destFailed, setDestFailed] = useState(false);
  const seenDest = useRef<Record<string, DestinationSuggestion[]>>({});

  // City ↔ wedding-destination toggle (mirrors the onboarding globe step).
  const [destTab, setDestTab] = useState<'city' | 'wedding'>('city');
  // "Write your own" location box.
  const [custom, setCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const [destination, setDestination] = useState<string | null>(null);
  const [results, setResults] = useState<OnboardingVenueSuggestion[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsFailed, setResultsFailed] = useState(false);
  const seenVenues = useRef<Record<string, OnboardingVenueSuggestion[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Fullscreen photo viewer for destinations and venues.
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number; alt: string } | null>(null);
  // The results section below the globe — scrolled into view once a place is chosen.
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const scrollToResults = () => {
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  // Default the toggle to whichever category actually has cards.
  const applyDefaultTab = (list: DestinationSuggestion[]) =>
    setDestTab(list.some((s) => s.kind === 'city') ? 'city' : 'wedding');

  const loadDestinations = async (c: string) => {
    setDestFailed(false);
    const hit = seenDest.current[c];
    if (hit) { setDestCards(hit); applyDefaultTab(hit); return; }
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
      applyDefaultTab(list);
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

  const searchVenues = async (dest: string) => {
    setDestination(dest);
    setResultsFailed(false);
    scrollToResults();
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

  // "Find flere som disse" — recommendations seeded by what's already on the
  // list, reusing the same curator endpoint with the liked names as the vibe.
  const SIMILAR_KEY = 'Ligner jeres liste';
  const searchSimilar = async (names: string[]) => {
    setDestination(SIMILAR_KEY);
    setResultsFailed(false);
    scrollToResults();
    const hit = seenVenues.current[SIMILAR_KEY];
    if (hit) { setResults(hit); return; }
    setResultsLoading(true);
    setResults([]);
    try {
      const res = await fetch('/api/onboarding/venues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: venueArea || couple.region || 'jeres område',
          guest_count: couple.guests > 0 ? couple.guests : undefined,
          budget: couple.budgetTotal > 0 ? String(couple.budgetTotal) : undefined,
          loved_destinations: names.slice(0, 8),
          lang,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { venues?: OnboardingVenueSuggestion[] };
      const list = data.venues ?? [];
      if (list.length === 0) { setResultsFailed(true); return; }
      seenVenues.current[SIMILAR_KEY] = list;
      setResults(list);
    } catch {
      setResultsFailed(true);
    } finally {
      setResultsLoading(false);
    }
  };

  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !similarNames || similarNames.length === 0) return;
    seededRef.current = true;
    void searchSimilar(similarNames);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [similarNames]);

  const submitCustom = () => {
    const v = customValue.trim();
    if (v) void searchVenues(v);
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

  // Dismissing an AI suggestion just hides it for this session (there is no DB
  // row to reject yet — it only exists once added to the list).
  const dismissVenue = (id: string) => setDismissed((prev) => new Set(prev).add(id));

  const cities = destCards.filter((s) => s.kind === 'city');
  const weddings = destCards.filter((s) => s.kind === 'wedding');
  const activeDest = destTab === 'city' ? cities : weddings;

  const visibleResults = results.filter((v) => !dismissed.has(v.id));
  const destTitle = destination === SIMILAR_KEY ? 'Ligner jeres liste' : destination;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-6',
        embedded ? 'px-0 py-0' : 'px-6 py-8 sm:px-9 lg:px-12',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {onBack && (
            <button type="button" onClick={onBack}
              className="mb-3 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors cursor-pointer">
              <ArrowLeft size={13} /> Venues
            </button>
          )}
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9079]">Trin 1 · Opdag</p>
          <h1 className="mt-1 font-serif text-[clamp(2rem,4vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-[#314523]">
            Byg jeres liste af venues
          </h1>
          <p className="mt-1 max-w-xl text-[13px] text-[#6c7561]">
            Drej på kloden og vælg et land, eller skriv selv et sted — Ava researcher rigtige venues, som I kan gå på opdagelse i nedenfor.
          </p>
        </div>
        {onViewList && listCount > 0 && (
          <button
            type="button"
            onClick={onViewList}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#314523] px-3 text-xs font-semibold text-[#f7f5ef] transition-opacity hover:opacity-90 cursor-pointer"
          >
            Se din liste ({listCount}) <ArrowUpRight size={13} />
          </button>
        )}
      </div>

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Globe */}
        <div className="relative h-[min(62vh,560px)] overflow-hidden rounded-[28px] border border-[#d8d4c7] bg-[#f7f5ef]">
          <DestinationGlobe selectedCountry={country} onCountryPick={pickCountry} />
        </div>

        {/* Destination panel — pick a country, toggle city/wedding, or write your own */}
        <div className="flex min-h-[320px] max-h-[min(62vh,560px)] flex-col overflow-hidden rounded-[28px] border border-[#d8d4c7] bg-[#fcfbf7]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e4e0d4] px-5 py-4">
            <div className="min-w-0">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted">Destination</p>
              <h3 className="truncate font-serif text-[1.2rem] leading-tight text-ink">{country ?? 'Vælg et sted'}</h3>
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
              <PenLine size={13} /> Skriv selv
            </button>
          </div>

          {/* Write-your-own location box */}
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
                    placeholder="f.eks. Sydfyn · Toscana · jeres sommerhusby"
                    className="h-9 min-w-0 flex-1 rounded-full border border-[#d8d4c7] bg-[#fcfbf7] px-4 text-[0.82rem] text-ink placeholder:text-[#9a9686] focus:border-[#314523] focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={submitCustom}
                    disabled={!customValue.trim()}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#314523] px-3.5 text-[0.72rem] font-semibold text-[#f7f5ef] transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  >
                    <Search size={13} /> Søg
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* City ↔ wedding-destination toggle */}
          {!destLoading && !destFailed && country && (cities.length > 0 || weddings.length > 0) && (
            <div className="flex shrink-0 gap-0.5 border-b border-[#e4e0d4] px-3">
              {[
                { id: 'city' as const, label: 'Største byer', count: cities.length },
                { id: 'wedding' as const, label: 'Bryllupsdestinationer', count: weddings.length },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  type="button"
                  disabled={count === 0}
                  onClick={() => setDestTab(id)}
                  className={cn(
                    'flex-1 border-b-2 px-2 py-2.5 text-center text-[0.64rem] font-bold uppercase tracking-[0.08em] transition-colors cursor-pointer',
                    destTab === id ? 'border-[#314523] text-[#314523]' : 'border-transparent text-muted hover:text-ink',
                    count === 0 && 'cursor-not-allowed opacity-40',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!country ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#314523]">
                  <GlobeIcon size={19} className="text-white" />
                </div>
                <p className="text-[0.88rem] leading-relaxed text-ink-soft">
                  Tryk på et land på kloden — eller skriv selv et sted — for at se byer og bryllupsdestinationer.
                </p>
                {venueArea && (
                  <button
                    type="button"
                    onClick={() => void searchVenues(venueArea)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#314523] px-4 py-2.5 text-[0.78rem] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <MapPin size={13} />
                    Søg venues nær {venueArea}
                  </button>
                )}
              </div>
            ) : destLoading ? (
              <PanelSpinner label={`Finder byer og destinationer i ${country}…`} />
            ) : destFailed ? (
              <PanelError label="Kunne ikke hente destinationer." onRetry={() => void loadDestinations(country)} />
            ) : (
              <div className="flex flex-col gap-3">
                {activeDest.map((s) => (
                  <DiscoverDestCard
                    key={`${s.kind}-${s.name}`}
                    s={s}
                    active={destination === `${s.name}, ${country}`}
                    onChoose={() => void searchVenues(`${s.name}, ${country}`)}
                    onExpand={s.photo ? () => setLightbox({ photos: [s.photo!], index: 0, alt: s.name }) : undefined}
                  />
                ))}
                {activeDest.length === 0 && (
                  <p className="px-1 py-6 text-center text-[0.85rem] text-ink-soft">Ingen forslag i denne kategori.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chosen place → real venues, listed & picture-rich (no swipe) ─── */}
      <div ref={resultsRef} className="scroll-mt-6">
        {destination && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e0ddd2] pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9079]">Venues</p>
                <h2 className="mt-1 font-serif text-[clamp(1.5rem,3vw,2rem)] leading-tight text-[#314523]">
                  {destTitle}
                </h2>
                <p className="mt-1 text-[13px] text-[#6c7561]">
                  Klik på et venue for at se billederne, eller tilføj det til jeres liste.
                </p>
              </div>
              {onViewList && listCount > 0 && (
                <button
                  type="button"
                  onClick={onViewList}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#d8d4c7] px-3 text-xs font-semibold text-[#314523] transition-colors hover:bg-[#eef1e6] cursor-pointer"
                >
                  Se din liste ({listCount}) <ArrowUpRight size={13} />
                </button>
              )}
            </div>

            {resultsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7]">
                    <div className="h-44 bg-[#f0ede5]" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-1/2 rounded bg-[#f0ede5]" />
                      <div className="h-3 w-5/6 rounded bg-[#f0ede5]" />
                      <div className="h-3 w-2/3 rounded bg-[#f0ede5]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : resultsFailed ? (
              <div className="rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7] p-8 text-center">
                <p className="text-[0.9rem] text-ink-soft">Kunne ikke finde venues her.</p>
                <button
                  type="button"
                  onClick={() => void searchVenues(destination)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#314523] px-4 py-2 text-[0.78rem] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                >
                  Prøv igen
                </button>
              </div>
            ) : visibleResults.length === 0 ? (
              <div className="rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7] p-8 text-center">
                <p className="text-[0.9rem] text-ink-soft">Ingen venues tilbage her — prøv et andet sted.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleResults.map((v) => (
                    <DiscoverVenueCard
                      key={v.id}
                      v={v}
                      saved={isSaved(v)}
                      saving={savingId === v.id}
                      onSave={() => void saveVenue(v)}
                      onDismiss={() => dismissVenue(v.id)}
                      onExpand={
                        v.photos.length || v.photo
                          ? () => setLightbox({ photos: v.photos.length ? v.photos : [v.photo!], index: 0, alt: v.name })
                          : undefined
                      }
                    />
                  ))}
                </div>
                {justSaved.size > 0 && onViewList && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={onViewList}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#314523] px-5 text-xs font-semibold text-[#f7f5ef] transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      Se jeres liste ({justSaved.size}) <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </>
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
}

/* Photo-rich destination card — choosing it loads that place's venues below. */
function DiscoverDestCard({ s, active, onChoose, onExpand }: {
  s: DestinationSuggestion; active: boolean; onChoose: () => void; onExpand?: () => void;
}) {
  return (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl border transition-colors',
      active ? 'border-[#314523] shadow-[0_6px_18px_rgba(23,60,50,0.12)]' : 'border-[#e4e0d4] hover:border-[#314523]/40',
    )}>
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
              {s.kind === 'city' ? 'By' : 'Bryllup'}
            </span>
            {s.rating != null && (
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[0.7rem] text-ink-soft">
                <Star size={11} className="fill-[#e6a34e] text-[#e6a34e]" />{s.rating.toFixed(1)}
              </span>
            )}
          </div>
          {s.blurb && <p className="mt-1 line-clamp-2 text-[0.74rem] leading-snug text-[#6c7561]">{s.blurb}</p>}
          <p className="mt-2 inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#314523]">
            {active ? <><Check size={12} /> Viser venues</> : <>Se venues <ArrowRight size={12} /></>}
          </p>
        </div>
      </button>
      {onExpand && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          aria-label="Forstør billede"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#fcfbf7]/90 text-ink-soft shadow-sm transition-colors hover:text-ink cursor-pointer"
        >
          <Expand size={14} />
        </button>
      )}
    </div>
  );
}

/* Picture-rich venue card for the discovery list — click the image to browse
   photos, or add it straight to the couple's list. No swipe. */
function DiscoverVenueCard({ v, saved, saving, onSave, onDismiss, onExpand }: {
  v: OnboardingVenueSuggestion; saved: boolean; saving: boolean;
  onSave: () => void; onDismiss: () => void; onExpand?: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#e4e0d4] bg-[#fcfbf7] transition-shadow hover:shadow-[0_10px_28px_rgba(23,60,50,0.10)]">
      <button
        type="button"
        onClick={onExpand}
        disabled={!onExpand}
        aria-label={onExpand ? `Se billeder af ${v.name}` : undefined}
        className={cn('relative h-44 w-full overflow-hidden bg-[#eef1e6]', onExpand && 'cursor-pointer')}
      >
        {v.photo ? (
          <img src={v.photo} alt={v.name} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin size={22} className="text-[#314523] opacity-40" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        {v.rating != null && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-canvas/90 px-2.5 py-1 text-[0.68rem] font-semibold text-ink backdrop-blur-sm">
            <Star size={11} fill="currentColor" className="text-[#e6a34e]" />
            {v.rating.toFixed(1)}
            {v.review_count ? <span className="font-normal text-muted">({v.review_count})</span> : null}
          </span>
        )}
        {onExpand && (
          <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#141a13]/40 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
            <Expand size={14} />
          </span>
        )}
        {v.photos.length > 1 && (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[0.6rem] font-semibold text-white backdrop-blur-sm">
            {v.photos.length} billeder
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-serif text-[1.05rem] leading-tight text-[#314523]">{v.name}</p>
        {v.address && (
          <p className="mt-1 flex items-start gap-1 text-[0.72rem] text-[#6c7561]">
            <MapPin size={11} className="mt-0.5 shrink-0" /><span className="line-clamp-1">{v.address}</span>
          </p>
        )}
        {v.why_fit && <p className="mt-2 line-clamp-2 text-[0.78rem] leading-snug text-ink-soft">{v.why_fit}</p>}
        {(v.capacity || v.price_hint) && (
          <p className="mt-2 text-[0.7rem] font-medium text-[#6c7561]">
            {[v.capacity, v.price_hint].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={saved || saving}
            onClick={onSave}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[0.74rem] font-bold transition-colors',
              saved ? 'bg-[#eef1e6] text-[#314523] cursor-default' : 'bg-[#314523] text-white hover:opacity-90 cursor-pointer',
            )}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Plus size={13} />}
            {saved ? 'På listen' : 'Tilføj til liste'}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={`Afvis ${v.name}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6c7561] transition-colors hover:bg-[#f0ede5] hover:text-[#314523] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
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
        className="rounded-full border border-[#314523]/20 px-4 py-2 text-[0.75rem] font-bold text-[#314523] hover:bg-[#f7f5ef] transition-colors cursor-pointer"
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
  venues, couple, saved, sent, booked, stageOf, initialSelectedId, onToggleSave, onOutreach, onBook, onDiscover, onBack, onFindMore, onReview, onAva, onNextStep, onRefresh, embedded = false,
}: {
  venues: DisplayVenue[];
  couple: Couple;
  saved: Set<string>; sent: Set<string>; booked: string | null;
  stageOf: (id: string) => VenueStage;
  initialSelectedId?: string | null;
  onToggleSave: (id: string) => void; onOutreach: (id: string) => void;
  onBook: (id: string) => void; onDiscover: () => void; onAva: () => void;
  onBack?: () => void;
  onFindMore?: () => void;
  onReview: () => void;
  onNextStep?: () => void;
  onRefresh: () => Promise<void>;
  embedded?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [comparing, setComparing] = useState(false);
  const venueCity = venueAreaLabel(couple.region);
  const savedVenues = venues.filter(v => saved.has(v.id));
  const selectedVenue = selectedId ? venues.find((v) => v.id === selectedId) ?? null : null;
  const padX = embedded ? 'px-0' : 'px-6 sm:px-9 lg:px-12';

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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#314523]">
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
          className="mx-6 mt-8 sm:mx-9 lg:mx-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink px-6 py-5 text-canvas">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas/15">
              <Check size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-[1.15rem] leading-snug">{bookedVenue.name} er jeres venue</p>
              <p className="mt-0.5 text-[0.78rem] text-canvas/70">Alt om stedet samles her. Næste skridt: fotograf og catering.</p>
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

      {/* ── Chosen overview (only when a venue is booked) ───────────── */}
      {(onBack || booked) && (
      <div className={cn(padX, 'pt-8')}>
        {onBack && (
          <button type="button" onClick={onBack}
            className="mb-5 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors cursor-pointer">
            <ArrowLeft size={13} /> Venues
          </button>
        )}
        {booked && (
        <ChosenOverview
          chosen={venues.find((v) => v.id === booked) ?? null}
          couple={couple}
          onOpenDetail={() => setSelectedId(booked)}
          onDiscover={onDiscover}
        />
        )}
      </div>
      )}

      {/* ── Header + list tools ──────────────────────────────────────── */}
      <div className={cn(padX, 'pt-8')}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9079]">Trin 2 · Jeres liste</p>
            <h2 className="display mt-2 text-[clamp(2rem,5vw,3rem)] text-ink">
              Venues I <span className="italic">overvejer.</span>
            </h2>
            <p className="mt-2 max-w-md text-ink-soft">
              {venues.length} {venues.length === 1 ? 'venue' : 'venues'} på listen
              {venueCity ? ` · nær ${venueCity}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={onDiscover}
              className="flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] px-4 py-2.5 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-ink hover:bg-shell transition-colors cursor-pointer">
              <GlobeIcon size={14} /> Udforsk kloden
            </button>
            {onFindMore && (
              <button onClick={onFindMore}
                className="flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] px-4 py-2.5 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-ink hover:bg-shell transition-colors cursor-pointer">
                <Sparkles size={14} /> Find flere som disse
              </button>
            )}
            {savedVenues.length >= 2 && (
              <button onClick={() => setComparing(true)}
                className="rounded-full bg-ink px-4 py-2.5 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-canvas hover:opacity-85 transition-opacity cursor-pointer">
                Sammenlign ({savedVenues.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Outreach progress → review page ──────────────────────────── */}
      {savedVenues.length > 0 && (
        <div className={cn(padX, 'pt-8')}>
          <OutreachBanner
            notContacted={savedVenues.filter((v) => !sent.has(v.id)).length}
            contacted={savedVenues.filter((v) => sent.has(v.id)).length}
            onReview={onReview}
          />
        </div>
      )}

      {/* ── Venue grid ───────────────────────────────────────────────── */}
      <div className={cn(padX, 'pt-8')}>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sortedVenues.map((venue, i) => (
            <VenueGridCard key={venue.id} venue={venue} index={i}
              saved={saved.has(venue.id)} sent={sent.has(venue.id)} isBooked={booked === venue.id}
              stage={stageOf(venue.id)}
              onToggleSave={() => onToggleSave(venue.id)}
              onChoose={() => onBook(venue.id)}
              onSelect={() => setSelectedId(venue.id)} />
          ))}

          {/* Discover-more card */}
          <button
            type="button"
            onClick={onDiscover}
            className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[var(--color-line-strong)] p-6 text-center transition-colors hover:border-ink/40 hover:bg-card cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#314523]">
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
      <div className={cn(padX, 'pt-12')}>
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

/* ── Outreach banner — progress + entry to the review page ────────────── */
function OutreachBanner({
  notContacted, contacted, onReview,
}: {
  notContacted: number; contacted: number; onReview: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#314523] px-6 py-5 text-canvas">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12">
          <Send size={17} />
        </div>
        <div>
          <p className="font-serif text-[1.1rem] leading-snug">
            {notContacted > 0
              ? `${notContacted} på listen mangler kontakt`
              : 'Ava har kontaktet hele listen'}
          </p>
          <p className="mt-0.5 text-[0.78rem] text-canvas/70">
            {contacted > 0 ? `${contacted} kontaktet · ` : ''}
            {notContacted > 0 ? 'Se hvad Ava vil sende, og godkend.' : 'Følg svarene under Henvendelser.'}
          </p>
        </div>
      </div>
      {notContacted > 0 && (
        <button
          onClick={onReview}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#314523] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#f7f5ef] hover:opacity-90 transition-opacity cursor-pointer"
        >
          Lad Ava kontakte ({notContacted}) <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

/* ── Venue management grid card ───────────────────────────────────────── */
function VenueGridCard({
  venue, index, saved, sent, isBooked, stage, onToggleSave, onChoose, onSelect,
}: {
  venue: DisplayVenue; index: number; saved: boolean; sent: boolean; isBooked: boolean;
  stage: VenueStage;
  onToggleSave: () => void; onChoose: () => void; onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col overflow-hidden rounded-[18px] border border-[#d8d4c7] bg-[#fcfbf7]">

      <button type="button" onClick={onSelect} className="relative block aspect-[4/3] overflow-hidden cursor-pointer text-left">
        <img src={imgSrc(venue.image)} alt={venue.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a221570] to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <RatingBadge rating={venue.rating} count={venue.reviewCount} />
          {isBooked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-canvas">
              <Check size={10} /> Valgt
            </span>
          )}
        </div>
        {!isBooked && stage !== 'idle' && (
          <div className="absolute bottom-3 left-3">
            <StageChip stage={stage} className="shadow-sm" />
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-[1.15rem] leading-tight text-[#314523]">{venue.name}</h3>
            {venue.location && <p className="mt-0.5 truncate text-[0.72rem] text-[#6c7561]">{venue.location}</p>}
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={onToggleSave} aria-label={saved ? 'Fjern fra listen' : 'Tilføj til liste'}
            className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e4e0d4] transition-all cursor-pointer',
              saved ? 'bg-[#eef1e6] text-[#314523]' : 'text-[#6c7561] hover:text-[#314523] hover:bg-[#f7f5ef]')}>
            {saved ? <Check size={14} /> : <Plus size={14} />}
          </motion.button>
        </div>

        {venue.quote && (
          <p className="mt-2 line-clamp-2 text-[0.78rem] leading-snug text-[#6c7561]">{venue.quote}</p>
        )}

        <div className="mt-auto flex items-end gap-5 pt-4">
          <div>
            <p className="eyebrow !text-[#8a9079]">Pris</p>
            <p className="mt-0.5 font-serif text-[0.95rem] leading-none text-[#314523]">{venue.price}</p>
          </div>
          <div>
            <p className="eyebrow !text-[#8a9079]">Kapacitet</p>
            <p className="mt-0.5 font-serif text-[0.95rem] leading-none text-[#314523]">{venue.capacity}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={onSelect}
            className="flex h-8 flex-1 items-center justify-center rounded-full border border-[#e4e0d4] px-3 text-xs font-semibold text-[#314523] hover:bg-[#f7f5ef] transition-colors cursor-pointer">
            Se venue
          </button>
          {isBooked ? (
            <span className="flex h-8 items-center gap-1.5 rounded-full bg-[#eef1e6] px-3 text-xs font-semibold text-[#314523]">
              <Check size={12} /> Jeres venue
            </span>
          ) : (
            <button onClick={onChoose}
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#314523] px-3 text-xs font-semibold text-[#f7f5ef] hover:opacity-85 transition-opacity cursor-pointer">
              <Check size={12} /> Vælg
            </button>
          )}
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
type ComparisonField = { label: string; value: string; wide?: boolean };

function buildComparisonFields(v: DisplayVenue): ComparisonField[] {
  const fields: ComparisonField[] = [
    { label: 'Pris', value: v.price || '—' },
    { label: 'Kapacitet', value: v.capacity || '—' },
    { label: 'Beliggenhed', value: v.location || '—' },
    {
      label: 'Vurdering',
      value: v.rating != null
        ? `${v.rating.toFixed(1)}${v.reviewCount ? ` · ${v.reviewCount} anm.` : ''}`
        : '—',
    },
  ];

  for (const item of v.research?.practical?.slice(0, 4) ?? []) {
    fields.push({ label: item.key, value: item.value });
  }

  const notes = v.description?.trim()
    || v.quote?.trim()
    || v.why.slice(0, 2).join(' · ')
    || '—';

  fields.push({ label: 'Noter', value: notes, wide: true });

  if (v.research?.highlights?.length) {
    fields.push({
      label: 'Højdepunkter',
      value: v.research.highlights.slice(0, 3).join(' · '),
      wide: true,
    });
  }

  return fields;
}

function ComparisonView({
  venues, saved, booked, onBack, onToggleSave, onBook,
}: {
  venues: DisplayVenue[]; saved: Set<string>; booked: string | null;
  onBack: () => void; onToggleSave: (id: string) => void; onBook: (id: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <div className="px-6 pt-8 sm:px-9 lg:px-12">
        <button onClick={onBack}
          className="mb-8 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors cursor-pointer">
          <ArrowLeft size={13} /> Tilbage
        </button>
        <Eyebrow>Sammenligning · {venues.length} venues</Eyebrow>
        <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-ink">
          Side om <span className="italic">side</span>
        </h2>
        <p className="mt-2 max-w-xl text-[0.9rem] text-ink-soft">
          Sammenlign det der betyder noget — pris, kapacitet, noter og mere.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-6 px-6 pb-16 sm:px-9 lg:px-12">
        {venues.map((v, i) => {
          const isBooked = booked === v.id;
          const isSaved = saved.has(v.id);
          const fields = buildComparisonFields(v);

          return (
            <motion.article
              key={v.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="rule overflow-hidden rounded-[22px] bg-card"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Left — photo */}
                <div className="relative w-full shrink-0 lg:w-[300px] xl:w-[340px]">
                  <div className="aspect-[4/3] lg:min-h-full lg:aspect-auto lg:h-full">
                    <img
                      src={imgSrc(v.image)}
                      alt={v.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a221560] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-transparent" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <RatingBadge rating={v.rating} count={v.reviewCount} />
                    {isBooked && (
                      <span className="rounded-full bg-ink px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-canvas">
                        Booket
                      </span>
                    )}
                  </div>
                </div>

                {/* Right — attribute grid */}
                <div className="flex min-w-0 flex-1 flex-col gap-5 p-6 lg:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-serif text-[1.45rem] leading-tight text-ink">{v.name}</h3>
                      {v.location && (
                        <p className="mt-1 text-[0.8rem] text-muted">{v.location}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleSave(v.id)}
                        aria-label={isSaved ? 'Fjern fra listen' : 'Gem venue'}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full rule transition-all cursor-pointer',
                          isSaved ? 'bg-ink text-canvas' : 'hover:bg-shell',
                        )}
                      >
                        <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onBook(v.id)}
                        className="flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer"
                      >
                        {isBooked ? <><Check size={12} /> Booket</> : 'Vælg venue'}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {fields.map((field) => (
                      <div
                        key={`${v.id}-${field.label}`}
                        className={cn(
                          'rounded-[14px] border border-[var(--color-line)] bg-[#fcfbf7] px-4 py-3.5',
                          field.wide && 'sm:col-span-2',
                        )}
                      >
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
                          {field.label}
                        </p>
                        <p className={cn(
                          'mt-1.5 text-[0.88rem] leading-relaxed text-ink',
                          field.wide ? 'whitespace-pre-wrap' : 'font-medium',
                        )}>
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {v.why.length > 0 && !v.research?.highlights?.length && (
                    <ul className="space-y-2 border-t border-[var(--color-line)] pt-4">
                      {v.why.slice(0, 3).map((r) => (
                        <li key={r} className="flex items-start gap-2 text-[0.8rem] leading-snug text-ink-soft">
                          <Check size={11} className="mt-0.5 shrink-0 text-sage" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   OUTREACH REVIEW — "here's what Ava will do & who she'll contact" → approve
═══════════════════════════════════════════════════════════════════════ */
function OutreachReview({
  recipients, onBack, onApproved, onAva,
}: {
  recipients: DisplayVenue[];
  onBack: () => void; onApproved: () => void; onAva: () => void;
}) {
  const [draft, setDraft] = useState<EmailDraftRow | null>(null);
  const [preparing, setPreparing] = useState(true);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveMsg, setApproveMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setPreparing(true);
      setPrepError(null);
      try {
        const res = await fetch('/api/venues/outreach/prepare', { method: 'POST' });
        const data = (await res.json().catch(() => ({}))) as { draft?: EmailDraftRow; error?: string; message?: string };
        if (!alive) return;
        if (!res.ok || !data.draft) {
          setPrepError(data.message ?? 'Kunne ikke forberede henvendelsen lige nu.');
        } else {
          setDraft(data.draft);
        }
      } catch {
        if (alive) setPrepError('Kunne ikke forberede henvendelsen lige nu.');
      } finally {
        if (alive) setPreparing(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const approve = async () => {
    if (!draft) return;
    setApproving(true);
    setApproveMsg(null);
    try {
      const res = await fetch(`/api/drafts/${draft.id}/approve`, { method: 'POST' });
      if (res.status === 503) {
        setApproveMsg('Forbind Kalas-postkassen (Gmail) i indstillinger for at sende henvendelserne.');
      } else if (!res.ok) {
        setApproveMsg('Kunne ikke sende lige nu — prøv igen.');
      } else {
        onApproved();
      }
    } catch {
      setApproveMsg('Kunne ikke sende lige nu — prøv igen.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-3xl px-6 py-8 sm:px-9 lg:px-12"
    >
      <button type="button" onClick={onBack}
        className="mb-4 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={13} /> Tilbage til listen
      </button>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9079]">Trin 3 · Godkend</p>
      <h1 className="mt-1 font-serif text-[clamp(1.9rem,4vw,2.4rem)] leading-[1.1] tracking-[-0.02em] text-[#314523]">
        Ava kontakter {recipients.length} {recipients.length === 1 ? 'venue' : 'venues'}
      </h1>
      <p className="mt-2 text-[13px] text-[#6c7561]">
        Ava sender en personlig mail til hvert sted fra jeres Kalas-postkasse og samler alle svar under Henvendelser. I godkender her — intet sendes uden.
      </p>

      {/* Recipients */}
      <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-card p-5">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">Modtagere</p>
        {recipients.length === 0 ? (
          <p className="mt-3 text-[0.88rem] text-ink-soft">Alle på listen er allerede kontaktet.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-[var(--color-line)]">
            {recipients.map((v) => (
              <div key={v.id} className="flex items-center gap-3 py-2.5">
                <img src={imgSrc(v.image)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9rem] font-bold text-ink">{v.name}</p>
                  {v.location && <p className="truncate text-[0.72rem] text-muted">{v.location}</p>}
                </div>
                <Send size={14} className="shrink-0 text-muted" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Draft preview */}
      <div className="mt-4 rounded-2xl border border-[var(--color-line)] bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">Avas udkast</p>
          <button onClick={onAva} className="text-[0.72rem] font-semibold text-[#8a9079] hover:underline cursor-pointer">Rediger med Ava</button>
        </div>
        {preparing ? (
          <div className="flex items-center gap-2.5 py-6 text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Ava skriver udkastet…
          </div>
        ) : prepError ? (
          <p className="mt-3 rounded-xl bg-shell px-4 py-3 text-[0.85rem] text-ink-soft">{prepError}</p>
        ) : draft ? (
          <>
            <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">Emne</p>
            <p className="mt-1 text-[0.95rem] font-semibold text-ink">{draft.subject}</p>
            <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">Besked</p>
            <p className="mt-1 whitespace-pre-wrap text-[0.88rem] leading-relaxed text-ink-soft">{draft.body_template}</p>
            <p className="mt-3 text-[0.72rem] text-muted">Ava tilpasser hver mail til det enkelte venue før afsendelse.</p>
          </>
        ) : null}
      </div>

      {approveMsg && (
        <p className="mt-4 rounded-xl bg-[var(--color-terracotta-tint)] px-4 py-3 text-[0.85rem] text-[var(--color-terracotta)]">{approveMsg}</p>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void approve()}
          disabled={approving || preparing || !draft || recipients.length === 0}
          className="flex items-center gap-2 rounded-full bg-[#314523] px-7 py-3.5 text-[0.85rem] font-bold text-canvas transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
        >
          {approving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Godkend & lad Ava sende
        </button>
        <button onClick={onBack}
          className="rounded-full rule bg-canvas px-5 py-3.5 text-[0.85rem] font-medium text-ink hover:bg-card transition-colors cursor-pointer">
          Annuller
        </button>
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
  // Start in the researching state when a shortlisted venue has nothing on file
  // yet — opening it kicks off research (below), so the couple never sees an
  // empty page. Non-shortlisted venues wait for a manual press.
  const [researching, setResearching] = useState(!venue.research && saved);
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

  // First time a shortlisted venue is opened, kick off research automatically so
  // the couple lands on filled-in info instead of an empty page. Only runs for
  // venues on their list and only when nothing has been researched yet; the
  // button remains for a manual refresh. The ref guards against re-firing on
  // re-render (the view is keyed by venue.id, so a different venue remounts and
  // gets its own auto-run).
  const autoResearchedRef = useRef(false);
  useEffect(() => {
    if (autoResearchedRef.current || venue.research || !saved) return;
    autoResearchedRef.current = true;
    void runResearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-full bg-[#f5f3ee] pb-24">

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e0ddd2] bg-[#f5f3ee]/95 px-6 py-3 backdrop-blur-md sm:px-9 lg:px-12">
        <button type="button" onClick={onBack}
          className="flex h-8 cursor-pointer items-center gap-1.5 text-sm text-[#6c7561] transition-colors hover:text-[#314523]">
          <ArrowLeft size={15} /> Tilbage
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void runResearch()}
            disabled={researching}
            className={cn(
              'flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all',
              researching
                ? 'border border-[#e4e0d4] bg-[#f7f5ef] text-[#9a9686]'
                : 'border border-[#e4e0d4] bg-[#fcfbf7] text-[#314523] hover:bg-[#f7f5ef]',
            )}>
            {researching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {researching ? 'Ava researcher…' : research ? 'Opdater research' : 'Research venue'}
          </button>
          <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={onSave}
            className={cn(
              'flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all',
              saved
                ? 'bg-[#eef1e6] text-[#314523]'
                : 'border border-[#e4e0d4] bg-[#fcfbf7] text-[#314523] hover:bg-[#f7f5ef]',
            )}>
            <Heart size={13} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Gemt' : 'Gem'}
          </motion.button>
        </div>
      </div>

      {/* ── Photos ────────────────────────────────────────────────── */}
      {realPhotos.length > 1 ? (
        <div className="grid h-[300px] gap-1 sm:h-[460px] sm:grid-cols-[2fr_1fr_1fr] sm:grid-rows-2">
          <div className="relative overflow-hidden sm:row-span-2">
            <img src={imgSrc(venue.image)} alt={venue.name}
              className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-[#d8d4c7] bg-[#fcfbf7]/95 px-3 py-1.5 backdrop-blur-sm">
              <span className="text-[0.68rem] font-medium text-[#314523]">{realPhotos.length} billeder</span>
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
      <div className="px-6 pt-8 sm:px-9 lg:px-12">

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#eef1e6] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#314523]">
            Ava pick
          </span>
          {venue.rating != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e0d4] bg-[#f7f5ef] px-3 py-1 text-[0.72rem] font-medium text-[#314523]">
              <Star size={12} fill="currentColor" className="text-[#8a7d5c]" />
              {venue.rating.toFixed(1)}
              {venue.reviewCount > 0 && <span className="text-[#6c7561]">· {venue.reviewCount} anmeldelser</span>}
            </span>
          )}
        </div>
        <h1 className="mt-3 font-serif text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] text-[#314523]">
          {venue.name}
        </h1>
        <p className="mt-1 text-sm text-[#6c7561]">{venue.location}</p>
        {directions && (
          <p className="mt-1 text-[0.8rem] text-[#8a9079]">{directions}</p>
        )}

        {researchError && (
          <p className="mt-4 rounded-[14px] border border-[#e8d5c8] bg-[#faf4ef] px-4 py-3 text-sm text-[#7b4032]">{researchError}</p>
        )}

        {research?.briefing?.length ? (
          <div className="mt-6 rounded-[18px] bg-[#314523] p-6 text-[#f7f5ef]">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#a6b0aa]">Avas briefing</p>
            <ul className="mt-4 space-y-2.5">
              {research.briefing.map((line) => (
                <li key={line} className="flex items-start gap-3 text-[0.92rem] leading-snug">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#dce3d3]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : researching ? (
          <div className="mt-6 flex items-center gap-3 rounded-[18px] border border-[#e4e0d4] bg-[#fcfbf7] px-5 py-4">
            <Loader2 size={16} className="shrink-0 animate-spin text-[#314523]" />
            <p className="text-sm leading-relaxed text-[#6c7561]">
              Ava researcher venueet — søger på nettet og udfylder kapacitet, priser og praktisk info fra stedets egne sider…
            </p>
          </div>
        ) : !research ? (
          <div className="mt-6 rounded-[18px] border border-dashed border-[#d8d4c7] bg-[#fcfbf7] px-5 py-4">
            <p className="text-sm leading-relaxed text-[#6c7561]">
              Ava kunne ikke hente info automatisk. Tryk <span className="font-medium text-[#314523]">Research venue</span> for at prøve igen.
            </p>
          </div>
        ) : null}

        {description && (
          <p className="mt-7 max-w-2xl text-[1.02rem] leading-relaxed text-[#59634f]">{description}</p>
        )}

        {/* Stats strip */}
        <div className="mt-8 grid grid-cols-3 items-stretch gap-px overflow-hidden rounded-[18px] border border-[#d8d4c7] bg-[#d8d4c7]">
          <div className="flex min-h-[5.5rem] flex-col bg-[#fcfbf7] px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#6c7561]">Kapacitet</p>
            <p className="mt-2 text-[0.9rem] font-semibold leading-snug text-[#314523]">{venue.capacity || '—'}</p>
          </div>
          <div className="flex min-h-[5.5rem] flex-col bg-[#eef1e6] px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#6c7561]">Pris fra</p>
            <p className="mt-2 text-[0.9rem] font-semibold leading-snug text-[#314523]">{venue.price || '—'}</p>
          </div>
          <div className="flex min-h-[5.5rem] flex-col bg-[#314523] px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#c5ccc4]">Bedømmelse</p>
            <p className="mt-2 font-serif text-[1.35rem] leading-none text-[#f7f5ef]">
              {venue.rating != null ? `★ ${venue.rating.toFixed(1)}` : '—'}
            </p>
          </div>
        </div>

        {practical.length > 0 && (
          <div className="mt-10 border-t border-[#e0ddd2] pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#314523]">Praktisk info</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
              {practical.map(({ key, value }) => (
                <div key={key}>
                  <dt className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#6c7561]">{key}</dt>
                  <dd className="mt-1.5 text-[0.92rem] leading-snug text-[#314523]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {highlights.length > 0 && (
          <div className="mt-10 border-t border-[#e0ddd2] pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#314523]">Faciliteter & fordele</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-3">
                  <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-[#7a9068]" />
                  <span className="text-[0.92rem] leading-snug text-[#59634f]">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {packages.length > 0 && (
          <div className="mt-10 border-t border-[#e0ddd2] pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#314523]">Priser & pakker</p>
            <p className="mt-1.5 text-[0.8rem] text-[#6c7561]">Fra venueets egne sider — bekræft altid pris og dato direkte.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {packages.map((pkg, i) => {
                const active = activePackage === i;
                return (
                  <button key={pkg.name} type="button" onClick={() => setPkg(active ? null : i)}
                    className={cn(
                      'group flex flex-col rounded-[18px] p-5 text-left transition-all cursor-pointer',
                      pkg.featured
                        ? 'bg-[#314523] text-[#f7f5ef]'
                        : active
                          ? 'border-2 border-[#314523] bg-[#fcfbf7]'
                          : 'border border-[#d8d4c7] bg-[#fcfbf7] hover:bg-[#f7f5ef]',
                    )}>
                    {pkg.featured && (
                      <span className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-[#dce3d3]">Mest valgt</span>
                    )}
                    <span className={cn('font-serif text-[1.15rem]', pkg.featured ? 'text-[#f7f5ef]' : 'text-[#314523]')}>
                      {pkg.name}
                    </span>
                    <span className={cn('mt-1 text-[0.76rem] leading-relaxed', pkg.featured ? 'text-[#a6b0aa]' : 'text-[#6c7561]')}>
                      {pkg.desc}
                    </span>
                    <span className={cn('mt-4 font-serif text-[1.5rem] leading-none', pkg.featured ? 'text-[#f7f5ef]' : 'text-[#314523]')}>
                      {pkg.price}
                    </span>
                    {active && !pkg.featured && (
                      <span className="mt-3 flex items-center gap-1 text-[0.72rem] text-[#7a9068]">
                        <Check size={12} /> Valgt
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(venue.quote || venue.why.length > 0) && (
          <div className="mt-10 border-t border-[#e0ddd2] pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#314523]">Derfor matcher det jer</p>
            <div className="mt-5 rounded-[18px] border border-[#d8d4c7] bg-[#fcfbf7] p-6">
              {venue.quote && (
                <blockquote className="font-serif text-[1.2rem] italic leading-relaxed text-[#314523]">
                  &ldquo;{venue.quote}&rdquo;
                </blockquote>
              )}
              {venue.why.length > 0 && (
                <ul className={cn('space-y-3', venue.quote && 'mt-5 border-t border-[#e4e0d4] pt-5')}>
                  {venue.why.map((reason) => (
                    <li key={reason} className="flex items-start gap-3">
                      <Check size={13} className="mt-1 shrink-0 text-[#7a9068]" />
                      <span className="text-[0.9rem] leading-relaxed text-[#59634f]">{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {allVenues.length > 1 && (
          <div className="mt-10 border-t border-[#e0ddd2] pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#314523]">Flere fra jeres liste</p>
            <div className="mt-5 flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {allVenues.filter((v) => v.id !== venue.id).slice(0, 4).map((v) => (
                <button key={v.id} type="button" onClick={() => onSelectOther(v.id)}
                  className="relative shrink-0 overflow-hidden rounded-[14px] text-left cursor-pointer"
                  style={{ width: 'min(180px, 45vw)', aspectRatio: '3/4' }}>
                  <img src={imgSrc(v.image)} alt={v.name}
                    className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#314523]/90 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="font-serif text-[0.95rem] leading-tight text-[#f7f5ef]">{v.name}</p>
                    {v.rating != null && (
                      <p className="mt-0.5 text-[0.65rem] text-[#dce3d3]">★ {v.rating.toFixed(1)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-[#e0ddd2] pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#314523]">Jeres noter</p>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Skriv noter om dette venue — spørgsmål, mavefornemmelser, hvad I vil spørge om til visning…"
            rows={4}
            className="mt-3 w-full resize-none rounded-[18px] border border-[#d8d4c7] bg-[#fcfbf7] px-5 py-4 text-[0.9rem] leading-relaxed text-[#314523] placeholder:text-[#9a9686] focus:outline-none"
          />
        </div>

        <div className="mt-8 border-t border-[#e0ddd2] pt-8">
          <p className="mb-4 text-[0.8rem] text-[#6c7561]">
            Ava forbereder en personlig henvendelse og sender den på jeres vegne.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {isBooked ? (
              <div className="flex h-8 items-center gap-1.5 rounded-full bg-[#eef1e6] px-3 text-xs font-semibold text-[#314523]">
                <Check size={13} /> Jeres venue
              </div>
            ) : (
              <>
                <button type="button" onClick={onBook}
                  className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[#314523] px-3 text-xs font-semibold text-[#f7f5ef] hover:opacity-85 transition-opacity">
                  <Check size={13} /> Vælg som jeres venue
                </button>
                <button type="button" onClick={onContact}
                  className="flex h-8 cursor-pointer items-center rounded-full border border-[#e4e0d4] bg-[#fcfbf7] px-3 text-xs font-semibold text-[#314523] hover:bg-[#f7f5ef] transition-colors">
                  {sent ? 'Ava har kontaktet stedet' : 'Book visning via Ava →'}
                </button>
              </>
            )}
            <button type="button" onClick={onSave}
              className={cn(
                'flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors',
                saved
                  ? 'bg-[#eef1e6] text-[#314523]'
                  : 'border border-[#e4e0d4] bg-[#fcfbf7] text-[#314523] hover:bg-[#f7f5ef]',
              )}>
              <Heart size={13} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Gemt' : 'Gem venue'}
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
