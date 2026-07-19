import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, Check, MapPin, Star, Loader2, Expand } from 'lucide-react';
import type { OnboardingVenueSuggestion } from '@/app/api/onboarding/venues/route';
import { GUEST_BANDS } from '@/lib/onboarding';
import { cn } from '../ui';
import { useLang } from '../i18n';
import { Lightbox } from './Lightbox';

const CARD_H = 460;

type SwipeForm = {
  location: string;
  guestBand: string;
  lovedDestinations: string[];
  budgetAmount: number;
  budgetPrivate: boolean;
  likedVenues: OnboardingVenueSuggestion[];
};

type Props = {
  form: SwipeForm;
  onLike: (venue: OnboardingVenueSuggestion) => void;
  onSwipeComplete: () => void;
};

export default function VenueSwipeStep({ form, onLike, onSwipeComplete }: Props) {
  const { t, lang } = useLang();
  const [venues, setVenues] = useState<OnboardingVenueSuggestion[]>([]);
  const [deck, setDeck] = useState<OnboardingVenueSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const fetchedRef = useRef(false);

  const guestCount = GUEST_BANDS.find((b) => b.key === form.guestBand)?.count ?? 75;
  const likedCount = form.likedVenues.length;

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch('/api/onboarding/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: form.location,
          guest_count: guestCount,
          loved_destinations: form.lovedDestinations,
          budget: form.budgetPrivate ? null : String(form.budgetAmount),
          lang,
        }),
      });
      if (!res.ok) throw new Error('fetch failed');
      const data = (await res.json()) as { venues?: OnboardingVenueSuggestion[] };
      const list = data.venues ?? [];
      setVenues(list);
      setDeck(list);
      if (list.length === 0) onSwipeComplete();
    } catch {
      setFailed(true);
      onSwipeComplete();
    } finally {
      setLoading(false);
    }
  }, [
    form.location,
    form.lovedDestinations,
    form.budgetAmount,
    form.budgetPrivate,
    guestCount,
    lang,
  ]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void load();
  }, [load]);

  const total = venues.length;
  const done = deck.length === 0 && !loading;
  const current = deck[0];
  const swiped = total - deck.length;
  const allPhotos = current ? venuePhotos(current) : [];
  const extraPhotos = allPhotos.slice(1);

  // Fullscreen viewer — holds the index into the *full* photo set of the card.
  const [lightbox, setLightbox] = useState<number | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const advance = (like: boolean) => {
    if (!current) return;
    if (like) onLike(current);
    const next = deck.slice(1);
    setDeck(next);
    setLightbox(null);
    if (next.length === 0) onSwipeComplete();
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
        <Loader2 size={28} className="animate-spin text-[#173c32]" />
        <p className="font-serif text-[1.15rem] text-ink">{t('Ava finder venues til jer…')}</p>
        <p className="max-w-sm text-[0.85rem] text-muted">
          {t('Baseret på {location}, {guests} gæster og jeres gemte steder.', {
            location: form.location,
            guests: guestCount,
          })}
        </p>
      </div>
    );
  }

  if (failed || total === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif text-[1.2rem] text-ink">{t('Kunne ikke hente venues lige nu')}</p>
        <p className="max-w-sm text-[0.85rem] text-muted">{t('I kan fortsætte — Ava finder steder i appen bagefter.')}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-[var(--color-line-strong)] px-5 py-2.5 text-sm font-medium text-ink hover:bg-shell cursor-pointer"
        >
          {t('Prøv igen')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c755e]">{t('Stilen')}</p>
        <h2 className="mt-2 font-serif text-[clamp(1.6rem,4vw,2.25rem)] leading-tight tracking-[-0.02em] text-[#23351f]">
          {t('Swipe jeres drømmevenues')}
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-[#56645b]">
          {t('Højre for ja, venstre for nej — Ava lærer jeres smag af swipes.')}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        <div className="w-full shrink-0 lg:w-[min(400px,100%)]">
          <div className="relative mx-auto w-full max-w-[400px] lg:mx-0" style={{ height: CARD_H }}>
            {deck.slice(1, 3).map((card, i) => (
              <div
                key={card.id}
                className="absolute inset-0 overflow-hidden rounded-3xl"
                style={{
                  transform: `scale(${0.95 - i * 0.04}) translateY(${(i + 1) * 14}px)`,
                  zIndex: 10 - i,
                  opacity: 0.38 - i * 0.12,
                }}
              >
                {card.photo && <img src={card.photo} alt="" className="h-full w-full object-cover" />}
              </div>
            ))}

            <AnimatePresence mode="popLayout">
              {!done && current ? (
                <VenueCard
                  key={current.id}
                  venue={current}
                  onDecide={advance}
                  onExpand={() => setLightbox(0)}
                  t={t}
                />
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-[var(--color-line-strong)] bg-[#fffdf7] px-8 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-tint">
                    <Check size={22} className="text-ink" />
                  </div>
                  <h3 className="mt-5 font-serif text-[1.75rem] text-ink">
                    {t('{n} venues gemt', { n: likedCount })}
                  </h3>
                  <p className="mt-2 max-w-[220px] text-[0.88rem] leading-relaxed text-ink-soft">
                    {t('Ava bruger jeres valg til at finpudse forslag i Kalas.')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {!done && current && extraPhotos.length > 0 && (
          <VenuePhotoGallery
            key={current.id}
            photos={extraPhotos}
            onOpen={(i) => setLightbox(i + 1)}
            className="hidden min-w-0 flex-1 lg:block"
          />
        )}
      </div>

      {!done && current && extraPhotos.length > 0 && (
        <VenuePhotoGallery
          key={`${current.id}-m`}
          photos={extraPhotos}
          onOpen={(i) => setLightbox(i + 1)}
          className="mt-4 lg:hidden"
          compact
        />
      )}

      <div className="mx-auto mt-6 w-full max-w-[400px] lg:mx-0">
        <div className="h-1 overflow-hidden rounded-full bg-shell">
          <div
            className="h-full rounded-full bg-sage transition-all duration-300"
            style={{ width: total > 0 ? `${(swiped / total) * 100}%` : '0%' }}
          />
        </div>
        <p className="mt-2 text-center text-[0.72rem] text-muted lg:text-left">
          {swiped} / {total}
        </p>
      </div>

      {!done && current && (
        <div className="mx-auto mt-5 flex w-full max-w-[400px] items-center justify-center gap-8 lg:mx-0 lg:justify-between">
          <button
            type="button"
            onClick={() => advance(false)}
            aria-label={t('Nej')}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--color-line-strong)] bg-canvas text-muted shadow-sm transition-colors hover:text-ink cursor-pointer"
          >
            <X size={22} />
          </button>
          <button
            type="button"
            onClick={() => advance(true)}
            aria-label={t('Ja')}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage text-ink shadow-md transition-colors hover:bg-sage-strong cursor-pointer"
          >
            <Heart size={20} />
          </button>
        </div>
      )}

      {lightbox !== null && current && allPhotos.length > 0 && (
        <Lightbox
          photos={allPhotos}
          index={Math.min(lightbox, allPhotos.length - 1)}
          onIndex={setLightbox}
          onClose={closeLightbox}
          alt={current.name}
        />
      )}
    </div>
  );
}

function venuePhotos(venue: OnboardingVenueSuggestion): string[] {
  if (venue.photos?.length) return venue.photos;
  return venue.photo ? [venue.photo] : [];
}

function GalleryImage({
  url,
  onOpen,
  className,
}: {
  url: string;
  onOpen: () => void;
  className?: string;
}) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('Forstør billede')}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-[var(--color-line)] bg-shell shadow-[0_2px_10px_rgba(23,60,50,0.06)] transition-shadow hover:shadow-[0_10px_28px_rgba(23,60,50,0.16)] cursor-pointer',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#141a13]/0 transition-colors duration-300 group-hover:bg-[#141a13]/20" />
      <span className="pointer-events-none absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        <Expand size={15} />
      </span>
    </button>
  );
}

function VenuePhotoGallery({
  photos,
  onOpen,
  className,
  compact,
}: {
  photos: string[];
  onOpen: (index: number) => void;
  className?: string;
  compact?: boolean;
}) {
  if (photos.length === 0) return null;

  if (compact) {
    return (
      <div className={cn('flex gap-2.5 overflow-x-auto pb-1', className)}>
        {photos.map((url, i) => (
          <GalleryImage
            key={url}
            url={url}
            onOpen={() => onOpen(i)}
            className="h-28 w-40 shrink-0"
          />
        ))}
      </div>
    );
  }

  // `className` carries visibility/flex sizing from the parent (e.g. `lg:block`);
  // keep it OFF the grid element so it can't override `display:grid`. The inner
  // element owns the layout and matches the swipe card's height.
  const shots = photos.slice(0, 3);
  return (
    <div className={className}>
      <div
        className={cn(
          'grid gap-3',
          shots.length === 1 && 'grid-rows-1',
          shots.length === 2 && 'grid-rows-2',
          shots.length >= 3 && 'grid-cols-2 grid-rows-2',
        )}
        style={{ height: CARD_H }}
      >
        {shots.map((url, i) => (
          <GalleryImage
            key={url}
            url={url}
            onOpen={() => onOpen(i)}
            className={cn('h-full w-full min-h-0', shots.length >= 3 && i === 0 && 'row-span-2')}
          />
        ))}
      </div>
    </div>
  );
}

function VenueCard({
  venue,
  onDecide,
  onExpand,
  t,
}: {
  venue: OnboardingVenueSuggestion;
  onDecide: (like: boolean) => void;
  onExpand: () => void;
  t: (s: string, p?: Record<string, string | number>) => string;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOp = useTransform(x, [25, 110], [0, 1]);
  const nopeOp = useTransform(x, [-110, -25], [1, 0]);

  return (
    <motion.div
      style={{ x, rotate, zIndex: 20 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80 || info.velocity.x > 400) onDecide(true);
        else if (info.offset.x < -80 || info.velocity.x < -400) onDecide(false);
      }}
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 cursor-grab overflow-hidden rounded-3xl active:cursor-grabbing"
    >
      {venue.photo ? (
        <img src={venue.photo} alt={venue.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-sage-tint" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a2215e8] via-transparent to-transparent" />
      {venue.photo && (
        <button
          type="button"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          aria-label={t('Forstør billede')}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 cursor-pointer"
        >
          <Expand size={17} />
        </button>
      )}
      <motion.div
        style={{ opacity: likeOp }}
        className="absolute left-5 top-5 rounded-full border-2 border-sage bg-sage/25 px-4 py-1.5 backdrop-blur-sm"
      >
        <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-canvas">
          <Heart size={11} fill="currentColor" /> {t('Ja')}
        </span>
      </motion.div>
      <motion.div
        style={{ opacity: nopeOp }}
        className="absolute right-5 top-5 rounded-full border-2 border-canvas/50 bg-canvas/12 px-4 py-1.5 backdrop-blur-sm"
      >
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-canvas">{t('Nej')}</span>
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 p-6">
        {venue.rating != null && (
          <p className="mb-2 flex items-center gap-1.5 text-[0.72rem] font-medium text-canvas/80">
            <Star size={12} className="fill-[#d9a441] text-[#d9a441]" />
            {venue.rating.toFixed(1)}
            {venue.review_count != null && (
              <span className="text-canvas/60">· {venue.review_count} {t('anmeldelser')}</span>
            )}
          </p>
        )}
        <h3 className="font-serif text-[clamp(1.4rem,4vw,1.9rem)] leading-tight text-canvas">{venue.name}</h3>
        {venue.address && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[0.78rem] text-canvas/75">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{venue.address}</span>
          </p>
        )}
        {venue.why_fit && (
          <p className="mt-2 line-clamp-2 text-[0.8rem] leading-snug text-canvas/85">{venue.why_fit}</p>
        )}
      </div>
    </motion.div>
  );
}
