import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, Check, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { IMAGES, dnaTraits, moodboard, venueRecs, couple, type VenueRec } from '../data';
import { Eyebrow, Pill, Bleed, cn } from '../ui';
import type { ScreenId } from '../Shell';
import OnboardingHint from '../OnboardingHint';

/* ── Swipe deck ──────────────────────────────────────────────────────── */
const SWIPE_DECK = [
  { id: 's1', label: 'Italian Villa',    sub: 'Toscansk elegance',   image: 'orangeri'  as const },
  { id: 's2', label: 'Garden Party',     sub: 'Botanisk og luftigt', image: 'lavender'  as const },
  { id: 's3', label: 'Rustic Barn',      sub: 'Råt og varmt',        image: 'barn'      as const },
  { id: 's4', label: 'Modern Hotel',     sub: 'Urban luksus',        image: 'candles'   as const },
  { id: 's5', label: 'Forest Ceremony',  sub: 'Natur og æter',       image: 'ceremony'  as const },
  { id: 's6', label: 'Botanical Estate', sub: 'Herregård i grønt',   image: 'arch'      as const },
  { id: 's7', label: 'Nordic Long Table',sub: 'Varmt og enkelt',     image: 'longTable' as const },
  { id: 's8', label: 'Wild Florals',     sub: 'Sommer og frihed',    image: 'florals'   as const },
] as const;

type SwipeCard = typeof SWIPE_DECK[number];

/* ── Category grid data ──────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'herregaard',   name: 'Herregård',      count: 14, image: 'orangeri'  as const, tagline: 'Park & overnatning' },
  { id: 'kystnær',      name: 'Kystnær',         count: 9,  image: 'lavender'  as const, tagline: 'Vand, lys, vind' },
  { id: 'lade',         name: 'Lade',            count: 11, image: 'barn'      as const, tagline: 'Råt og varmt' },
  { id: 'have',         name: 'Have & drivhus',  count: 7,  image: 'florals'   as const, tagline: 'Stille og lyserødt lys' },
  { id: 'industriel',   name: 'Industriel',      count: 6,  image: 'longTable' as const, tagline: 'Råt og urbant' },
  { id: 'villa',        name: 'Villa & vingård', count: 5,  image: 'olive'     as const, tagline: 'Sydeuropæisk stemning' },
  { id: 'kapel',        name: 'Kapel & gods',    count: 8,  image: 'candles'   as const, tagline: 'Historisk og andægtigt' },
  { id: 'byrestaurant', name: 'By-restaurant',   count: 12, image: 'portrait'  as const, tagline: 'Urban gastronomi' },
] as const;

type Category = typeof CATEGORIES[number];

/* ── Category venue list ─────────────────────────────────────────────── */
const CATEGORY_VENUES = [
  { id: 'sonnerup',  name: 'Sonnerupgaard Gods', location: 'Hvalsø · 45 min',    image: 'orangeri' as const, quote: 'Mest gemt af par i 2026',            tags: ['OVERNATNING', 'PARK', 'EGEN CATERING'],  capacity: 'Op til 140', price: 'Fra DKK 62.000', cat: 'herregaard' },
  { id: 'sohuset',   name: 'Søhuset Pier',        location: 'Hornbæk · Kysten',   image: 'lavender' as const, quote: 'Solnedgang over vandet kl. 20.42',   tags: ['HAVUDSIGT', 'CATERING INKL.'],           capacity: 'Op til 110', price: 'Fra DKK 78.500', cat: 'kystnær' },
  { id: 'kokkedal2', name: 'Kokkedal Slot',        location: 'Kokkedal · Nordsjæl',image: 'arch'     as const, quote: 'En september-lørdag i slotsparken',  tags: ['SLOTSPARK', 'OVERNATNING 24'],           capacity: 'Op til 130', price: 'Fra DKK 72.000', cat: 'herregaard' },
  { id: 'lillelade', name: 'Lille Lade',           location: 'Roskilde · 35 min',  image: 'barn'     as const, quote: 'Rå stråtag og levende lys',           tags: ['ADGANG DAG FØR', 'RUSTIK'],              capacity: 'Op til 160', price: 'Fra DKK 52.000', cat: 'lade' },
  { id: 'nimb2',     name: 'Nimb Terrasse',        location: 'Tivoli, København',  image: 'candles'  as const, quote: 'Tivoli om natten som baggrund',       tags: ['BYUDSIGT', 'MICHELIN', 'EKSKLUSIVT'],    capacity: 'Op til 100', price: 'Fra DKK 89.000', cat: 'byrestaurant' },
  { id: 'vineyard',  name: 'Villaen i Vineyard',   location: 'Faxe · Sydsjælland', image: 'olive'    as const, quote: 'Lugt af solskin og oliventræer',      tags: ['VINGÅRD', 'PRIVAT HAVE'],                capacity: 'Op til 80',  price: 'Fra DKK 44.000', cat: 'villa' },
];

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — venue discovery only
══════════════════════════════════════════════════════════════════════ */
export default function VenueDiscovery({ onNavigate }: { onNavigate?: (s: ScreenId) => void }) {
  type VView = 'swipe' | 'dna' | 'picks';
  const [vview, setVView] = useState<VView>(() =>
    sessionStorage.getItem('kalas_dna') === 'done' ? 'picks' : 'swipe'
  );
  const [cat, setCat] = useState<Category | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [sent,  setSent]  = useState<Set<string>>(new Set());
  const [booked, setBooked] = useState<string | null>(null);

  const toggleSave  = (id: string) => setSaved((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const reqOutreach = (id: string) => { setSent((p) => new Set(p).add(id)); setSaved((p) => new Set(p).add(id)); };
  const handleDNADone = () => { sessionStorage.setItem('kalas_dna', 'done'); setVView('dna'); };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {!cat ? (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnimatePresence mode="wait">
              {vview === 'swipe' && <SwipeView key="swipe" onDone={handleDNADone} />}
              {vview === 'dna'   && <DNAView   key="dna"   onContinue={() => setVView('picks')} />}
              {vview === 'picks' && (
                <PicksView key="picks"
                  saved={saved} sent={sent} booked={booked}
                  onToggleSave={toggleSave} onOutreach={reqOutreach}
                  onBook={(id) => setBooked(id)}
                  onBrowseCategory={(c) => setCat(c)}
                  onAva={() => onNavigate?.('ava')}
                  onNextStep={() => onNavigate?.('vendors')} />
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <CategoryDetail key={cat.id} category={cat} onBack={() => setCat(null)}
            saved={saved} sent={sent} onToggleSave={toggleSave} onOutreach={reqOutreach} />
        )}
      </AnimatePresence>

      <OnboardingHint id="venues" />

      {/* ── Floating saved bar ──────────────────────────────────────── */}
      <AnimatePresence>
        {saved.size >= 1 && !cat && vview === 'picks' && (
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
   SWIPE VIEW
═══════════════════════════════════════════════════════════════════════ */
function SwipeView({ onDone }: { onDone: () => void }) {
  const [deck, setDeck] = useState<SwipeCard[]>([...SWIPE_DECK]);
  const [liked, setLiked] = useState(0);
  const total = SWIPE_DECK.length;
  const done  = deck.length === 0;
  const current = deck[0];

  const advance = (like: boolean) => {
    if (like) setLiked((n) => n + 1);
    setDeck((d) => d.slice(1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="px-6 pt-8 pb-12 sm:px-10 lg:px-16">

      <Eyebrow>Ava</Eyebrow>
      <p className="font-serif text-[1.2rem] italic text-ink-soft mt-1.5">
        "Hjælp mig med at forstå jeres stil."
      </p>
      <p className="mt-2 text-[0.82rem] text-muted">Swipe igennem disse bryllupsstile — Ava tracker alt.</p>

      <div className="relative mx-auto mt-8" style={{ maxWidth: 360, height: 460 }}>
        {deck.slice(1, 3).map((card, i) => (
          <div key={card.id} className="absolute inset-0 overflow-hidden rounded-3xl"
            style={{ transform: `scale(${0.95 - i * 0.04}) translateY(${(i + 1) * 14}px)`, zIndex: 10 - i, opacity: 0.38 - i * 0.12 }}>
            <img src={IMAGES[card.image]} alt="" className="h-full w-full object-cover" />
          </div>
        ))}

        <AnimatePresence mode="popLayout">
          {!done ? (
            <DraggableCard key={current.id} card={current} onDecide={advance} />
          ) : (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-card px-8 text-center rule">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-tint">
                <Check size={22} className="text-ink" />
              </div>
              <h3 className="display mt-5 text-[1.9rem] text-ink">{liked} stilarter liket</h3>
              <p className="mt-2 text-[0.88rem] text-ink-soft leading-relaxed max-w-[200px]">
                Ava har nok til at forstå jeres stil og moodboard.
              </p>
              <Pill onClick={onDone} arrow className="mt-7">Se jeres stilprofil</Pill>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-7 mx-auto" style={{ maxWidth: 360 }}>
        <div className="flex gap-1">
          {SWIPE_DECK.map((_, i) => (
            <div key={i} className={cn('h-0.5 flex-1 rounded-full transition-colors',
              i < (total - deck.length) ? 'bg-sage' : 'bg-shell')} />
          ))}
        </div>
        <p className="mt-2 text-center text-[0.72rem] text-muted">{total - deck.length} / {total}</p>
      </div>

      {!done && (
        <div className="mt-6 flex items-center justify-center gap-6">
          <button onClick={() => advance(false)}
            className="flex h-14 w-14 items-center justify-center rounded-full rule bg-canvas text-muted hover:text-ink hover:bg-card transition-all cursor-pointer shadow-[0_4px_20px_rgba(58,79,55,0.08)]">
            <X size={22} />
          </button>
          <div className="text-center min-w-[120px]">
            <p className="font-serif text-[1.05rem] text-ink">{current?.label}</p>
            <p className="text-[0.76rem] text-muted mt-0.5">{current?.sub}</p>
          </div>
          <button onClick={() => advance(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-ink hover:bg-sage-strong transition-all cursor-pointer shadow-[0_8px_24px_rgba(174,176,128,0.35)]">
            <Heart size={20} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

function DraggableCard({ card, onDecide }: { card: SwipeCard; onDecide: (like: boolean) => void }) {
  const x = useMotionValue(0);
  const rotate  = useTransform(x, [-200, 200], [-12, 12]);
  const likeOp  = useTransform(x, [25, 110], [0, 1]);
  const nopeOp  = useTransform(x, [-110, -25], [1, 0]);

  return (
    <motion.div
      style={{ x, rotate, zIndex: 20 }}
      drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.85}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) onDecide(true);
        else if (info.offset.x < -100) onDecide(false);
      }}
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 cursor-grab overflow-hidden rounded-3xl active:cursor-grabbing">
      <img src={IMAGES[card.image]} alt={card.label} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a2215e8] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
      <motion.div style={{ opacity: likeOp }}
        className="absolute left-5 top-6 rounded-full border-2 border-sage bg-sage/20 px-3.5 py-1.5 backdrop-blur-sm">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-canvas">Elsker</span>
      </motion.div>
      <motion.div style={{ opacity: nopeOp }}
        className="absolute right-5 top-6 rounded-full border-2 border-canvas/60 bg-canvas/10 px-3.5 py-1.5 backdrop-blur-sm">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-canvas">Skip</span>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DNA VIEW
═══════════════════════════════════════════════════════════════════════ */
function DNAView({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="px-6 py-10 sm:px-10 lg:px-16">

      <Eyebrow>Jeres Stilprofil</Eyebrow>
      <h2 className="display mt-3 text-[clamp(2.5rem,5vw,4rem)] text-ink">
        Lavet af <span className="italic">Ava.</span>
      </h2>
      <p className="mt-3 text-[0.88rem] text-muted">Baseret på jeres swipes og moodboard</p>

      <div className="mt-10 space-y-5 max-w-lg">
        {dnaTraits.map((trait, i) => (
          <motion.div key={trait.label}
            initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-serif text-[1.05rem] text-ink">{trait.label}</span>
              <span className="text-[0.74rem] font-medium text-ink-soft tabular-nums">{trait.pct}%</span>
            </div>
            <div className="h-[3px] w-full rounded-full bg-shell overflow-hidden">
              <motion.div className="h-full rounded-full bg-sage"
                initial={{ width: 0 }}
                whileInView={{ width: `${trait.pct}%` }} viewport={{ once: true }}
                transition={{ duration: 1.1, delay: i * 0.1 + 0.15, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-14">
        <Eyebrow>Jeres moodboard</Eyebrow>
        <p className="mt-1 text-[0.82rem] text-muted">Baseret på jeres valg.</p>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {moodboard.slice(0, 4).map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.4 + i * 0.07 }}
              className="aspect-square overflow-hidden rounded-xl">
              <Bleed src={item.image} alt={item.caption} className="h-full w-full" />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <Pill arrow onClick={onContinue}>Se venues der passer til jer</Pill>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PICKS VIEW
═══════════════════════════════════════════════════════════════════════ */
function PicksView({
  saved, sent, booked, onToggleSave, onOutreach, onBook, onBrowseCategory, onAva, onNextStep,
}: {
  saved: Set<string>; sent: Set<string>; booked: string | null;
  onToggleSave: (id: string) => void; onOutreach: (id: string) => void;
  onBook: (id: string) => void; onBrowseCategory: (c: Category) => void; onAva: () => void;
  onNextStep?: () => void;
}) {
  const [selectedVenue, setSelectedVenue] = useState<VenueRec | null>(null);
  const [comparing, setComparing] = useState(false);
  const venueCity = couple.region.includes(' · ')
    ? couple.region.split(' · ')[1].replace('nær ', '')
    : couple.region;
  const savedVenues = venueRecs.filter(v => saved.has(v.id));

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
          saved={saved.has(selectedVenue.id)}
          sent={sent.has(selectedVenue.id)}
          isBooked={booked === selectedVenue.id}
          onBack={() => setSelectedVenue(null)}
          onSave={() => onToggleSave(selectedVenue.id)}
          onContact={() => { onOutreach(selectedVenue.id); setSelectedVenue(null); }}
          onBook={() => onBook(selectedVenue.id)}
        />
      </AnimatePresence>
    );
  }

  const bookedVenue = booked ? venueRecs.find((v) => v.id === booked) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>

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

      {/* ── Gemte venues ─────────────────────────────────────────────── */}
      {savedVenues.length > 0 && (
        <div className="pt-8 pb-2">
          <div className="px-6 sm:px-10 lg:px-16 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart size={13} fill="currentColor" className="text-ink" />
              <span className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink">
                Gemte venues · {savedVenues.length}
              </span>
            </div>
            {savedVenues.length >= 2 ? (
              <button onClick={() => setComparing(true)}
                className="text-[0.72rem] font-medium text-ink hover:opacity-60 transition-opacity cursor-pointer">
                Sammenlign ({savedVenues.length}) →
              </button>
            ) : (
              <button onClick={() => onAva()}
                className="text-[0.72rem] text-muted hover:text-ink transition-colors cursor-pointer">
                Spørg Ava om disse →
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 sm:px-10 lg:px-16 pb-1 hide-scrollbar">
            {savedVenues.map(v => (
              <motion.button
                key={v.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedVenue(v)}
                className="relative shrink-0 w-44 h-28 rounded-2xl overflow-hidden cursor-pointer group">
                <img src={IMAGES[v.image]} alt={v.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2215cc] via-[#1a221540] to-transparent" />
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSave(v.id); }}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-canvas/90 cursor-pointer">
                  <Heart size={11} fill="currentColor" className="text-ink" />
                </button>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-[0.72rem] font-medium text-canvas leading-tight truncate">{v.name}</p>
                  <p className="text-[0.62rem] text-canvas/70 mt-0.5">{v.match}% match</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Ava memory intro */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 pt-8 sm:px-10 lg:px-16">
        <div className="rule rounded-2xl bg-card px-6 py-5 flex items-center justify-between gap-6">
          <div>
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-muted mb-1.5">
              K · Ava
            </p>
            <p className="font-serif text-[1.35rem] text-ink italic leading-snug">
              "Baseret på jeres {couple.guests} gæster nær {venueCity} og en{' '}
              {dnaTraits[0]?.label.toLowerCase()} — her er mine bedste valg til jer."
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Kalas Partner venues ──────────────────────────────────────── */}
      <div className="px-6 pt-10 sm:px-10 lg:px-16">
        <div className="flex items-center gap-2 mb-4">
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-canvas">Kalas Partner</span>
          <span className="text-[0.72rem] text-muted">Venues der aktivt samarbejder med Kalas</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {venueRecs.filter(v => ['villa-cph','kokkedal'].includes(v.id)).map((v, i) => (
            <motion.button key={v.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelectedVenue(v)}
              className="group relative h-36 overflow-hidden rounded-2xl cursor-pointer text-left">
              <img src={IMAGES[v.image]} alt={v.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2215e6] via-[#1a221540] to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="rounded-full bg-canvas/90 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink">● Partner</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-serif text-[1rem] text-canvas leading-tight">{v.name}</p>
                <p className="mt-0.5 text-[0.7rem] text-canvas/70">{v.location}</p>
                <p className="mt-1.5 text-[0.65rem] font-medium text-canvas/50 uppercase tracking-[0.12em]">Svar typisk inden 2 timer</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Venue carousel */}
      <div className="pt-12">
        <VenueCarousel venues={venueRecs}
          saved={saved} sent={sent} booked={booked}
          onToggleSave={onToggleSave} onOutreach={onOutreach} onBook={onBook}
          onSelect={setSelectedVenue} />
      </div>

      {/* Ask Ava */}
      <div className="px-6 pt-14 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rule rounded-2xl bg-card p-8 text-center">
          <Eyebrow className="text-center">Spørg Ava</Eyebrow>
          <p className="display mt-4 text-[1.9rem] text-ink italic">
            "Which one feels most romantic?"
          </p>
          <p className="mt-3 text-[0.85rem] text-muted">Ava kender jeres profil og kan sammenligne med nuance.</p>
          <div className="mt-6 flex justify-center">
            <Pill arrow onClick={onAva}><MessageCircle size={14} /> Tal med Ava</Pill>
          </div>
        </motion.div>
      </div>

      {/* Category browse */}
      <div className="px-6 pt-16 pb-12 sm:px-10 lg:px-16">
        <Eyebrow>Browse efter stil</Eyebrow>
        <h3 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-ink">
          Udforsk venues i <span className="italic">{venueCity}</span>
        </h3>
        <p className="mt-3 max-w-md text-ink-soft leading-relaxed">Otte retninger — fra rå lader til glashuse.</p>

        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {CATEGORIES.map((cat, i) => (
            <motion.button key={cat.id}
              initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onBrowseCategory(cat)}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl cursor-pointer">
              <img src={IMAGES[cat.image]} alt={cat.name}
                className="h-full w-full object-cover transition-transform duration-[1.3s] ease-out group-hover:scale-[1.07]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2215e8] via-[#1a221520] to-transparent" />
              <div className="absolute left-3 top-3 rounded-full bg-canvas/90 px-2.5 py-1 backdrop-blur-sm">
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink">{cat.count} steder</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h4 className="display text-[1.3rem] text-canvas leading-tight">{cat.name}</h4>
                <p className="mt-1 font-serif text-[0.8rem] italic text-canvas/65">{cat.tagline}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

    </motion.div>
  );
}

/* ── Per-venue extra data ─────────────────────────────────────────────── */
const VENUE_GALLERY: Record<string, Array<keyof typeof IMAGES>> = {
  'villa-cph': ['florals', 'ceremony', 'longTable', 'candles'],
  'kokkedal':  ['arch',    'barn',     'olive',     'portrait'],
  'nimb':      ['candles', 'rings',    'ceremony',  'florals'],
};

type PracticalItem = { key: string; value: string };
type PricePackage  = { name: string; desc: string; price: string; featured?: boolean };

type VenueExtra = {
  description: string;
  highlights: string[];
  practical?: PracticalItem[];
  packages?: PricePackage[];
  directions?: string;
};

const DEFAULT_PRACTICAL: PracticalItem[] = [
  { key: 'Min. udlejning',  value: 'Fredag–søndag' },
  { key: 'Adgang',          value: 'Fra fredag kl. 14' },
  { key: 'Catering',        value: 'Frit valg' },
  { key: 'Parkering',       value: 'Inkluderet' },
  { key: 'Vielsesceremoni', value: 'Mulig på stedet' },
  { key: 'Overnatning',     value: 'Se med venue' },
];

const DEFAULT_PACKAGES: PricePackage[] = [
  { name: 'Basis',    desc: 'Lokaler + opstilling',          price: 'Fra DKK 45.000' },
  { name: 'Weekend',  desc: 'Inkl. fredag–søndag + service', price: 'Fra DKK 65.000', featured: true },
  { name: 'Privat',   desc: 'Eksklusiv adgang 3 dage',       price: 'Fra DKK 88.000' },
];

const VENUE_EXTRA: Record<string, VenueExtra> = {
  'villa-cph': {
    description:
      'Villa Copenhagen er Københavns mest intime luksushotel — gemt i en fredet postbygning i centrum. Kvelvet loft, natursten og blødt lys giver en scenografi, der kræver ingen dekoration.',
    highlights: [
      'Eksklusivt brug af hotellet hele natten',
      'Michelinkøkken på stedet',
      'Lys og rum optimeret til reportagefotografi',
      'Bryllupsværelse til brudeparret inkluderet',
      'Gæsteparkering under bygningen',
      'Kapacitet til 200 til reception og 120 til middag',
    ],
    practical: [
      { key: 'Min. udlejning',  value: 'Fredag aften–lørdag' },
      { key: 'Adgang',          value: 'Fra torsdag kl. 16' },
      { key: 'Catering',        value: 'Michelin-køkken, eksklusivt' },
      { key: 'Parkering',       value: '80 pladser i kælder' },
      { key: 'Overnatning',     value: '77 rum på hotellet' },
      { key: 'Vielsesceremoni', value: 'Indendørs kapel' },
    ],
    packages: [
      { name: 'Signature',  desc: 'Ceremonisal + middag',               price: 'Fra DKK 72.000' },
      { name: 'Exclusive',  desc: 'Hele hotellet + morgenmad dagen efter', price: 'Fra DKK 115.000', featured: true },
      { name: 'Intimate',   desc: 'Op til 60 gæster, intim stil',        price: 'Fra DKK 54.000' },
    ],
    directions: '5 min gang fra Rådhuspladsen · Metro Kongens Nytorv 8 min',
  },
  'kokkedal': {
    description:
      'Kokkedal Slot byder på historiske saloner og en slotspark i Nordsjællands skovlandskab. Med 24 overnatningsrum er det ideelt for gæster fra hele landet — et bryllup der strækker sig over to dage.',
    highlights: [
      '24 overnatningsrum på stedet',
      'Botanisk slotspark med unikke fotosteder',
      'Egen vinkælder fra 1800-tallet',
      'Åbent for eksklusive weekendbookinger',
      'Ceremonirum med fri udsigt til parken',
      'Privat chef inkluderet i weekendpakken',
    ],
    practical: [
      { key: 'Min. udlejning',  value: 'Fredag–søndag' },
      { key: 'Adgang',          value: 'Fra torsdag kl. 12' },
      { key: 'Catering',        value: 'Eget køkken, eksklusivt' },
      { key: 'Parkering',       value: '120 pladser gratis' },
      { key: 'Overnatning',     value: '24 rum på slottet' },
      { key: 'Vielsesceremoni', value: 'Slotskapel + have' },
    ],
    packages: [
      { name: 'Slot',      desc: 'Ceremoni + middag i salen',         price: 'Fra DKK 62.000' },
      { name: 'Weekend',   desc: 'Fredag–søndag, alle 24 rum inkl.',  price: 'Fra DKK 95.000', featured: true },
      { name: 'Intim',     desc: 'Op til 50 gæster i lille salon',    price: 'Fra DKK 48.000' },
    ],
    directions: '45 min fra Kbh H · S-tog til Allerød + taxa · Gratis parkering',
  },
  'nimb': {
    description:
      'Nimb Terrasse hæver sig over Tivolis tage med en udsigt, der kun findes ét sted i København. Michelin-kokke fra Nimb Hotel har cateringansvaret, og gæsterne ser fyrværkeriet fra terrassen.',
    highlights: [
      'Panoramaudsigt over Tivoli og byen',
      'Michelin catering inkluderet i prisen',
      'Eksklusiv booking — ingen andre gæster',
      'Terrasse til velkomstdrinks med udsigt',
      'Adgang til Tivoli for alle gæster',
      'Privat indgang og cocktailbar',
    ],
    practical: [
      { key: 'Min. udlejning',  value: 'Lørdag aften' },
      { key: 'Adgang',          value: 'Fra kl. 17 om aftenen' },
      { key: 'Catering',        value: 'Michelin, inkluderet' },
      { key: 'Parkering',       value: 'P-hus 3 min gang' },
      { key: 'Overnatning',     value: 'Nimb Hotel, på stedet' },
      { key: 'Vielsesceremoni', value: 'Terrassen, eksklusivt' },
    ],
    packages: [
      { name: 'Evening',   desc: 'Middag + terrasse, 4 timer',         price: 'Fra DKK 79.000' },
      { name: 'Full Nimb', desc: 'Hele terrassen + Tivoli-adgang',     price: 'Fra DKK 109.000', featured: true },
      { name: 'Intimate',  desc: 'Op til 60 gæster, intim opstilling', price: 'Fra DKK 64.000' },
    ],
    directions: 'Rådhuspladsen · Metro + S-tog · Valet parkering tilbydes',
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   VENUE COMPARISON VIEW
═══════════════════════════════════════════════════════════════════════ */
function ComparisonView({
  venues, saved, booked, onBack, onToggleSave, onBook,
}: {
  venues: VenueRec[]; saved: Set<string>; booked: string | null;
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
                  <img src={IMAGES[v.image]} alt={v.name}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a221580] to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full bg-sage px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink">
                    {v.match}% match
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
   VENUE DETAIL PAGE
═══════════════════════════════════════════════════════════════════════ */
function VenueDetail({
  venue, saved, sent, isBooked, onBack, onSave, onContact, onBook,
}: {
  venue: VenueRec; saved: boolean; sent: boolean; isBooked: boolean;
  onBack: () => void; onSave: () => void; onContact: () => void; onBook: () => void;
}) {
  const [notes, setNotes]         = useState('');
  const [activePackage, setPkg]   = useState<number | null>(null);
  const gallery  = VENUE_GALLERY[venue.id] ?? ['ceremony', 'florals', 'longTable', 'candles'];
  const extra    = VENUE_EXTRA[venue.id]   ?? { description: venue.quote, highlights: venue.why };
  const practical = extra.practical ?? DEFAULT_PRACTICAL;
  const packages  = extra.packages  ?? DEFAULT_PACKAGES;

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
        <motion.button whileTap={{ scale: 0.88 }} onClick={onSave}
          className={cn('flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[0.8rem] font-medium rule transition-all',
            saved ? 'bg-sage-tint text-ink' : 'bg-canvas text-ink hover:bg-card')}>
          <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
          {saved ? 'Gemt' : 'Gem'}
        </motion.button>
      </div>

      {/* ── Photo grid ────────────────────────────────────────────── */}
      <div className="grid gap-1 sm:grid-cols-[2fr_1fr_1fr] sm:grid-rows-2 h-[300px] sm:h-[460px]">
        <div className="relative overflow-hidden sm:row-span-2">
          <img src={IMAGES[venue.image]} alt={venue.name}
            className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-canvas/90 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-[0.68rem] font-medium text-ink">{gallery.length + 1} billeder</span>
          </div>
        </div>
        {gallery.slice(0, 4).map((key, i) => (
          <div key={i} className="relative hidden overflow-hidden sm:block">
            <img src={IMAGES[key]} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          </div>
        ))}
      </div>

      {/* ── Main info ─────────────────────────────────────────────── */}
      <div className="px-6 pt-8 sm:px-10 lg:px-16">

        {/* Match badge + name */}
        <div className="flex flex-wrap items-start gap-3">
          <span className="inline-flex items-center rounded-full bg-sage px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink">
            {venue.match}% Stil-match · Ava Pick
          </span>
        </div>
        <h1 className="display mt-3 text-[clamp(2.4rem,5vw,4rem)] text-ink">{venue.name}</h1>
        <p className="mt-1 text-[0.88rem] text-muted">{venue.location}</p>
        {extra.directions && (
          <p className="mt-1 text-[0.8rem] text-muted/70">{extra.directions}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {venue.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-shell px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.09em] text-muted">
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="mt-7 max-w-2xl text-[1.02rem] leading-relaxed text-ink-soft">{extra.description}</p>

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
            <Eyebrow className="!text-canvas/50">Stil-match</Eyebrow>
            <p className="mt-1.5 font-serif text-[1.4rem] leading-none text-canvas">{venue.match}%</p>
          </div>
        </div>

        {/* Praktisk info */}
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

        {/* Highlights */}
        <div className="mt-10 rule-t pt-8">
          <Eyebrow>Faciliteter & fordele</Eyebrow>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {extra.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-sage" />
                <span className="text-[0.92rem] text-ink-soft leading-snug">{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Priser & pakker */}
        <div className="mt-10 rule-t pt-8">
          <Eyebrow>Priser & pakker</Eyebrow>
          <p className="mt-1 text-[0.8rem] text-muted">Alle priser ekskl. moms · Kalas forhandler på jeres vegne.</p>
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

        {/* Ava's analysis */}
        <div className="mt-10 rule-t pt-8">
          <Eyebrow>Avas analyse</Eyebrow>
          <div className="mt-5 rounded-2xl bg-card rule p-6">
            <blockquote className="font-serif text-[1.2rem] italic leading-relaxed text-ink">
              "{venue.quote}"
            </blockquote>
            <ul className="mt-5 space-y-3 rule-t pt-5">
              {venue.why.map((reason) => (
                <li key={reason} className="flex items-start gap-3">
                  <Check size={13} className="mt-1 shrink-0 text-sage" />
                  <span className="text-[0.9rem] text-ink-soft leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Similar venues */}
        <div className="mt-10 rule-t pt-8">
          <Eyebrow>Lignende venues</Eyebrow>
          <div className="mt-5 flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {venueRecs.filter((v) => v.id !== venue.id).slice(0, 3).map((v) => (
              <div key={v.id}
                className="relative shrink-0 overflow-hidden rounded-xl cursor-default"
                style={{ width: 'min(180px, 45vw)', aspectRatio: '3/4' }}>
                <img src={IMAGES[v.image]} alt={v.name}
                  className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2215e8] via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="font-serif text-[0.95rem] leading-tight text-canvas">{v.name}</p>
                  <p className="mt-0.5 text-[0.65rem] text-canvas/55">{v.match}% match</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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

/* ═══════════════════════════════════════════════════════════════════════
   VENUE CAROUSEL  (Gallery4-style horizontal scroll)
═══════════════════════════════════════════════════════════════════════ */
function VenueCarousel({
  venues, saved, sent, booked, onToggleSave, onOutreach, onBook, onSelect,
}: {
  venues: VenueRec[]; saved: Set<string>; sent: Set<string>; booked: string | null;
  onToggleSave: (id: string) => void; onOutreach: (id: string) => void; onBook: (id: string) => void;
  onSelect: (v: VenueRec) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const track = () => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const cardW = card ? card.offsetWidth + 20 : 360;
    const idx = Math.round(el.scrollLeft / cardW);
    setCurrent(Math.max(0, Math.min(idx, venues.length - 1)));
    setCanPrev(el.scrollLeft > 10);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', track, { passive: true });
    track();
    return () => el.removeEventListener('scroll', track);
  }, []);

  const scrollTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll('[data-card]');
    const card = cards[i] as HTMLElement | undefined;
    if (card) el.scrollTo({ left: card.offsetLeft - 24, behavior: 'smooth' });
    setCurrent(i);
  };

  return (
    <div>
      <div className="flex items-end justify-between px-6 sm:px-10 lg:px-16">
        <div>
          <Eyebrow>Ava Picks</Eyebrow>
          <h2 className="display mt-3 text-[clamp(2.2rem,5vw,3.8rem)] text-ink">
            Venues der <span className="italic">passer til jer.</span>
          </h2>
          <p className="mt-3 max-w-md text-ink-soft">
            Ava har screenet 200+ steder baseret på jeres stilprofil, moodboard og gæsteantal.
          </p>
        </div>
        <div className="hidden md:flex shrink-0 items-center gap-1.5 pb-1 ml-6">
          <button onClick={() => scrollTo(Math.max(0, current - 1))} disabled={!canPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full rule hover:bg-card disabled:opacity-30 disabled:cursor-default transition-all cursor-pointer">
            <ArrowLeft size={16} />
          </button>
          <button onClick={() => scrollTo(Math.min(venues.length - 1, current + 1))} disabled={!canNext}
            className="flex h-10 w-10 items-center justify-center rounded-full rule hover:bg-card disabled:opacity-30 disabled:cursor-default transition-all cursor-pointer">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef}
        className="mt-8 flex gap-5 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2 pl-6 sm:pl-10 lg:pl-16 [scroll-padding-left:1.5rem] sm:[scroll-padding-left:2.5rem] lg:[scroll-padding-left:4rem]">
        {venues.map((venue, i) => (
          <VenueCard key={venue.id} venue={venue} index={i}
            saved={saved.has(venue.id)} sent={sent.has(venue.id)} isBooked={booked === venue.id}
            onToggleSave={() => onToggleSave(venue.id)}
            onOutreach={() => onOutreach(venue.id)}
            onBook={() => onBook(venue.id)}
            onSelect={() => onSelect(venue)} />
        ))}
        <div className="shrink-0 w-6 sm:w-10 lg:w-16" aria-hidden />
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {venues.map((_, i) => (
          <button key={i} onClick={() => scrollTo(i)} aria-label={`Venue ${i + 1}`}
            className={cn('rounded-full transition-all duration-300 cursor-pointer',
              i === current ? 'w-6 h-1.5 bg-ink' : 'w-1.5 h-1.5 bg-shell hover:bg-muted')} />
        ))}
      </div>
    </div>
  );
}

/* ── Full-bleed venue card ────────────────────────────────────────────── */
function VenueCard({
  venue, index, saved, sent, isBooked, onToggleSave, onOutreach, onBook, onSelect,
}: {
  venue: VenueRec; index: number; saved: boolean; sent: boolean; isBooked: boolean;
  onToggleSave: () => void; onOutreach: () => void; onBook: () => void; onSelect: () => void;
}) {
  return (
    <motion.div
      data-card
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.65, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="relative shrink-0 snap-start overflow-hidden rounded-2xl"
      style={{ width: 'min(320px, 82vw)', minHeight: '27rem' }}>

      <img src={IMAGES[venue.image]} alt={venue.name}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[2s] hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a2215f2] via-[#1a221550] to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />

      <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
        <span className="rounded-full bg-sage px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink">
          {venue.match}% Match
        </span>
        <motion.button whileTap={{ scale: 0.85 }} onClick={onToggleSave}
          className={cn('flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-all cursor-pointer',
            saved ? 'bg-sage text-ink' : 'bg-canvas/20 text-canvas hover:bg-canvas/30')}>
          <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
        </motion.button>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="eyebrow text-canvas/50">Ava Pick · {String(index + 1).padStart(2, '0')}</p>
        <h3 className="display mt-2 text-[1.7rem] leading-tight text-canvas">{venue.name}</h3>
        <p className="mt-1 text-[0.75rem] text-canvas/55">{venue.location}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {venue.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full border border-canvas/20 bg-canvas/10 px-2.5 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.12em] text-canvas/80 backdrop-blur-sm">{tag}</span>
          ))}
        </div>

        <ul className="mt-4 space-y-1.5">
          {venue.why.slice(0, 2).map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-[0.81rem] text-canvas/80 leading-snug">
              <Check size={12} className="mt-0.5 shrink-0 text-sage" /> {reason}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-end gap-4 border-t border-canvas/15 pt-4">
          <div className="flex-1">
            <p className="eyebrow text-canvas/45">Pris</p>
            <p className="mt-0.5 font-serif text-[1.05rem] leading-none text-canvas">{venue.price}</p>
          </div>
          <div className="flex-1">
            <p className="eyebrow text-canvas/45">Kapacitet</p>
            <p className="mt-0.5 font-serif text-[1.05rem] leading-none text-canvas">{venue.capacity}</p>
          </div>

          <AnimatePresence mode="wait">
            {isBooked ? (
              <motion.div key="booked" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-sage/90 px-3 py-1.5 text-[0.7rem] font-medium text-ink">
                <Check size={11} /> Booket
              </motion.div>
            ) : sent ? (
              <motion.button key="book" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onBook}
                className="shrink-0 rounded-full bg-canvas/20 backdrop-blur-sm px-3 py-1.5 text-[0.7rem] font-medium text-canvas hover:bg-canvas/35 transition-colors cursor-pointer">
                Book →
              </motion.button>
            ) : (
              <motion.button key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onSelect}
                className="shrink-0 rounded-full bg-canvas/90 px-3 py-1.5 text-[0.7rem] font-medium text-ink hover:bg-canvas transition-colors cursor-pointer">
                Se venue →
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {sent && !isBooked && (
          <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-canvas/55">
            <Check size={10} className="text-sage" /> Ava forbereder forespørgsel…
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CATEGORY DETAIL
═══════════════════════════════════════════════════════════════════════ */
function CategoryDetail({
  category, onBack, saved, sent, onToggleSave, onOutreach,
}: {
  category: Category; onBack: () => void;
  saved: Set<string>; sent: Set<string>;
  onToggleSave: (id: string) => void; onOutreach: (id: string) => void;
}) {
  const venues = CATEGORY_VENUES.filter((v) => v.cat === category.id);
  const display = venues.length ? venues : CATEGORY_VENUES;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="px-6 py-8 sm:px-10 lg:px-16">
      <button onClick={onBack}
        className="flex items-center gap-2 eyebrow hover:text-ink transition-colors cursor-pointer mb-8">
        <ArrowLeft size={13} /> Alle stilarter
      </button>
      <Eyebrow>{category.name} · {category.count} steder</Eyebrow>
      <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-ink italic">{category.tagline}</h2>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {display.map((v, i) => (
          <motion.div key={v.id}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rule rounded-2xl">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={IMAGES[v.image]} alt={v.name}
                className="h-full w-full object-cover transition-transform duration-[1.5s] hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a221590] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-serif text-[0.85rem] italic text-canvas/90">"{v.quote}"</p>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-serif text-[1.45rem] text-ink">{v.name}</h3>
              <p className="mt-1 text-[0.78rem] text-muted">{v.location}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {v.tags.map((tag) => (
                  <span key={tag} className="rounded-full rule px-2.5 py-0.5 text-[0.59rem] font-medium uppercase tracking-[0.12em] text-ink-soft">{tag}</span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 rule-t pt-4">
                <div><p className="eyebrow">Kapacitet</p><p className="mt-1 font-serif text-[1.1rem] text-ink">{v.capacity}</p></div>
                <div><p className="eyebrow">Pris</p><p className="mt-1 font-serif text-[1.1rem] text-ink">{v.price}</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2.5 rule-t pt-4">
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => onToggleSave(v.id)}
                  className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full rule transition-all cursor-pointer',
                    saved.has(v.id) ? 'bg-sage text-ink' : 'text-muted hover:text-ink hover:bg-card')}>
                  <Heart size={15} fill={saved.has(v.id) ? 'currentColor' : 'none'} />
                </motion.button>
                <AnimatePresence mode="wait">
                  {sent.has(v.id) ? (
                    <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-1 items-center gap-2 rounded-full bg-sage-tint px-4 py-2.5 text-[0.78rem] text-ink">
                      <Check size={13} className="text-sage" /> Ava forbereder forespørgsel…
                    </motion.div>
                  ) : (
                    <motion.button key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => onOutreach(v.id)}
                      className="flex-1 rounded-full bg-ink px-4 py-2.5 text-center text-[0.75rem] font-medium uppercase tracking-[0.1em] text-canvas hover:bg-ink-soft transition-colors cursor-pointer">
                      Kontakt venue →
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
