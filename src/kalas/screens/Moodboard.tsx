import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, Plus, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { IMAGES } from '../data';
import { Eyebrow, Pill, cn } from '../ui';
import OnboardingHint from '../OnboardingHint';
import { useWedding } from '../useWedding';

/* ── Inspiration swipe deck ──────────────────────────────────────────── */
const INSPO_DECK = [
  { id: 'i1',  label: 'Romantisk & Naturligt',  vibe: 'Blødt lys og vild natur',          image: 'lavender'  as keyof typeof IMAGES },
  { id: 'i2',  label: 'Klassisk Elegance',       vibe: 'Tidløst og raffineret',            image: 'arch'      as keyof typeof IMAGES },
  { id: 'i3',  label: 'Rustik Charme',           vibe: 'Rå teksturer og varme toner',      image: 'barn'      as keyof typeof IMAGES },
  { id: 'i4',  label: 'Stille Luksus',           vibe: 'Ro, stearinlys, enkle detaljer',   image: 'candles'   as keyof typeof IMAGES },
  { id: 'i5',  label: 'Botanisk & Grønt',        vibe: 'Levende planter og skov',          image: 'ceremony'  as keyof typeof IMAGES },
  { id: 'i6',  label: 'Bløde Blomster',          vibe: 'Pastel, sol og sommer',            image: 'florals'   as keyof typeof IMAGES },
  { id: 'i7',  label: 'Herregård & Park',        vibe: 'Historisk, stolt og smukt',        image: 'orangeri'  as keyof typeof IMAGES },
  { id: 'i8',  label: 'Lange Borde & Lys',       vibe: 'Intimt, varmt og nærværende',      image: 'longTable' as keyof typeof IMAGES },
  { id: 'i9',  label: 'Sydeuropæisk Sol',        vibe: 'Oliventræer, varme og frihed',     image: 'olive'     as keyof typeof IMAGES },
  { id: 'i10', label: 'Det Levende Øjeblik',     vibe: 'Dokumentarisk og ufiltreret',      image: 'portrait'  as keyof typeof IMAGES },
] as const;

type InspoCard = typeof INSPO_DECK[number];
type GridItem  =
  | { kind: 'liked';  card: InspoCard }
  | { kind: 'upload'; id: string; url: string };

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════════ */
const CARD_BY_IMAGE: Record<string, InspoCard> = Object.fromEntries(
  INSPO_DECK.map((c) => [c.image, c])
);

export default function Moodboard({ onNavigate }: { onNavigate?: (s: import('../Shell').ScreenId) => void }) {
  const { moodboardItems, addMoodboardItem, removeMoodboardItem } = useWedding();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<Array<{ id: string; url: string }>>([]);
  const [avaVisible, setAvaVisible] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // The liked board is the persisted moodboard, mapped back to inspo cards.
  const likedEntries = moodboardItems
    .filter((i) => i.image_key && CARD_BY_IMAGE[i.image_key])
    .map((i) => ({ dbId: i.id, card: CARD_BY_IMAGE[i.image_key as string] }));
  const liked: InspoCard[] = likedEntries.map((e) => e.card);
  const likedIds = new Set(liked.map((c) => c.id));

  const deck = INSPO_DECK.filter((c) => !likedIds.has(c.id) && !skipped.has(c.id));

  const total  = INSPO_DECK.length;
  const swiped = total - deck.length;
  const done   = deck.length === 0;

  const advance = (like: boolean) => {
    if (deck.length === 0) return;
    const card = deck[0];
    if (like) {
      void addMoodboardItem({ image_key: card.image, note: card.label });
    } else {
      setSkipped((prev) => new Set(prev).add(card.id));
    }
    const remaining = deck.length - 1;
    const nextLikedCount = liked.length + (like ? 1 : 0);
    if (remaining === 0 || nextLikedCount >= 3) {
      setTimeout(() => setAvaVisible(true), 500);
    }
  };

  // Keyboard swiping: ← skip, → elsker.
  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') advance(true);
      if (e.key === 'ArrowLeft')  advance(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const removeLiked  = (id: string)  => {
    const entry = likedEntries.find((e) => e.card.id === id);
    if (entry) void removeMoodboardItem(entry.dbId);
  };
  const removeUpload = (id: string) => setUploads((p) => p.filter((u) => u.id !== id));

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((f) => {
      const url = URL.createObjectURL(f);
      setUploads((p) => [...p, { id: `up-${Date.now()}-${Math.random()}`, url }]);
    });
    e.target.value = '';
  };

  const gridItems: GridItem[] = [
    ...liked.map((c)  => ({ kind: 'liked'  as const, card: c })),
    ...uploads.map((u) => ({ kind: 'upload' as const, id: u.id, url: u.url })),
  ];

  return (
    <div className="min-h-screen pb-20">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="px-6 pt-10 sm:px-10 lg:px-16">
        <Eyebrow>Moodboard · Stilanalyse</Eyebrow>
        <h1 className="display mt-3 text-[clamp(2.5rem,5vw,4rem)] text-ink">
          Find jeres <span className="italic">stil.</span>
        </h1>
        <p className="mt-3 max-w-md text-ink-soft leading-relaxed">
          Swipe jer igennem — Ava bygger automatisk jeres moodboard og opdaterer venue-forslag.
        </p>
      </div>

      {/* ── Swipe section ───────────────────────────────────────────── */}
      {!done ? (
        <div className="mt-10">
          {/* Progress */}
          <div className="mb-6 flex items-center gap-3 px-6 sm:px-10 lg:px-16">
            <div className="flex flex-1 gap-0.5">
              {INSPO_DECK.map((_, i) => (
                <div key={i} className={cn('h-0.5 flex-1 rounded-full transition-colors duration-300',
                  i < swiped ? 'bg-sage' : 'bg-shell')} />
              ))}
            </div>
            <span className="text-[0.72rem] text-muted tabular-nums shrink-0">{swiped}/{total}</span>
          </div>

          {/* Gallery4-style full-bleed card area */}
          <div className="w-full">
            {/* Card stack — edge-to-edge on mobile, centered on desktop */}
            <div className="relative mx-auto" style={{ maxWidth: 520, height: 'min(74vh, 520px)' }}>
              {/* Ghost cards behind */}
              {deck.slice(1, 3).map((card, i) => (
                <div key={card.id}
                  className="absolute inset-x-4 overflow-hidden rounded-2xl sm:inset-x-0"
                  style={{
                    bottom: 0, top: 0,
                    transform: `scale(${0.96 - i * 0.04}) translateY(${-(i + 1) * 12}px)`,
                    zIndex: 10 - i, opacity: 0.3 - i * 0.1,
                  }}>
                  <img src={IMAGES[card.image]} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(rgba(58,79,55,0) 0%, rgba(58,79,55,0.45) 60%, rgba(58,79,55,0.85) 100%)' }} />
                </div>
              ))}

              {/* Active draggable card */}
              <AnimatePresence mode="popLayout">
                <SwipeCard key={deck[0].id} card={deck[0]} onDecide={advance} />
              </AnimatePresence>
            </div>

            {/* Buttons row — below card */}
            <div className="mt-6 flex items-center justify-center gap-6 px-6">
              <button onClick={() => advance(false)}
                className="flex h-14 w-14 items-center justify-center rounded-full rule bg-canvas text-muted hover:text-ink hover:bg-card transition-all cursor-pointer shadow-[0_4px_20px_rgba(58,79,55,0.08)]">
                <X size={22} />
              </button>
              <div className="min-w-[150px] text-center">
                <p className="font-serif text-[1.15rem] text-ink">{deck[0].label}</p>
                <p className="mt-0.5 text-[0.78rem] text-muted">{deck[0].vibe}</p>
              </div>
              <button onClick={() => advance(true)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-ink hover:bg-sage-strong transition-all cursor-pointer shadow-[0_8px_28px_rgba(174,176,128,0.38)]">
                <Heart size={20} />
              </button>
            </div>
            <p className="mt-3 text-center text-[0.72rem] text-faint">Eller træk kortet til siden</p>
          </div>
        </div>
      ) : (
        <div className="mt-10 mx-6 rule rounded-2xl bg-card p-7 text-center sm:mx-10 lg:mx-16">
          <p className="font-serif text-[1.1rem] italic text-ink-soft">
            {liked.length === 0
              ? 'Ingen billeder liket — swipe igen eller upload dine egne nedenfor.'
              : `${liked.length} stilarter liket — Ava har bygget jeres profil.`}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {/* Restart the deck WITHOUT wiping the moodboard the couple built */}
            <Pill variant="ghost" onClick={() => setSkipped(new Set())}>
              Swipe igen
            </Pill>
            {liked.length > 0 && onNavigate && (
              <Pill arrow onClick={() => onNavigate('venues')}>
                Se venues der matcher
              </Pill>
            )}
          </div>
        </div>
      )}

      {/* ── Ava style analysis ──────────────────────────────────────── */}
      <AnimatePresence>
        {avaVisible && liked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 overflow-hidden rule rounded-2xl mx-6 sm:mx-10 lg:mx-16">

            {/* Collage strip — liked images side by side */}
            <div className="flex h-28 overflow-hidden">
              {liked.slice(0, 5).map((c) => (
                <div key={c.id} className="relative flex-1 overflow-hidden">
                  <img src={IMAGES[c.image]} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(rgba(58,79,55,0) 40%, rgba(58,79,55,0.4) 100%)' }} />
                </div>
              ))}
            </div>

            <div className="bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink mt-0.5">
                  <span className="font-serif text-[1.1rem] leading-none text-canvas">K</span>
                </div>
                <div className="flex-1">
                  <Eyebrow>Din stil ifølge Ava</Eyebrow>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {liked.slice(0, 4).map((c) => (
                      <span key={c.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sage-tint px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-ink">
                        <span className="h-1.5 w-1.5 rounded-full bg-sage" />{c.label}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 max-w-lg text-[0.88rem] text-ink-soft leading-relaxed">
                    Baseret på jeres valg ser Ava en stil der er{' '}
                    <strong className="text-ink">{liked[0]?.label.toLowerCase()}</strong>
                    {liked[1] ? <> med elementer af <strong className="text-ink">{liked[1].label.toLowerCase()}</strong></> : ''}.
                    {' '}Venue-forslag og fotografer er opdateret til at matche.
                  </p>
                  {onNavigate && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Pill arrow onClick={() => onNavigate('venues')}>Se venues der matcher</Pill>
                      <Pill variant="ghost" onClick={() => onNavigate('vendors')}>Fotografer i stilen</Pill>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Moodboard collage — everything together, at a glance ────── */}
      {gridItems.length > 0 && (
        <MoodCollage items={gridItems}
          onRemoveLiked={removeLiked} onRemoveUpload={removeUpload}
          onUpload={() => fileRef.current?.click()} />
      )}

      {/* ── Upload CTA — only when the moodboard is still empty
             (the gallery has its own upload slot once it exists) ──────── */}
      {gridItems.length === 0 && (
        <div className="mt-10 px-6 sm:px-10 lg:px-16">
          <button onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-card px-6 py-5 hover:bg-shell transition-colors cursor-pointer">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-tint">
              <Plus size={20} className="text-ink" />
            </div>
            <div className="text-left">
              <p className="font-medium text-ink">Tilføj egne billeder</p>
              <p className="mt-0.5 text-[0.78rem] text-muted">Fra Pinterest, Instagram eller din kamerarulle</p>
            </div>
            <ImageIcon size={17} className="ml-auto shrink-0 text-muted" />
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />

      {/* ── Empty moodboard placeholder ─────────────────────────────── */}
      {gridItems.length === 0 && (
        <div className="mt-12 px-6 sm:px-10 lg:px-16">
          <Eyebrow>Jeres moodboard</Eyebrow>
          <p className="mt-1.5 text-[0.85rem] text-muted">Like billeder eller upload egne — de samles her.</p>
          {/* Ghost grid */}
          <div className="mt-5 flex gap-3 overflow-hidden opacity-25 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn('shrink-0 overflow-hidden rounded-xl bg-shell',
                i % 2 === 0 ? 'h-48 w-36' : 'h-36 w-36')} />
            ))}
          </div>
        </div>
      )}

      <OnboardingHint id="inspiration" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MOODBOARD COLLAGE — masonry, everything visible at once
═══════════════════════════════════════════════════════════════════════ */
const COLLAGE_RATIOS = ['4/5', '1/1', '3/4', '4/3', '3/4', '1/1', '4/5', '4/3'];

function MoodCollage({
  items, onRemoveLiked, onRemoveUpload, onUpload,
}: {
  items: GridItem[];
  onRemoveLiked: (id: string) => void;
  onRemoveUpload: (id: string) => void;
  onUpload: () => void;
}) {
  return (
    <div className="mt-16 px-6 sm:px-10 lg:px-16">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <Eyebrow>Jeres moodboard · {items.length} {items.length === 1 ? 'billede' : 'billeder'}</Eyebrow>
          <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-ink">
            Jeres stil, <span className="italic">samlet.</span>
          </h2>
        </div>
        <button onClick={onUpload}
          className="hidden sm:flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-canvas hover:opacity-90 transition-opacity cursor-pointer"
          style={{ background: 'var(--color-terracotta)' }}>
          <Plus size={13} /> Tilføj billede
        </button>
      </div>

      {/* Masonry collage — CSS columns keep it dense and organic */}
      <div style={{ columns: '3 180px', columnGap: 12 }}>
        {items.map((item, i) => (
          <CollageTile key={item.kind === 'liked' ? item.card.id : item.id}
            item={item} index={i}
            onRemove={item.kind === 'liked'
              ? () => onRemoveLiked(item.card.id)
              : () => onRemoveUpload(item.id)} />
        ))}
        {/* Upload slot woven into the collage */}
        <button onClick={onUpload}
          className="group mb-3 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-line-strong)] bg-card/60 hover:bg-card transition-colors cursor-pointer"
          style={{ breakInside: 'avoid', aspectRatio: '4/5' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-tint group-hover:bg-sage transition-colors">
            <Plus size={18} className="text-ink" />
          </div>
          <span className="text-[0.75rem] font-medium text-ink">Tilføj billede</span>
        </button>
      </div>
    </div>
  );
}

function CollageTile({ item, index, onRemove }: { item: GridItem; index: number; onRemove: () => void }) {
  const src   = item.kind === 'liked' ? IMAGES[item.card.image] : item.url;
  const label = item.kind === 'liked' ? item.card.label : 'Eget billede';
  const ratio = COLLAGE_RATIOS[index % COLLAGE_RATIOS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="group relative mb-3 overflow-hidden rounded-xl"
      style={{ breakInside: 'avoid', aspectRatio: ratio }}>
      <img src={src} alt={label}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />

      {/* Quiet chrome — label + remove only on hover (always on touch via focus) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#3B432Aa6] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-[0.72rem] font-medium text-canvas leading-snug">{label}</p>
        {item.kind === 'liked' && (
          <p className="mt-0.5 flex items-center gap-1 text-[0.62rem] text-canvas/70">
            <Heart size={8} fill="currentColor" /> Fra jeres swipes
          </p>
        )}
      </div>
      <button onClick={onRemove} aria-label={`Fjern ${label}`}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-canvas/80 text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer">
        <X size={12} />
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DRAGGABLE SWIPE CARD
═══════════════════════════════════════════════════════════════════════ */
function SwipeCard({ card, onDecide }: { card: InspoCard; onDecide: (like: boolean) => void }) {
  const x      = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const likeOp = useTransform(x, [30, 110], [0, 1]);
  const nopeOp = useTransform(x, [-110, -30], [1, 0]);

  return (
    <motion.div
      style={{ x, rotate, zIndex: 20 }}
      drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.88}
      onDragEnd={(_, info) => {
        if (info.offset.x > 90)       onDecide(true);
        else if (info.offset.x < -90) onDecide(false);
      }}
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-4 bottom-0 top-0 cursor-grab overflow-hidden rounded-2xl active:cursor-grabbing select-none sm:inset-x-0">

      {/* Full-bleed image — Gallery4 style */}
      <img src={IMAGES[card.image]} alt={card.label}
        className="absolute h-full w-full object-cover object-center" />

      {/* Gallery4 gradient overlay: forest-tinted, transparent → tinted */}
      <div className="absolute inset-0 h-full"
        style={{ background: 'linear-gradient(rgba(58,79,55,0) 0%, rgba(58,79,55,0.38) 55%, rgba(58,79,55,0.82) 100%)' }} />

      {/* Top edge darkener */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

      {/* Like / Nope labels */}
      <motion.div style={{ opacity: likeOp }}
        className="absolute left-5 top-5 rounded-full border-2 border-sage bg-sage/25 px-4 py-1.5 backdrop-blur-sm">
        <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-canvas">
          <Heart size={11} fill="currentColor" /> Elsker
        </span>
      </motion.div>
      <motion.div style={{ opacity: nopeOp }}
        className="absolute right-5 top-5 rounded-full border-2 border-canvas/50 bg-canvas/12 px-4 py-1.5 backdrop-blur-sm">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-canvas">Skip</span>
      </motion.div>

      {/* Bottom — Gallery4 style: eyebrow + serif heading */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 md:p-8">
        <p className="eyebrow text-canvas/60 mb-2">{card.vibe}</p>
        <h2 className="display text-[clamp(1.6rem,4vw,2.2rem)] text-canvas leading-tight">{card.label}</h2>
        <p className="mt-2 text-[0.8rem] text-canvas/65">Swipe ← skip · swipe → elsker</p>
      </div>
    </motion.div>
  );
}
