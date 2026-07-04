"use client";

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Check, Globe, Copy } from 'lucide-react';
import { moodboard } from '../data';
import { useWedding } from '../useWedding';
import type { ScreenId } from '../Shell';
import { Eyebrow, Pill, Bleed, cn, fadeUp, stagger } from '../ui';
import OnboardingHint from '../OnboardingHint';
import type { JourneyStageKey } from '@/lib/journey';

const kr = (n: number) => new Intl.NumberFormat('da-DK').format(Math.round(n));

const STAGE_SCREEN: Record<JourneyStageKey, ScreenId> = {
  basics: 'ava',
  venue: 'venues',
  vendors: 'vendors',
  invites: 'invites',
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return 'Godnat';
  if (h < 10) return 'Godmorgen';
  if (h < 12) return 'Godformiddag';
  if (h < 18) return 'Goddag';
  return 'Godaften';
}

function daysUntil(dateISO: string | null): number | null {
  if (!dateISO) return null;
  const d = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export default function Home({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { couple, event, journey, proposals, replies, venues, refresh } = useWedding();

  const pending = proposals.filter((p) => p.status === 'proposed');
  const quotes = replies.filter((r) => r.quote_status === 'quoted').length;
  const days = daysUntil(event?.event_date ?? null);
  const budgetTotal = couple.budgetTotal;
  const names = couple.b ? `${couple.a} & ${couple.b}` : couple.a || 'Jeres bryllup';

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12">

      {/* ── Ava anbefaler nu — journey-driven ─────────────────────────── */}
      <AvaUrgentToday journey={journey} pendingCount={pending.length} onNavigate={onNavigate} />

      {/* ── Greeting ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-12 max-w-4xl">
        <h1 className="display text-[clamp(2.75rem,7vw,5.5rem)] text-ink">
          {greeting()},<br />
          <span className="italic">{names}.</span>
        </h1>
        <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink-soft">
          {pending.length > 0
            ? `Ava har gjort klar til jer. ${pending.length === 1 ? 'Ét svar venter' : `${pending.length} svar venter`} på jeres godkendelse — det tager få minutter.`
            : 'Alt er ryddet. Ava arbejder videre i baggrunden og siger til, når der er nyt.'}
        </p>
      </motion.div>

      {/* ── Status strip ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl rule bg-[var(--color-line)]">
        <div className="bg-canvas px-5 py-6">
          <div className="font-serif text-[2.2rem] leading-none text-ink">{days ?? '—'}</div>
          <div className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">Dage til brylluppet</div>
        </div>
        <div className="bg-canvas px-5 py-6">
          <div className="font-serif text-[2.2rem] leading-none text-ink">{pending.length}</div>
          <div className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">Ting venter på jer</div>
        </div>
        <div className="bg-canvas px-5 py-6">
          <div className="font-serif text-[2.2rem] leading-none text-ink">{quotes || (budgetTotal ? kr(budgetTotal) : 0)}</div>
          <div className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">
            {quotes ? 'Tilbud modtaget' : 'Kr budget'}
          </div>
        </div>
      </motion.div>

      {/* ── Website promo card ────────────────────────────────────────── */}
      <WebsiteShareCard couple={couple} onNavigate={onNavigate} />

      {/* ── Approval queue — real reply proposals ─────────────────────── */}
      <section className="mt-16">
        <div className="flex items-center justify-between rule-b pb-4">
          <Eyebrow>
            {pending.length > 0 ? `Godkendelseskø · ${pending.length}` : 'Godkendelseskø · alt ryddet'}
          </Eyebrow>
          <button onClick={() => onNavigate('ava')} className="eyebrow hover:text-ink transition-colors cursor-pointer">Tal med Ava</button>
        </div>

        {pending.length === 0 ? (
          <JourneyNextSteps journey={journey} onNavigate={onNavigate} />
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {pending.map((p) => (
              <ProposalRow
                key={p.id}
                vendorName={venues.find((v) => v.id === p.venue_id)?.name ?? 'Leverandør'}
                body={p.body}
                onDone={() => void refresh()}
                proposalId={p.id}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Moodboard teaser (inspiration) ────────────────────────────── */}
      <section className="mt-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>Moodboard</Eyebrow>
            <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-ink">
              Jeres univers, samlet <span className="italic">ét sted</span>
            </h2>
            <p className="mt-3 max-w-md text-ink-soft leading-relaxed">
              Hver gang I gemmer et billede, sender Ava det videre til vendor-briefs og
              hjemmesidens tema.
            </p>
          </div>
          <Pill variant="ghost" arrow onClick={() => onNavigate('inspiration')} className="hidden sm:inline-flex">Åbn</Pill>
        </div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
          className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {moodboard.slice(0, 4).map((m) => (
            <motion.button
              key={m.id} variants={fadeUp} onClick={() => onNavigate('inspiration')}
              className="group relative aspect-[3/4] cursor-pointer overflow-hidden"
            >
              <Bleed src={m.image} alt={m.caption} className="h-full w-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3a4f37b3] to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[0.7rem] uppercase tracking-[0.14em] text-canvas">{m.caption}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* ── Footer signature ──────────────────────────────────────────── */}
      <div className="mt-24 rule-t pt-8 text-center">
        <p className="font-serif text-lg italic text-muted">Planlagt med ro — af Ava, godkendt af jer.</p>
      </div>

      <OnboardingHint id="home" />
    </div>
  );
}

/* ── Ava anbefaler nu — the current + next journey stage ─────────────── */
function AvaUrgentToday({ journey, pendingCount, onNavigate }: {
  journey: { key: JourneyStageKey; label: string; hint: string; status: string }[];
  pendingCount: number;
  onNavigate: (s: ScreenId) => void;
}) {
  const active = journey.filter((s) => s.status === 'active').slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rule rounded-2xl bg-card overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-6 py-3.5 rule-b">
        {(active.length > 0 || pendingCount > 0) && (
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-terracotta)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-terracotta)]" />
          </div>
        )}
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-muted">Ava anbefaler nu</p>
      </div>
      {active.length === 0 && pendingCount === 0 ? (
        <p className="px-6 py-5 font-serif text-[1rem] italic text-muted">
          Alt er klaret for nu. Nyd roen — jeg siger til, når næste skridt nærmer sig.
        </p>
      ) : (
        <div className="divide-y divide-[var(--color-line)]">
          {pendingCount > 0 && (
            <button onClick={() => onNavigate('ava')}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-shell/60 transition-colors cursor-pointer group">
              <div className="min-w-0">
                <p className="font-serif text-[1rem] text-ink leading-snug truncate">
                  {pendingCount} svar klar til godkendelse
                </p>
                <p className="text-[0.75rem] text-muted mt-0.5">Ava har forberedt svar til jeres leverandører</p>
              </div>
              <ArrowUpRight size={14} className="shrink-0 text-muted group-hover:text-ink transition-colors" />
            </button>
          )}
          {active.map((s) => (
            <button key={s.key} onClick={() => onNavigate(STAGE_SCREEN[s.key])}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-shell/60 transition-colors cursor-pointer group">
              <div className="min-w-0">
                <p className="font-serif text-[1rem] text-ink leading-snug truncate">{s.label}</p>
                <p className="text-[0.75rem] text-muted mt-0.5">{s.hint}</p>
              </div>
              <ArrowUpRight size={14} className="shrink-0 text-muted group-hover:text-ink transition-colors" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ── Journey next steps when the queue is empty ──────────────────────── */
function JourneyNextSteps({ journey, onNavigate }: {
  journey: { key: JourneyStageKey; label: string; hint: string; status: string }[];
  onNavigate: (s: ScreenId) => void;
}) {
  const shown = journey.filter((s) => s.status !== 'complete');
  if (shown.length === 0) {
    return <p className="py-8 font-serif text-[1.05rem] italic text-muted">Alt er booket — hvor er I dygtige. 🤍</p>;
  }
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {shown.map((s) => {
        const locked = s.status === 'locked';
        return (
          <button key={s.key} disabled={locked}
            onClick={() => !locked && onNavigate(STAGE_SCREEN[s.key])}
            className={cn('rule rounded-2xl bg-card p-5 text-left transition-colors',
              locked ? 'opacity-50 cursor-default' : 'hover:bg-shell cursor-pointer')}>
            <p className="font-serif text-[1.15rem] text-ink">{s.label}</p>
            <p className="mt-1 text-[0.82rem] text-muted leading-relaxed">{s.hint}</p>
          </button>
        );
      })}
    </div>
  );
}

/* ── Website share card ──────────────────────────────────────────────── */
function WebsiteShareCard({ couple, onNavigate }: {
  couple: { a: string; b: string; guests: number };
  onNavigate: (s: ScreenId) => void;
}) {
  const [copied, setCopied] = useState(false);
  const domain = `${(couple.a || 'os').toLowerCase()}${couple.b ? `-${couple.b.toLowerCase()}` : ''}.kalas.dk`;

  function copy() {
    navigator.clipboard.writeText(`https://${domain}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18 }}
      className="mt-6 rule rounded-2xl bg-card overflow-hidden"
    >
      <div className="flex items-start justify-between gap-6 px-6 py-5">
        <div className="flex items-start gap-4 min-w-0">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-tint">
            <Globe size={17} className="text-ink" />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-[1.1rem] text-ink leading-snug">Jeres hjemmeside (kommer snart)</p>
            <p className="mt-0.5 text-[0.78rem] text-muted">
              {couple.guests ? `${couple.guests} gæster` : 'Gæstelisten'} venter på linket
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 rule rounded-xl bg-shell px-3 py-1.5">
                <span className="text-[0.76rem] font-mono text-ink">{domain}</span>
              </div>
              <button onClick={copy}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] bg-ink text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Kopieret!' : 'Kopiér link'}
              </button>
            </div>
          </div>
        </div>
        <button onClick={() => onNavigate('website')}
          className="shrink-0 self-start rounded-full border border-[var(--color-line)] px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-ink hover:bg-shell transition-colors cursor-pointer">
          Tilpas →
        </button>
      </div>
    </motion.div>
  );
}

/* ── A real reply proposal, approve/dismiss ──────────────────────────── */
function ProposalRow({ vendorName, body, proposalId, onDone, onNavigate }: {
  vendorName: string; body: string; proposalId: string;
  onDone: () => void; onNavigate: (s: ScreenId) => void;
}) {
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
          <Eyebrow>Svar til {vendorName}</Eyebrow>
          <h3 className="display mt-4 text-[clamp(1.5rem,3vw,2.2rem)] text-ink">Ava har skrevet et svar</h3>
          <p className="mt-4 max-w-md text-ink-soft leading-relaxed">
            {vendorName} har svaret på jeres henvendelse. Godkend Avas svar, så sender hun det fra
            Kalas-postkassen — eller tal med hende om det først.
          </p>
          <div className="mt-7 flex items-center gap-2">
            <Pill arrow onClick={() => { if (!busy) void act('send'); }}>
              {busy ? 'Sender…' : 'Godkend & send'}
            </Pill>
            <Pill variant="ghost" onClick={() => onNavigate('ava')}>Tal med Ava</Pill>
            <button onClick={() => { if (!busy) void act('dismiss'); }}
              className="px-3 py-2 text-[0.72rem] font-medium uppercase tracking-[0.12em] text-muted hover:text-ink transition-colors cursor-pointer">
              Afvis
            </button>
          </div>
        </div>

        <div className="rule rounded-2xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 rule-b">
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-muted">Udkast · Ava</span>
            <span className="rounded-full bg-sage px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-ink">Klar</span>
          </div>
          <div className={cn('px-6 py-5 text-[0.84rem] text-ink-soft leading-relaxed whitespace-pre-line', !open && 'line-clamp-6')}>
            {body}
          </div>
          <button onClick={() => setOpen((v) => !v)}
            className="w-full rule-t px-6 py-3 text-[0.72rem] font-medium text-muted hover:text-ink transition-colors cursor-pointer">
            {open ? 'Vis mindre' : 'Vis hele svaret'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
