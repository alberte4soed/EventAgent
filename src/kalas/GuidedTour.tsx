"use client";

/* Guided product tour. Plays once after onboarding (armed by the `kalas_tour`
   sessionStorage flag in KalasOnboardingRoot). It walks the couple through the
   app page by page: for each step it navigates to that screen, spotlights the
   matching sidebar nav item and shows a coach-mark explaining what the page is
   for. On desktop the card anchors to the highlighted nav item; when no anchor
   exists (mobile / collapsed) it falls back to a centered bottom card. */

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import type { ScreenId } from './Shell';
import { useLang } from './i18n';
import { markAllHintsSeen } from './OnboardingHint';
import { cn } from './ui';

type Step = { id: ScreenId; label: string; title: string; body: string };

/* A curated walk — an overview of the journey, not every feature. Order follows
   the sidebar so the spotlight travels top-to-bottom. */
const STEPS: Step[] = [
  { id: 'home', label: 'Hjem', title: 'Jeres overblik',
    body: 'Alt der venter på et svar samles her — godkend, afvis eller spørg Ava til råds.' },
  { id: 'planning', label: 'Tidslinje', title: 'Planen, i rækkefølge',
    body: 'Ava sekvenserer opgaverne baglæns fra jeres dato, så I altid kender næste skridt.' },
  { id: 'inbox', label: 'Inbox', title: 'Henvendelserne samlet',
    body: 'Se svar fra venues og leverandører, godkend Avas udkast, og hold styr på tilbud.' },
  { id: 'team', label: 'Leverandører', title: 'Fra opdagelse til booking',
    body: 'Find venues og leverandører, gem dem på shortlisten, og hold styr på jeres bookede team.' },
  { id: 'budget', label: 'Budget', title: 'Styr på pengene',
    body: 'Ava fordeler budgettet og siger til, før I rammer loftet.' },
  { id: 'guests', label: 'Gæster', title: 'Gæstelisten',
    body: 'Tilføj gæster, og lad Ava sende invitationer og holde styr på RSVP.' },
  { id: 'website', label: 'Hjemmeside', title: 'Jeres bryllupsside',
    body: 'Vælg et tema og publicér på minutter — navne, dato og billeder er klar.' },
  { id: 'invites', label: 'Invitationer', title: 'Send invitationerne',
    body: 'Ava skriver ordlyden, I godkender — digitalt eller som fysisk tryk.' },
  { id: 'registry', label: 'Ønskeliste', title: 'Byg jeres ønskeliste',
    body: 'Saml ønsker fra hele nettet — gæsterne reserverer med ét klik.' },
];

const ACCENT = '#b34e37';
const CARD_W = 340;

type Anchor = { top: number; left: number; width: number; height: number };

export default function GuidedTour({
  onNavigate,
  onFinish,
}: {
  onNavigate: (s: ScreenId) => void;
  onFinish: () => void;
}) {
  const { t } = useLang();
  const [idx, setIdx] = useState(0);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const step = STEPS[idx];
  const last = idx === STEPS.length - 1;

  // Belt-and-suspenders: also suppress the per-page hints while the tour runs.
  useEffect(() => { markAllHintsSeen(); }, []);

  const measure = useCallback(() => {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.id}"]`);
    if (!el) { setAnchor(null); return; }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) { setAnchor(null); return; }
    setAnchor({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.id]);

  // Navigate to the step's screen, then locate its nav item.
  useLayoutEffect(() => {
    onNavigate(step.id);
    const raf = requestAnimationFrame(measure);
    const t1 = window.setTimeout(measure, 80);
    const t2 = window.setTimeout(measure, 260);
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [measure]);

  const go = useCallback(
    (next: number) => {
      if (next < 0) return;
      if (next >= STEPS.length) { onFinish(); return; }
      setIdx(next);
    },
    [onFinish],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') go(idx + 1);
      else if (e.key === 'ArrowLeft') go(idx - 1);
      else if (e.key === 'Escape') onFinish();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, idx, onFinish]);

  // ── Card placement ────────────────────────────────────────────────────
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const EST_CARD_H = 260;

  const cardStyle: React.CSSProperties = anchor
    ? {
        left: Math.min(anchor.left + anchor.width + 18, vw - CARD_W - 16),
        top: Math.max(16, Math.min(anchor.top - 6, vh - EST_CARD_H - 16)),
        width: CARD_W,
      }
    : {};

  const pad = 6;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('Rundvisning')}>
      {/* Click-trap + scrim. With an anchor the dim comes from the spotlight's
          giant box-shadow, so the base layer stays transparent. */}
      <div
        className={cn('absolute inset-0', anchor ? 'bg-transparent' : 'bg-[#141a13]/55')}
        onClick={() => go(idx + 1)}
      />

      {/* Spotlight cutout over the highlighted nav item */}
      {anchor && (
        <>
          <motion.div
            aria-hidden
            initial={false}
            animate={{
              top: anchor.top - pad,
              left: anchor.left - pad,
              width: anchor.width + pad * 2,
              height: anchor.height + pad * 2,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="pointer-events-none absolute rounded-xl"
            style={{ boxShadow: '0 0 0 9999px rgba(20,26,19,0.55)' }}
          />
          <motion.div
            aria-hidden
            initial={false}
            animate={{
              top: anchor.top - pad,
              left: anchor.left - pad,
              width: anchor.width + pad * 2,
              height: anchor.height + pad * 2,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="pointer-events-none absolute rounded-xl"
            style={{ boxShadow: `0 0 0 2px ${ACCENT}, 0 0 0 6px ${ACCENT}33` }}
          />
        </>
      )}

      {/* Coach-mark card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className={cn(
            'absolute overflow-hidden rounded-2xl bg-[#fffdf7] shadow-[0_28px_70px_-12px_rgba(20,26,19,0.5)]',
            anchor
              ? ''
              : 'bottom-6 left-4 right-4 mx-auto w-auto max-w-[380px]',
          )}
          style={anchor ? cardStyle : undefined}
        >
          <div className="h-1 w-full bg-[#efe9dc]">
            <motion.div
              className="h-full"
              style={{ backgroundColor: ACCENT }}
              animate={{ width: `${((idx + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#8a8f87]">
                <Sparkles size={12} style={{ color: ACCENT }} />
                {t(step.label)}
              </span>
              <span className="text-[0.72rem] font-medium tabular-nums text-[#a4a89f]">
                {t('Trin {a} af {b}', { a: idx + 1, b: STEPS.length })}
              </span>
            </div>

            <h3 className="mt-2.5 font-serif text-[1.4rem] leading-snug text-[#18372f]">
              {t(step.title)}
            </h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[#4c5a51]">
              {t(step.body)}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onFinish}
                className="text-[0.82rem] font-medium text-[#8a8f87] transition-colors hover:text-[#173c32] cursor-pointer"
              >
                {t('Spring over')}
              </button>

              <div className="flex items-center gap-2">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => go(idx - 1)}
                    aria-label={t('Tilbage')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[#536259] transition-colors hover:bg-[#f0ece2] hover:text-[#173c32] cursor-pointer"
                  >
                    <ArrowLeft size={17} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => go(idx + 1)}
                  className="flex h-10 items-center gap-2 rounded-xl px-5 text-[0.88rem] font-bold text-white shadow-[0_8px_20px_rgba(179,78,55,0.28)] transition-transform hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                  style={{ backgroundColor: ACCENT }}
                >
                  {last ? (
                    <>{t('Kom i gang')} <Check size={16} /></>
                  ) : (
                    <>{t('Videre')} <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
