"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, MessageCircle, ChevronDown, X } from 'lucide-react';
import { dnaTraits } from '../data';
import { useWedding } from '../useWedding';
import { Eyebrow, Pill, cn } from '../ui';
import type { ScreenId } from '../Shell';
import OnboardingHint from '../OnboardingHint';
import type { VendorCategory, VenueRow } from '@/lib/db/types';

/* ── Categories (Danish display ↔ backend vendor category) ───────────── */
type Cat = 'alle' | 'fotografi' | 'video' | 'blomster' | 'catering' | 'bar' | 'kage' | 'musik' | 'beauty';
const CATS: { id: Cat; label: string }[] = [
  { id: 'alle',      label: 'Alle'          },
  { id: 'fotografi', label: 'Fotografi'     },
  { id: 'video',     label: 'Video'         },
  { id: 'blomster',  label: 'Blomster'      },
  { id: 'catering',  label: 'Catering'      },
  { id: 'bar',       label: 'Bar & Drinks'  },
  { id: 'kage',      label: 'Bryllupskage'  },
  { id: 'musik',     label: 'Musik'         },
  { id: 'beauty',    label: 'Beauty'        },
];

const CAT_TO_BACKEND: Partial<Record<Cat, VendorCategory>> = {
  fotografi: 'photographer',
  video: 'photographer',
  blomster: 'florist',
  catering: 'caterer',
  musik: 'musician',
};
const BACKEND_TO_CAT: Partial<Record<VendorCategory, Cat>> = {
  photographer: 'fotografi',
  florist: 'blomster',
  caterer: 'catering',
  musician: 'musik',
};

/* Real vendor rows (everything that isn't a wedding venue) → card shape. */
interface VendorCard {
  id: string;
  name: string;
  cat: Cat;
  style: string;
  price: string;
  matchPct: number | null;
  image: string | null;
  tags: string[];
  quote: string;
  liked: boolean;
}

function toCard(v: VenueRow): VendorCard {
  return {
    id: v.id,
    name: v.name,
    cat: BACKEND_TO_CAT[v.category] ?? 'alle',
    style: v.description?.slice(0, 60) ?? v.why_fit?.slice(0, 60) ?? '',
    price: v.price_hint ?? '',
    matchPct: v.rating != null ? Math.round(Number(v.rating) * 20) : null,
    image: v.image_url,
    tags: v.review_count ? [`${v.review_count} anmeldelser`] : [],
    quote: v.why_fit ?? v.reviews?.[0]?.text ?? '',
    liked: v.swipe_status === 'liked',
  };
}

/* ── FAQ (static guidance) ──────────────────────────────────────────── */
const FAQ = [
  { q: 'Hvornår skal vi booke vores fotograf?',    a: 'Mindst 12–18 måneder inden brylluppet. De bedste er oftest fuldt booket tidligt — specielt lørdag-bryllupper forsvinder først.' },
  { q: 'Hvad koster fotografi typisk?',            a: 'Fra 15.000 til 35.000 kr. for en heldags-pakke inkl. redigering. Videofilm koster typisk 8–15.000 kr. ekstra.' },
  { q: 'Reportage eller klassisk fotografi?',      a: 'Reportage er dokumentarisk og følger dagen naturligt. Klassisk inkluderer poserede portrætter og familiefotos. De fleste par vælger en blanding.' },
  { q: 'Hvad med blomster og dekoration?',         a: 'Floristerne bookes oftest 9–12 måneder inden. Ava laver et brief baseret på jeres moodboard, så floristerne kender jeres stil fra første møde.' },
  { q: 'Kan Ava koordinere alle leverandørerne?',  a: 'Ja — Ava koordinerer tidsplaner, briefer alle parter med jeres DNA-profil og holder styr på udestående svar og leverancer.' },
];

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */
export default function Suppliers({ onNavigate }: { onNavigate?: (s: ScreenId) => void }) {
  const { couple, venues, refresh } = useWedding();
  const [query,   setQuery]   = useState('');
  const [cat,     setCat]     = useState<Cat>(() => {
    if (typeof sessionStorage === 'undefined') return 'alle';
    const saved = sessionStorage.getItem('kalas_vendor_cat') as Cat | null;
    if (saved) {
      sessionStorage.removeItem('kalas_vendor_cat');
      return saved;
    }
    return 'alle';
  });

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Real vendors the agent has found for this wedding (never the venue itself).
  const vendors = useMemo(
    () => venues.filter((v) => v.category !== 'venue').map(toCard),
    [venues]
  );

  const like = async (id: string) => {
    const target = venues.find((v) => v.id === id);
    const next = target?.swipe_status === 'liked' ? 'rejected' : 'liked';
    await fetch(`/api/venues/${id}/swipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: next }),
    });
    await refresh();
  };

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const backendCat = CAT_TO_BACKEND[cat];
    return vendors
      .filter((s) => {
        if (cat === 'alle') return true;
        // match by the mapped backend category via the card's cat label
        return s.cat === cat || (backendCat && BACKEND_TO_CAT[backendCat] === s.cat);
      })
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.style.toLowerCase().includes(q))
      .sort((a, b) => (b.matchPct ?? 0) - (a.matchPct ?? 0));
  }, [vendors, query, cat]);

  const savedCount = vendors.filter((v) => v.liked).length;
  const catLabel = CATS.find((c) => c.id === cat)?.label ?? 'Alle';

  return (
    <div className="min-h-screen">

      {/* ── Sticky header: search + category chips ──────────────────── */}
      <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur-md rule-b">
        <div className="px-6 pt-5 sm:px-10 lg:px-16">
          <div className="flex items-center gap-3 rounded-2xl rule bg-card px-4 py-3">
            <Search size={16} className="shrink-0 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søg leverandører, stil eller kategori…"
              className="flex-1 bg-transparent text-[0.92rem] text-ink placeholder:text-muted focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="shrink-0 text-muted hover:text-ink transition-colors cursor-pointer">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar py-3 -mx-1 px-1">
            {CATS.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-[0.72rem] font-medium transition-all cursor-pointer',
                  cat === c.id
                    ? 'bg-ink text-canvas'
                    : 'rule bg-card text-ink-soft hover:text-ink hover:bg-shell',
                )}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pt-8 sm:px-10 lg:px-16">

        {/* ── DNA context banner ──────────────────────────────────────── */}
        <div className="rule rounded-2xl bg-sage-tint px-6 py-5">
          <p className="text-[0.62rem] font-medium tracking-[0.28em] uppercase text-muted mb-3">
            Moodboard-DNA · {couple.a || 'I'}{couple.b ? ` & ${couple.b}` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {dnaTraits.slice(0, 4).map((t) => (
              <span key={t.label}
                className="inline-flex items-center gap-2 rounded-full rule bg-canvas px-3.5 py-1.5">
                <span className="h-[3px] rounded-full bg-sage shrink-0"
                  style={{ width: `${Math.round(t.pct / 12)}px` }} />
                <span className="text-[0.68rem] font-medium text-ink">{t.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Ask-Ava-to-send banner when vendors are saved */}
        {savedCount > 0 && (
          <button onClick={() => onNavigate?.('ava')}
            className="mt-4 flex w-full items-center justify-between rounded-2xl rule bg-card px-5 py-3.5 text-left transition-colors hover:bg-shell cursor-pointer">
            <span className="text-[0.85rem] text-ink">
              {savedCount} leverandør{savedCount === 1 ? '' : 'er'} gemt — bed Ava sende henvendelser
            </span>
            <MessageCircle size={16} className="text-muted" />
          </button>
        )}

        {/* ── Results header ───────────────────────────────────────────── */}
        <div className="mt-10 flex items-baseline justify-between">
          <Eyebrow>
            {cat === 'alle' ? 'Jeres leverandører' : catLabel} · {results.length} resultater
          </Eyebrow>
          {savedCount > 0 && (
            <span className="flex items-center gap-1.5 text-[0.7rem] text-muted">
              <Heart size={11} fill="currentColor" className="text-ink" />
              {savedCount} gemt
            </span>
          )}
        </div>

        {/* ── Vendor grid / empty state ────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {results.length === 0 ? (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-16 text-center">
              <p className="font-serif text-[1.3rem] text-ink-soft italic">
                {vendors.length === 0 ? 'Ingen leverandører fundet endnu' : `Ingen resultater for "${query}"`}
              </p>
              {vendors.length === 0 ? (
                <button onClick={() => onNavigate?.('ava')}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.8rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer">
                  <MessageCircle size={14} /> Bed Ava finde leverandører
                </button>
              ) : (
                <button onClick={() => { setQuery(''); setCat('alle'); }}
                  className="mt-4 text-[0.78rem] text-muted hover:text-ink transition-colors cursor-pointer underline underline-offset-2">
                  Ryd filter
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key={`${cat}-${query}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((s, i) => (
                <SupplierCard key={s.id} s={s} i={i} onToggleSave={like} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="mt-20 rule-t pt-12">
          <Eyebrow>Ofte stillede spørgsmål</Eyebrow>
          <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-ink">
            Hvad vil I <span className="italic">gerne vide?</span>
          </h2>
          <div className="mt-8 divide-y divide-[var(--color-line)]">
            {FAQ.map((item, i) => <FaqRow key={i} q={item.q} a={item.a} />)}
          </div>
        </section>

        {/* ── Tal med Ava ──────────────────────────────────────────────── */}
        <section className="py-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rule rounded-2xl bg-card p-8 text-center">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-ink">
              <span className="font-serif text-[1.3rem] leading-none text-canvas">K</span>
            </div>
            <Eyebrow className="text-center">Spørg Ava om leverandørerne</Eyebrow>
            <p className="display mt-4 text-[1.8rem] text-ink italic">
              "Hvad skal vi booke og hvornår?"
            </p>
            <p className="mt-3 max-w-xs mx-auto text-[0.85rem] text-muted leading-relaxed">
              Ava kender jeres dato, region, budget og stil og giver et personligt svar.
            </p>
            <div className="mt-6 flex justify-center">
              <Pill arrow onClick={() => onNavigate?.('ava')}>
                <MessageCircle size={14} /> Tal med Ava
              </Pill>
            </div>
          </motion.div>
        </section>

      </div>

      <OnboardingHint id="vendors" />
    </div>
  );
}

/* ── Vendor card ─────────────────────────────────────────────────────── */
function SupplierCard({ s, i, onToggleSave }: {
  s: VendorCard; i: number; onToggleSave: (id: string) => void;
}) {
  const catLabel = CATS.find((c) => c.id === s.cat)?.label ?? 'Leverandør';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="rule rounded-2xl bg-card overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        {s.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt={s.name}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-shell to-sage-tint" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a221550] to-transparent" />
        {s.matchPct != null && (
          <div className="absolute left-3 top-3 rounded-full bg-sage px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink">
            {s.matchPct}% match
          </div>
        )}
        <button onClick={() => onToggleSave(s.id)} aria-label={s.liked ? 'Fjern fra gemt' : 'Gem'}
          className={cn(
            'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all cursor-pointer',
            s.liked ? 'bg-sage text-ink' : 'bg-canvas/20 text-canvas hover:bg-canvas/40',
          )}>
          <Heart size={14} fill={s.liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted">{catLabel}</p>
        <h3 className="display mt-1 text-[1.1rem] text-ink leading-tight">{s.name}</h3>
        {s.style && <p className="mt-0.5 text-[0.76rem] text-muted">{s.style}</p>}

        {s.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {s.tags.map((t) => (
              <span key={t} className="rounded-full bg-shell px-2.5 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.1em] text-ink-soft">
                {t}
              </span>
            ))}
          </div>
        )}

        {s.quote && (
          <p className="mt-3 font-serif text-[0.82rem] italic text-ink-soft leading-snug flex-1">
            "{s.quote}"
          </p>
        )}

        <div className="mt-4 flex items-center justify-between rule-t pt-4">
          <span className="font-serif text-[1rem] text-ink">{s.price || '—'}</span>
          <button onClick={() => onToggleSave(s.id)}
            className="rounded-full bg-ink px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
            {s.liked ? 'Gemt ✓' : 'Kontakt →'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── FAQ row (accordion) ─────────────────────────────────────────────── */
function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-1">
      <button onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left cursor-pointer group">
        <span className="font-serif text-[1.05rem] text-ink group-hover:text-ink-soft transition-colors">{q}</span>
        <span className="shrink-0 text-muted transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={17} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden">
            <p className="pb-5 text-[0.92rem] leading-relaxed text-ink-soft">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
