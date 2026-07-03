import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Check, Globe, Copy, AlertCircle, RotateCcw, Lock, Mail, X } from 'lucide-react';
import { couple, queue, daysUntil, moodboard, TODAY, budgetLines } from '../data';
import { useKalas } from '../store';
import type { ScreenId } from '../Shell';
import { Eyebrow, Pill, Bleed, cn, fadeUp, stagger } from '../ui';
import OnboardingHint from '../OnboardingHint';

const totalSpent = budgetLines.reduce((sum, b) => sum + b.spent, 0);
const kr = (n: number) => new Intl.NumberFormat('da-DK').format(Math.round(n));

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return 'Godnat';
  if (h < 10) return 'Godmorgen';
  if (h < 12) return 'Godformiddag';
  if (h < 18) return 'Goddag';
  return 'Godaften';
}

function daysDiff(dateISO: string): number {
  const d = new Date(dateISO);
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000);
}

export default function Home({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { pendingCount } = useKalas();

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12">

      {/* ── Ava anbefaler i dag ────────────────────────────────────────── */}
      <AvaUrgentToday onNavigate={onNavigate} />

      {/* ── Greeting ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-12 max-w-4xl">
        <h1 className="display text-[clamp(2.75rem,7vw,5.5rem)] text-ink">
          {greeting()},<br />
          <span className="italic">{couple.a} & {couple.b}.</span>
        </h1>
        <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink-soft">
          {pendingCount > 0
            ? `Ava har gjort klar til jer. ${pendingCount === 1 ? 'Én ting venter' : `${pendingCount} ting venter`} på jeres godkendelse — det tager få minutter at rydde.`
            : 'Alt er ryddet. Ava arbejder videre i baggrunden og siger til, når der er nyt.'}
        </p>
      </motion.div>

      {/* ── Status strip ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl rule bg-[var(--color-line)]">
        <div className="bg-canvas px-5 py-6">
          <div className="font-serif text-[2.2rem] leading-none text-ink">{daysUntil}</div>
          <div className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">Dage til brylluppet</div>
        </div>
        <div className="bg-canvas px-5 py-6">
          <div className="font-serif text-[2.2rem] leading-none text-ink">{pendingCount}</div>
          <div className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">Ting venter på jer</div>
        </div>
        <div className="bg-canvas px-5 py-6">
          <div className="font-serif text-[2.2rem] leading-none text-ink">{kr(totalSpent)}</div>
          <div className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">Kr betalt indtil videre</div>
        </div>
      </motion.div>

      {/* ── Website promo card ────────────────────────────────────────── */}
      <WebsiteShareCard onNavigate={onNavigate} />

      {/* ── Approval queue ────────────────────────────────────────────── */}
      <ApprovalQueue onNavigate={onNavigate} />

      {/* ── Moodboard teaser ──────────────────────────────────────────── */}
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

/* ── Ava anbefaler i dag ─────────────────────────────────────────────── */
function AvaUrgentToday({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { tasks, doneIds } = useKalas();
  const urgent = tasks
    .filter((t) => !doneIds.has(t.id) && t.id !== 't14')
    .map((t) => ({ ...t, diff: daysDiff(t.dateISO) }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 2);

  const TARGET: Record<string, ScreenId> = {
    't3': 'venues', 't4': 'vendors', 't5': 'vendors', 't6': 'vendors',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rule rounded-2xl bg-card overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-6 py-3.5 rule-b">
        {urgent.length > 0 && (
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-terracotta)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-terracotta)]" />
          </div>
        )}
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-muted">Ava anbefaler nu</p>
      </div>
      {urgent.length === 0 ? (
        <p className="px-6 py-5 font-serif text-[1rem] italic text-muted">
          Alt er klaret for nu. Nyd roen — jeg siger til, når næste milepæl nærmer sig.
        </p>
      ) : (
        <div className="divide-y divide-[var(--color-line)]">
          {urgent.map((t) => {
            const overdue = t.diff < 0;
            const screen: ScreenId = TARGET[t.id] ?? 'planning';
            return (
              <button key={t.id} onClick={() => onNavigate(screen)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-shell/60 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 min-w-0">
                  <AlertCircle size={14} className={overdue ? 'text-[var(--color-terracotta)] shrink-0' : 'text-muted shrink-0'} />
                  <div className="min-w-0">
                    <p className="font-serif text-[1rem] text-ink leading-snug truncate">{t.title}</p>
                    <p className="text-[0.75rem] text-muted mt-0.5">
                      {overdue ? `${Math.abs(t.diff)} dage forsinket` : `Om ${t.diff} dage`}
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="shrink-0 text-muted group-hover:text-ink transition-colors" />
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ── Website share card ──────────────────────────────────────────────── */
function WebsiteShareCard({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const [copied, setCopied] = useState(false);
  const domain = `${couple.a.toLowerCase()}-${couple.b.toLowerCase()}.kalas.dk`;

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
            <p className="font-serif text-[1.1rem] text-ink leading-snug">Jeres hjemmeside er klar</p>
            <p className="mt-0.5 text-[0.78rem] text-muted">{couple.guests} gæster venter på linket</p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 rule rounded-xl bg-shell px-3 py-1.5">
                <span className="text-[0.76rem] font-mono text-ink">{domain}</span>
              </div>
              <button onClick={copy}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] bg-ink text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                <AnimatePresence mode="wait" initial={false}>
                  {copied
                    ? <motion.span key="check" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}><Check size={11} /></motion.span>
                    : <motion.span key="copy"  initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}><Copy size={11} /></motion.span>
                  }
                </AnimatePresence>
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

/* ── Approval queue — approve/dismiss actually works ─────────────────── */
const QUEUE_TARGET: Record<string, ScreenId> = {
  venues:       'venues',
  outreach:     'ava',
  photographers:'vendors',
};

const RECEIPT_COPY: Record<string, string> = {
  venues:       'Shortlist gennemgået — Ava rækker ud til jeres favoritter.',
  outreach:     '6 mails sendt fra jeres Gmail. Lokaler svarer typisk inden for 24–48 timer.',
  photographers:'Valg noteret. Ava bekræfter med fotografen og opdaterer budgettet.',
};

/* ── Send-moment data: recipients with personalized first lines ──────── */
const RECIPIENTS = [
  { name: 'Sonnerupgaard Gods', email: 'event@sonnerupgaard.dk',  line: 'Jeres orangeri er præcis den stemning, vi leder efter…' },
  { name: 'Kongsdal Gods',      email: 'booking@kongsdal.dk',     line: 'De lange borde i avlsgården ramte os begge…' },
  { name: 'Villa Copenhagen',   email: 'events@villacph.dk',      line: 'Vi så jeres weekendpakke og blev nysgerrige…' },
  { name: 'Kokkedal Slot',      email: 'fest@kokkedalslot.dk',    line: 'Slotsparken i september lyder som et eventyr…' },
  { name: 'Nimb Terrasse',      email: 'private@nimb.dk',         line: 'Tivoli som baggrund til første dans — wow…' },
  { name: 'Søhuset Pier',       email: 'kontakt@soehuset.dk',     line: 'Skumringen ved vandet passer til vores stil…' },
];

function ApprovalQueue({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { queueHandled, handleQueueItem, undoQueueItem, pendingCount } = useKalas();
  const [sendOpen, setSendOpen] = useState(false);

  return (
    <>
      <div className="mt-16 flex items-center justify-between rule-b pb-4">
        <Eyebrow>
          {pendingCount > 0 ? `Godkendelseskø · ${pendingCount} ${pendingCount === 1 ? 'ting' : 'ting'}` : 'Godkendelseskø · alt ryddet'}
        </Eyebrow>
        <button onClick={() => onNavigate('venues')} className="eyebrow hover:text-ink transition-colors cursor-pointer">Se alle</button>
      </div>

      <div className="divide-y divide-[var(--color-line)]">
        {queue.map((item, i) => {
          const status = queueHandled[item.id];
          if (status) {
            return (
              <ReceiptRow key={item.id} item={item} status={status}
                onUndo={() => undoQueueItem(item.id)} />
            );
          }
          return item.id === 'outreach' ? (
            <OutreachRow key={item.id} item={item} onNavigate={onNavigate}
              onApprove={() => setSendOpen(true)}
              onDismiss={() => handleQueueItem(item.id, 'dismissed')} />
          ) : (
            <QueueRow key={item.id} item={item} flip={i % 2 === 1} onNavigate={onNavigate}
              onApprove={() => handleQueueItem(item.id, 'approved')}
              onDismiss={() => handleQueueItem(item.id, 'dismissed')} />
          );
        })}
      </div>

      {/* Status board once outreach is live */}
      {queueHandled['outreach'] === 'approved' && <StatusBoard />}

      <SendMoment open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSent={() => { setSendOpen(false); handleQueueItem('outreach', 'approved'); }} />
    </>
  );
}

/* ── Send moment — auth gate → unlock → review → sent w/ undo ────────── */
function SendMoment({ open, onClose, onSent }: {
  open: boolean; onClose: () => void; onSent: () => void;
}) {
  const { authed, setAuthed, paid, setPaid } = useKalas();
  const [step, setStep] = useState<'auth' | 'unlock' | 'review' | 'sent'>('auth');
  const [undoLeft, setUndoLeft] = useState(60);
  const [draft, setDraft] = useState(
    `Kære [lokale],\n\nVi er ${couple.a} & ${couple.b} og planlægger vores bryllup den ${couple.dateLabel}. Vi er ${couple.guests} gæster og søger et sted med stemning, der afspejler vores stil — '${couple.style}'.\n\nVi vil gerne høre om ledighed og priser — og meget gerne aftale en fremvisning.\n\nMed venlig hilsen,\n${couple.a} & ${couple.b}`
  );

  // Pick the right step whenever the overlay opens.
  useEffect(() => {
    if (open) setStep(!authed ? 'auth' : !paid ? 'unlock' : 'review');
  }, [open]);

  // 60s undo countdown after send.
  useEffect(() => {
    if (step !== 'sent') return;
    setUndoLeft(60);
    const iv = setInterval(() => setUndoLeft((s) => {
      if (s <= 1) { clearInterval(iv); onSent(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [step]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div key="send-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/60 backdrop-blur-sm px-0 sm:px-5"
        onClick={step === 'sent' ? undefined : onClose}>
        <motion.div
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto hide-scrollbar rounded-t-3xl sm:rounded-3xl bg-canvas shadow-[0_32px_80px_-16px_rgba(0,0,0,0.3)]">

          {step === 'auth' && (
            <div className="px-7 py-9">
              <p className="eyebrow mb-3">Send til lokalerne</p>
              <h3 className="display text-[1.9rem] text-ink leading-tight">Log ind for at <span className="italic">sende.</span></h3>
              <p className="mt-3 text-[0.88rem] text-ink-soft leading-relaxed">
                Mails sendes fra jeres egen Gmail, så svarene lander direkte hos jer.
                Ava læser kun bryllups-tråde — intet andet.
              </p>
              <button onClick={() => { setAuthed(true); setStep(paid ? 'review' : 'unlock'); }}
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-full rule bg-card py-4 text-[0.9rem] font-medium text-ink hover:bg-shell transition-colors cursor-pointer">
                <GoogleMark /> Fortsæt med Google
              </button>
              <p className="mt-3 text-center text-[0.72rem] text-muted">Gratis — intet kort påkrævet</p>
            </div>
          )}

          {step === 'unlock' && (
            <div className="px-7 py-9">
              <p className="eyebrow mb-3">Lås op for afsendelse</p>
              <h3 className="display text-[1.9rem] text-ink leading-tight">
                299 kr — <span className="italic">én gang.</span>
              </h3>
              <div className="mt-6 space-y-3">
                {[
                  'Send til alle lokaler I har liket',
                  'Ava overvåger svarene og samler tilbuddene',
                  'Sammenlign priser og datoer side om side',
                  'Automatisk venlig rykker efter 4 dage',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-tint">
                      <Check size={11} className="text-ink" />
                    </div>
                    <p className="text-[0.88rem] text-ink">{t}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => { setPaid(true); setStep('review'); }}
                className="mt-8 w-full rounded-full py-4 text-[0.78rem] font-bold uppercase tracking-[0.16em] text-canvas hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: 'var(--color-terracotta)' }}>
                Lås op · 299 kr
              </button>
              <p className="mt-3 text-center text-[0.72rem] text-muted">Engangsbeløb · ingen abonnement · søgning og swipe er altid gratis</p>
            </div>
          )}

          {step === 'review' && (
            <div className="px-7 py-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow mb-2">Gennemse før afsendelse</p>
                  <h3 className="display text-[1.7rem] text-ink leading-tight">Jeres henvendelse</h3>
                </div>
                <button onClick={onClose} aria-label="Luk"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-shell text-muted hover:text-ink cursor-pointer">
                  <X size={14} />
                </button>
              </div>

              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={9}
                aria-label="Rediger udkast"
                className="mt-5 w-full resize-none rounded-2xl rule bg-card px-4 py-3.5 text-[0.85rem] text-ink leading-relaxed focus:outline-none focus:ring-1 focus:ring-ink/20" />

              <p className="mt-5 eyebrow">Sendes til {RECIPIENTS.length} lokaler</p>
              <div className="mt-2 divide-y divide-[var(--color-line)] rule rounded-2xl overflow-hidden">
                {RECIPIENTS.map((r) => (
                  <div key={r.email} className="flex items-start gap-3 bg-card px-4 py-3">
                    <Mail size={13} className="mt-1 shrink-0 text-muted" />
                    <div className="min-w-0">
                      <p className="text-[0.82rem] font-medium text-ink">{r.name} <span className="font-normal text-muted">· {r.email}</span></p>
                      <p className="text-[0.74rem] text-muted italic truncate">"{r.line}"</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setStep('sent')}
                className="mt-6 w-full rounded-full py-4 text-[0.78rem] font-bold uppercase tracking-[0.16em] text-canvas hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: 'var(--color-terracotta)' }}>
                Send til {RECIPIENTS.length} lokaler
              </button>
              <p className="mt-3 text-center text-[0.72rem] text-muted">
                Mails sendes fra jeres egen Gmail, så svarene lander hos jer
              </p>
            </div>
          )}

          {step === 'sent' && (
            <div className="px-7 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-tint">
                <Check size={24} className="text-ink" />
              </div>
              <h3 className="display mt-5 text-[1.8rem] text-ink">Sendt.</h3>
              <p className="mt-2 text-[0.88rem] text-ink-soft">
                {RECIPIENTS.length} lokaler har fået jeres henvendelse.<br />
                Lokaler svarer typisk inden for 24–48 timer.
              </p>
              <button onClick={onClose}
                className="mt-7 rounded-full rule px-6 py-3 text-[0.74rem] font-medium uppercase tracking-[0.14em] text-ink hover:bg-card transition-colors cursor-pointer">
                Fortryd afsendelse · {undoLeft}s
              </button>
              <div>
                <button onClick={onSent}
                  className="mt-3 text-[0.74rem] text-muted hover:text-ink underline-offset-2 hover:underline transition-colors cursor-pointer">
                  Færdig — vis status
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Status board — the waiting period made visible ──────────────────── */
const BOARD_STATUS: Record<string, 'sent' | 'replied' | 'quoted'> = {
  'Sonnerupgaard Gods': 'quoted',
  'Kongsdal Gods': 'replied',
};

function StatusBoard() {
  return (
    <div className="mt-4 rule rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between bg-card px-5 py-3.5 rule-b">
        <p className="eyebrow">Forespørgsler · live</p>
        <p className="text-[0.72rem] text-muted">Lokaler svarer typisk inden for 24–48 timer</p>
      </div>
      <div className="divide-y divide-[var(--color-line)]">
        {RECIPIENTS.map((r) => {
          const st = BOARD_STATUS[r.name] ?? 'sent';
          return (
            <div key={r.name} className="flex items-center justify-between gap-3 px-5 py-3">
              <p className="text-[0.85rem] text-ink truncate">{r.name}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <StatusChip label="Sendt" on />
                <StatusChip label="Svaret" on={st !== 'sent'} />
                <StatusChip label="Tilbud" on={st === 'quoted'} highlight={st === 'quoted'} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusChip({ label, on, highlight }: { label: string; on: boolean; highlight?: boolean }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em]',
      highlight ? 'bg-sage text-ink' : on ? 'bg-sage-tint text-ink' : 'bg-shell text-muted/60')}>
      {label}
    </span>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function ReceiptRow({ item, status, onUndo }: {
  item: typeof queue[number]; status: 'approved' | 'dismissed'; onUndo: () => void;
}) {
  const approved = status === 'approved';
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex items-center justify-between gap-4 py-4"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          approved ? 'bg-sage-tint' : 'bg-shell')}>
          {approved ? <Check size={13} className="text-ink" /> : <RotateCcw size={12} className="text-muted" />}
        </div>
        <div className="min-w-0">
          <p className={cn('text-[0.88rem] truncate', approved ? 'text-ink' : 'text-muted')}>
            {item.kicker}
          </p>
          <p className="text-[0.75rem] text-muted truncate">
            {approved ? RECEIPT_COPY[item.id] ?? 'Godkendt — Ava er i gang.' : 'Udsat — Ava minder jer om det senere.'}
          </p>
        </div>
      </div>
      <button onClick={onUndo}
        className="shrink-0 text-[0.72rem] text-muted hover:text-ink underline-offset-2 hover:underline transition-colors cursor-pointer">
        Fortryd
      </button>
    </motion.div>
  );
}

function OutreachRow({ item, onNavigate, onApprove, onDismiss }: {
  item: typeof queue[number]; onNavigate: (s: ScreenId) => void;
  onApprove: () => void; onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="py-12 lg:py-16"
    >
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Left: description + CTA */}
        <div className="lg:pt-3">
          <Eyebrow>{item.index} — {item.kicker}</Eyebrow>
          <h3 className="display mt-4 text-[clamp(1.6rem,3vw,2.4rem)] text-ink">{item.title}</h3>
          <p className="mt-4 max-w-md text-ink-soft leading-relaxed">{item.body}</p>
          <div className="mt-7 flex items-center gap-2">
            <Pill arrow onClick={onApprove}>{item.primary}</Pill>
            <Pill variant="ghost" onClick={() => onNavigate('ava')}>{item.secondary}</Pill>
          </div>
        </div>

        {/* Right: email draft card */}
        <div className="rule rounded-2xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 rule-b">
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-muted">Udkast · Gmail</span>
            <span className="rounded-full bg-sage px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-ink">Klar</span>
          </div>
          <div className="px-6 py-4 space-y-3 rule-b">
            <div className="flex items-baseline gap-4">
              <span className="w-12 shrink-0 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">Til</span>
              <span className="text-[0.82rem] font-semibold uppercase tracking-[0.06em] text-ink">Sonnerupgaard Gods</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="w-12 shrink-0 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">Emne</span>
              <span className="text-[0.82rem] text-ink-soft">Forespørgsel — bryllup {couple.dateLabel}</span>
            </div>
          </div>
          <div className="px-6 py-5 text-[0.84rem] text-ink-soft leading-relaxed space-y-3">
            <p>Kære Sonnerupgaard Gods,</p>
            <p>
              Vi er {couple.a} & {couple.b} og planlægger vores bryllup
              den <span className="text-ink font-medium">{couple.dateLabel}</span>. Vi er{' '}
              <span className="text-ink font-medium">{couple.guests} gæster</span> og søger en venue med stemning,
              der afspejler vores stil — '{couple.style}'.
            </p>
            <p>Vi er interesserede i jeres weekendpakke og vil gerne aftale en fremvisning. Passer det midt i juli?</p>
            <p className="text-muted">Med venlig hilsen,<br />{couple.a} & {couple.b}</p>
          </div>
          <div className="px-6 pb-6 flex items-center gap-3">
            <button onClick={onApprove}
              className="flex-1 rounded-2xl py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-canvas hover:opacity-85 transition-opacity cursor-pointer"
              style={{ background: 'var(--color-terracotta)' }}>
              Godkend & send via Gmail
            </button>
            <button onClick={onDismiss}
              className="shrink-0 rounded-2xl border border-[var(--color-line)] px-4 py-3.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted hover:text-ink hover:bg-shell transition-colors cursor-pointer">
              Senere
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QueueRow({ item, flip, onNavigate, onApprove, onDismiss }: {
  item: typeof queue[number]; flip: boolean; onNavigate: (s: ScreenId) => void;
  onApprove: () => void; onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="py-12 lg:py-16"
    >
      <div className={cn('grid items-center gap-8 lg:grid-cols-2 lg:gap-14', flip && 'lg:[direction:rtl]')}>
        <Bleed
          src={item.image}
          alt={item.title}
          rounded="rounded-2xl"
          className="aspect-[4/3] lg:[direction:ltr]"
        />
        <div className="lg:[direction:ltr]">
          <Eyebrow>{item.index} — {item.kicker}</Eyebrow>
          <h3 className="display mt-4 text-[clamp(1.6rem,3vw,2.4rem)] text-ink">{item.title}</h3>
          <p className="mt-4 max-w-md text-ink-soft leading-relaxed">{item.body}</p>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Pill arrow onClick={() => onNavigate(QUEUE_TARGET[item.id] ?? 'venues')}>
              {item.primary}
            </Pill>
            <Pill variant="ghost" onClick={onDismiss}>{item.secondary}</Pill>
            <button onClick={onApprove}
              className="flex items-center gap-1.5 px-3 py-2 text-[0.72rem] font-medium uppercase tracking-[0.12em] text-muted hover:text-ink transition-colors cursor-pointer">
              <Check size={12} /> Markér som klaret
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
