"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Send, Paperclip, MapPin, Copy, Check } from 'lucide-react';
import { useKalas } from '../store';
import { useWedding } from '../useWedding';
import { cn } from '../ui';
import { useLang } from '../i18n';
import type { ScreenId } from '../Shell';
import OnboardingHint from '../OnboardingHint';
import { createClient } from '@/lib/supabase/client';
import { useAgentChat } from '@/lib/hooks/useAgentChat';
import type { ChatMessageRow, ReplyProposalRow, EmailDraftRow, VenueRow } from '@/lib/db/types';

const SUGGESTIONS = ['Find venues til os', 'Hvad mangler vi at booke?', 'Skriv til fotografer'];

export default function Ava({ onNavigate }: { onNavigate?: (s: ScreenId) => void }) {
  const { loading, event, couple } = useWedding();
  const { t } = useLang();

  if (loading) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-130px)] max-w-2xl items-center justify-center px-5 lg:h-screen">
        <TypingDots />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-130px)] max-w-2xl flex-col items-center justify-center px-5 text-center lg:h-screen">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink">
          <span className="font-serif text-[1.5rem] leading-none text-canvas">K</span>
        </div>
        <p className="mt-4 font-serif text-[1.2rem] text-ink">{t('Lad os planlægge jeres bryllup')}</p>
        <p className="mt-2 max-w-sm text-[0.9rem] text-ink-soft">
          {t('Fortæl mig om jeres dag, så går jeg i gang med at finde venues.')}
        </p>
      </div>
    );
  }

  return <AvaChat key={event.id} eventId={event.id} coupleA={couple.a} onNavigate={onNavigate} />;
}

function AvaChat({ eventId, coupleA, onNavigate }: { eventId: string; coupleA: string; onNavigate?: (s: ScreenId) => void }) {
  const supabase = useMemo(() => createClient(), []);
  const { clearAvaBadge } = useKalas();
  const { refresh } = useWedding();
  const { messages, agentStatus, sendMessage, setMessages } = useAgentChat({
    initialEventId: eventId,
    onTurnComplete: () => void refresh(),
  });
  const { t } = useLang();
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Load the real chat history, then subscribe for live agent/cron messages.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (!cancelled && data) setMessages(data as ChatMessageRow[]);
    })();
    const channel = supabase
      .channel(`ava-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `event_id=eq.${eventId}` },
        (p) => {
          const row = p.new as ChatMessageRow;
          setMessages((m) => (m.some((x) => x.id === row.id) ? m : [...m, row]));
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, eventId, setMessages]);

  useEffect(() => { clearAvaBadge(); }, [clearAvaBadge]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, agentStatus]);

  const visible = messages.filter((m) => m.role === 'user' || m.role === 'assistant');

  return (
    <div className="mx-auto flex h-[calc(100dvh-130px)] max-w-2xl flex-col px-5 lg:h-screen">
      <header className="flex items-center gap-3 rule-b py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink">
          <span className="font-serif text-[1.3rem] leading-none text-canvas">K</span>
        </div>
        <div>
          <div className="font-serif text-[1.15rem] text-ink">Ava</div>
          <div className="text-[0.72rem] text-success">{t('● Online · jeres bryllupsplanlægger')}</div>
        </div>
      </header>

      <div className="hide-scrollbar flex-1 space-y-4 overflow-y-auto py-7">
        {visible.map((m) => (
          <Bubble key={m.id} msg={m} onNavigate={onNavigate} />
        ))}
        {agentStatus && <TypingDots label={agentStatus} />}
        <div ref={endRef} />
      </div>

      <div className="pb-3 pt-2 lg:pb-7">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => sendMessage(t(s))} disabled={agentStatus !== null}
              className="rounded-full rule bg-card px-3.5 py-2 text-[0.8rem] text-ink-soft transition-colors hover:bg-shell cursor-pointer disabled:opacity-50">
              {t(s)}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); const msg = draft; setDraft(''); void sendMessage(msg); }}
          className="flex items-center gap-2 rounded-full rule bg-card px-2 py-2">
          <button type="button" aria-label={t('Vedhæft fil')} disabled
            className="flex h-10 w-10 items-center justify-center rounded-full text-faint cursor-not-allowed">
            <Paperclip size={17} />
          </button>
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder={t('Skriv til Ava, {name}…', { name: coupleA || t('du') })}
            aria-label={t('Besked til Ava')}
            className="flex-1 bg-transparent text-[0.98rem] text-ink placeholder:text-faint focus:outline-none" />
          <button type="submit" aria-label={t('Send besked')} disabled={agentStatus !== null || !draft.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-ink transition-colors hover:bg-sage-strong cursor-pointer disabled:opacity-50">
            <Send size={16} />
          </button>
        </form>
      </div>
      <OnboardingHint id="ava" />
    </div>
  );
}

function Bubble({ msg, onNavigate }: { msg: ChatMessageRow; onNavigate?: (s: ScreenId) => void }) {
  const mine = msg.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      {msg.content && (
        <div className={cn('max-w-[80%] whitespace-pre-line rounded-3xl px-5 py-3.5 text-[0.97rem] leading-relaxed',
          mine ? 'rounded-br-lg bg-ink text-canvas' : 'rounded-bl-lg rule bg-card text-ink')}>
          {msg.content}
        </div>
      )}
      {msg.payload && (
        <div className="mt-2 w-full max-w-[80%]">
          <PayloadCard payload={msg.payload} onNavigate={onNavigate} />
        </div>
      )}
    </motion.div>
  );
}

/* ── Interactive payload cards ───────────────────────────────────────── */
function PayloadCard({ payload, onNavigate }: { payload: NonNullable<ChatMessageRow['payload']>; onNavigate?: (s: ScreenId) => void }) {
  const { t } = useLang();
  switch (payload.kind) {
    case 'venue_batch':
      return (
        <ActionPill onClick={() => onNavigate?.('venues')}>
          <MapPin size={13} /> {t('{n} venues lagt på jeres board — se dem', { n: payload.venue_ids.length })}
        </ActionPill>
      );
    case 'reply_proposal':
      return <ProposalCard proposalId={payload.proposal_id} onNavigate={onNavigate} />;
    case 'draft':
      return <DraftCard draftId={payload.draft_id} />;
    case 'invite_brief':
      return <InviteBriefCard wording={payload.wording} style={payload.style} onNavigate={onNavigate} />;
    case 'send_report':
      return (
        <div className="rounded-full bg-sage-tint px-4 py-2 text-[0.78rem] text-ink">
          {t('Sendt til {sent}', { sent: payload.sent })}{payload.skipped ? t(', {n} sprunget over', { n: payload.skipped }) : ''}{payload.failed ? t(', {n} fejlede', { n: payload.failed }) : ''}.
        </div>
      );
    default:
      return null;
  }
}

function ActionPill({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-sage-tint px-4 py-2 text-[0.78rem] font-medium text-ink hover:bg-sage transition-colors cursor-pointer">
      {children}
    </button>
  );
}

function CardShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl rule bg-card p-4">
      <p className="mb-2 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-ink">{label}</p>
      {children}
    </div>
  );
}

function ProposalCard({ proposalId, onNavigate }: { proposalId: string; onNavigate?: (s: ScreenId) => void }) {
  const { t } = useLang();
  const supabase = useMemo(() => createClient(), []);
  const { refresh } = useWedding();
  const [proposal, setProposal] = useState<ReplyProposalRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'sent' | 'dismissed' | null>(null);

  useEffect(() => {
    supabase.from('reply_proposals').select('*').eq('id', proposalId).maybeSingle()
      .then(({ data }) => setProposal((data as ReplyProposalRow | null) ?? null));
  }, [supabase, proposalId]);

  if (!proposal) return null;
  const settled = done ?? (proposal.status !== 'proposed' ? proposal.status : null);

  const act = async (kind: 'send' | 'dismiss') => {
    setBusy(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/${kind}`, { method: 'POST' });
      if (res.ok) { setDone(kind === 'send' ? 'sent' : 'dismissed'); await refresh(); }
    } finally { setBusy(false); }
  };

  return (
    <CardShell label={t('Foreslået svar til leverandør')}>
      <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-shell px-3 py-2.5 text-[0.85rem] leading-relaxed text-ink-soft">
        {proposal.body}
      </p>
      {settled ? (
        <p className="mt-2.5 text-[0.76rem] font-medium text-success">{settled === 'sent' ? t('Sendt ✓') : t('Afvist')}</p>
      ) : (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => act('send')}
            className="rounded-full bg-ink px-4 py-2 text-[0.76rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer disabled:opacity-50">
            {busy ? t('Sender…') : t('Godkend & send')}
          </button>
          <button onClick={() => onNavigate?.('inbox')}
            className="rounded-full rule px-4 py-2 text-[0.76rem] text-ink-soft hover:bg-shell transition-colors cursor-pointer">
            {t('Se i indbakke')}
          </button>
          <button disabled={busy} onClick={() => act('dismiss')}
            className="rounded-full px-3 py-2 text-[0.76rem] text-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-50">
            {t('Afvis')}
          </button>
        </div>
      )}
    </CardShell>
  );
}

function DraftCard({ draftId }: { draftId: string }) {
  const { t } = useLang();
  const supabase = useMemo(() => createClient(), []);
  const { venues, refresh } = useWedding();
  const [draft, setDraft] = useState<EmailDraftRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.from('email_drafts').select('*').eq('id', draftId).maybeSingle()
      .then(({ data }) => setDraft((data as EmailDraftRow | null) ?? null));
  }, [supabase, draftId]);

  if (!draft) return null;
  const recipients = venues.filter((v: VenueRow) => v.swipe_status === 'liked' && v.category === draft.category);

  const approve = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/drafts/${draft.id}/approve`, { method: 'POST' });
      if (res.ok) { setSent(true); await refresh(); }
    } finally { setBusy(false); }
  };

  return (
    <CardShell label={t('Udkast · henvendelse')}>
      <p className="text-[0.9rem] font-medium text-ink">{draft.subject}</p>
      <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-shell px-3 py-2.5 text-[0.82rem] leading-relaxed text-ink-soft">
        {draft.body_template}
      </p>
      <p className="mt-2 text-[0.74rem] text-muted">
        {t('Ava skriver individuelt til {n} valgte leverandører', { n: recipients.length })}
        {recipients.length > 0 && `: ${recipients.map((v) => v.name).join(', ')}`}.
      </p>
      {draft.status !== 'proposed' || sent ? (
        <p className="mt-2.5 text-[0.76rem] font-medium text-success">{t('Sendt ✓')}</p>
      ) : (
        <button disabled={busy || recipients.length === 0} onClick={approve}
          className="mt-2.5 rounded-full bg-ink px-4 py-2 text-[0.76rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer disabled:opacity-50">
          {busy ? t('Sender…') : t('Godkend & send')}
        </button>
      )}
    </CardShell>
  );
}

function InviteBriefCard({ wording, style, onNavigate }: { wording: string; style: string | null; onNavigate?: (s: ScreenId) => void }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(wording); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* no clipboard */ }
  };
  return (
    <div className="rounded-2xl rule bg-card overflow-hidden">
      <div className="flex items-center justify-between rule-b px-4 py-2.5">
        <span className="text-[0.78rem] font-medium text-ink">{t('💌 Invitationstekst')}</span>
        {style && <span className="rounded-full bg-sage-tint px-2.5 py-0.5 text-[0.68rem] text-ink">{style}</span>}
      </div>
      <p className="whitespace-pre-wrap px-5 py-5 text-center font-serif text-[0.98rem] leading-[1.8] text-ink">{wording}</p>
      <div className="flex items-center gap-2 rule-t px-4 py-3">
        <button onClick={() => onNavigate?.('invites')}
          className="rounded-full bg-ink px-4 py-2 text-[0.76rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer">
          {t('Bestil tryk →')}
        </button>
        <button onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full rule px-4 py-2 text-[0.76rem] text-ink-soft hover:bg-shell transition-colors cursor-pointer">
          {copied ? <><Check size={13} /> {t('Kopieret')}</> : <><Copy size={13} /> {t('Kopiér')}</>}
        </button>
      </div>
    </div>
  );
}

function TypingDots({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-start gap-2">
      <div className="flex gap-1.5 rounded-3xl rounded-bl-lg rule bg-card px-5 py-4">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
      {label && <span className="text-[0.72rem] italic text-muted">{label}</span>}
    </div>
  );
}
