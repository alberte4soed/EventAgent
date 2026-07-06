"use client";

import { useState } from 'react';
import { motion } from 'motion/react';
import type { JourneyStage } from '@/lib/journey';
import { useWedding } from '../../useWedding';
import { useLang } from '../../i18n';
import type { ScreenId } from '../../Shell';
import { Eyebrow, Pill, cn } from '../../ui';
import { DA_STAGES, STAGE_SCREEN, daStageHint } from './stages';

/* The centerpiece: real reply proposals waiting for approval. When the queue
   is clear, the journey grid shows the couple where to go next instead. */
export default function ApprovalQueue({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { journey, proposals, venues, replies, refresh } = useWedding();
  const { t } = useLang();
  const pending = proposals.filter((p) => p.status === 'proposed');

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between rule-b pb-4">
        <Eyebrow>
          {pending.length > 0 ? t('Godkendelseskø · {n}', { n: pending.length }) : t('Godkendelseskø · alt ryddet')}
        </Eyebrow>
        <button onClick={() => onNavigate('ava')} className="eyebrow hover:text-ink transition-colors cursor-pointer">{t('Tal med Ava')}</button>
      </div>

      {pending.length === 0 ? (
        <JourneyNextSteps
          journey={journey}
          counts={{
            liked: venues.filter((v) => v.category === 'venue' && v.swipe_status === 'liked').length,
            quotes: replies.filter((r) => r.quote_status === 'quoted').length,
          }}
          onNavigate={onNavigate}
        />
      ) : (
        <div className="divide-y divide-[var(--color-line)]">
          {pending.map((p) => (
            <ProposalRow
              key={p.id}
              vendorName={venues.find((v) => v.id === p.venue_id)?.name ?? t('Leverandør')}
              body={p.body}
              onDone={() => void refresh()}
              proposalId={p.id}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Journey next steps when the queue is empty ──────────────────────── */
function JourneyNextSteps({ journey, counts, onNavigate }: {
  journey: JourneyStage[];
  counts: { liked: number; quotes: number };
  onNavigate: (s: ScreenId) => void;
}) {
  const { t } = useLang();
  const shown = journey.filter((s) => s.status !== 'complete');
  if (journey.length > 0 && shown.length === 0) {
    return <p className="py-8 font-serif text-[1.05rem] italic text-muted">{t('Alt er booket — hvor er I dygtige. 🤍')}</p>;
  }
  if (shown.length === 0) return null;
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {shown.map((s) => {
        const locked = s.status === 'locked';
        return (
          <button key={s.key} disabled={locked}
            onClick={() => !locked && onNavigate(STAGE_SCREEN[s.key])}
            className={cn('rule rounded-2xl bg-card p-5 text-left transition-colors',
              locked ? 'opacity-50 cursor-default' : 'hover:bg-shell cursor-pointer')}>
            <p className="font-serif text-[1.15rem] text-ink">{t(DA_STAGES[s.key].label)}</p>
            <p className="mt-1 text-[0.82rem] text-muted leading-relaxed">{daStageHint(s, counts, t)}</p>
          </button>
        );
      })}
    </div>
  );
}

/* ── A real reply proposal, approve/dismiss ──────────────────────────── */
function ProposalRow({ vendorName, body, proposalId, onDone, onNavigate }: {
  vendorName: string; body: string; proposalId: string;
  onDone: () => void; onNavigate: (s: ScreenId) => void;
}) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function act(kind: 'send' | 'dismiss') {
    setBusy(true);
    try {
      await fetch(`/api/proposals/${proposalId}/${kind}`, { method: 'POST' });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="py-8"
    >
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="lg:pt-3">
          <Eyebrow>{t('Svar til {vendor}', { vendor: vendorName })}</Eyebrow>
          <h3 className="display mt-4 text-[clamp(1.5rem,3vw,2.2rem)] text-ink">{t('Ava har skrevet et svar')}</h3>
          <p className="mt-4 max-w-md text-ink-soft leading-relaxed">
            {t('{vendor} har svaret på jeres henvendelse. Godkend Avas svar, så sender hun det fra Kalas-postkassen — eller tal med hende om det først.', { vendor: vendorName })}
          </p>
          <div className="mt-7 flex items-center gap-2">
            <Pill arrow onClick={() => { if (!busy) void act('send'); }}>
              {busy ? t('Sender…') : t('Godkend & send')}
            </Pill>
            <Pill variant="ghost" onClick={() => onNavigate('ava')}>{t('Tal med Ava')}</Pill>
            <button onClick={() => { if (!busy) void act('dismiss'); }}
              className="px-3 py-2 text-[0.72rem] font-medium uppercase tracking-[0.12em] text-muted hover:text-ink transition-colors cursor-pointer">
              {t('Afvis')}
            </button>
          </div>
        </div>

        <div className="rule rounded-2xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 rule-b">
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-muted">{t('Udkast · Ava')}</span>
            <span className="rounded-full bg-sage px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-ink">{t('Klar')}</span>
          </div>
          <div className={cn('px-6 py-5 text-[0.84rem] text-ink-soft leading-relaxed whitespace-pre-line', !open && 'line-clamp-6')}>
            {body}
          </div>
          <button onClick={() => setOpen((v) => !v)}
            className="w-full rule-t px-6 py-3 text-[0.72rem] font-medium text-muted hover:text-ink transition-colors cursor-pointer">
            {open ? t('Vis mindre') : t('Vis hele svaret')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
