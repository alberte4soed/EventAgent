"use client";

/* The dashboard. A thin orchestrator — every section lives in ./home/ and
   reads real wedding data via useWedding. Sections hide themselves (or show
   a guided empty state) until the couple has data for them. */

import { motion } from 'motion/react';
import { greetingKey } from '@/lib/dashboard';
import { useWedding } from '../useWedding';
import { useLang } from '../i18n';
import type { ScreenId } from '../Shell';
import { Pill } from '../ui';
import OnboardingHint from '../OnboardingHint';
import AvaNow from './home/AvaNow';
import StatBand from './home/StatBand';
import ApprovalQueue from './home/ApprovalQueue';
import VenuePipeline from './home/VenuePipeline';
import TasksDueSoon from './home/TasksDueSoon';
import ActivityFeed from './home/ActivityFeed';
import MoodboardStrip from './home/MoodboardStrip';
import WebsiteCard from './home/WebsiteCard';

export default function Home({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { loading, hasWedding, couple, pendingProposals } = useWedding();
  const { t } = useLang();

  if (loading) return <HomeSkeleton />;

  const names = couple.b ? `${couple.a} & ${couple.b}` : couple.a || t('Jeres bryllup');

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12">

      {hasWedding && <AvaNow onNavigate={onNavigate} />}

      {/* ── Greeting ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
        className={hasWedding ? 'mt-12 max-w-4xl' : 'mt-4 max-w-4xl'}>
        <h1 className="display text-[clamp(2.75rem,7vw,5.5rem)] text-ink">
          {t(greetingKey())},<br />
          <span className="italic">{names}.</span>
        </h1>
        <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink-soft">
          {pendingProposals > 0
            ? t('Ava har gjort klar til jer. {n} svar venter på jeres godkendelse — det tager få minutter.', { n: pendingProposals })
            : t('Alt er ryddet. Ava arbejder videre i baggrunden og siger til, når der er nyt.')}
        </p>
      </motion.div>

      {!hasWedding ? (
        /* Brand new — no event yet. One warm path: talk to Ava. */
        <div className="mt-12 rule rounded-2xl bg-card px-6 py-10 text-center">
          <p className="font-serif text-[1.4rem] text-ink">{t('Skal vi begynde?')}</p>
          <p className="mx-auto mt-2 max-w-sm text-[0.9rem] leading-relaxed text-muted">
            {t('Fortæl Ava om jeres bryllup — sted, gæster og drømme — så bygger hun planen op omkring jer.')}
          </p>
          <Pill arrow onClick={() => onNavigate('ava')} className="mt-6">{t('Tal med Ava')}</Pill>
        </div>
      ) : (
        <>
          <StatBand onNavigate={onNavigate} />
          <ApprovalQueue onNavigate={onNavigate} />
          <VenuePipeline onNavigate={onNavigate} />
          <TasksDueSoon onNavigate={onNavigate} />
          <ActivityFeed onNavigate={onNavigate} />
          <MoodboardStrip onNavigate={onNavigate} />
          <WebsiteCard onNavigate={onNavigate} />
        </>
      )}

      {/* ── Footer signature ──────────────────────────────────────────── */}
      <div className="mt-24 rule-t pt-8 text-center">
        <p className="font-serif text-lg italic text-muted">{t('Planlagt med ro — af Ava, godkendt af jer.')}</p>
      </div>

      <OnboardingHint id="home" />
    </div>
  );
}

/* Calm hairline placeholders while the wedding loads — no flash of zeros. */
function HomeSkeleton() {
  return (
    <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12" aria-busy>
      <div className="rule h-24 rounded-2xl bg-card/60" />
      <div className="mt-12 space-y-4">
        <div className="h-14 w-2/3 rounded-2xl bg-shell/70" />
        <div className="h-14 w-1/2 rounded-2xl bg-shell/50" />
        <div className="h-4 w-80 max-w-full rounded-full bg-shell/60" />
      </div>
      <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl rule bg-[var(--color-line)] lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-canvas px-5 py-6">
            <div className="h-9 w-16 rounded-lg bg-shell/70" />
            <div className="mt-3 h-2.5 w-24 rounded-full bg-shell/50" />
          </div>
        ))}
      </div>
      <div className="mt-16 h-40 rounded-2xl rule bg-card/40" />
    </div>
  );
}
