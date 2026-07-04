"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Send, Paperclip } from 'lucide-react';
import { useKalas } from '../store';
import { useWedding } from '../useWedding';
import { cn } from '../ui';
import OnboardingHint from '../OnboardingHint';
import { createClient } from '@/lib/supabase/client';
import { useAgentChat } from '@/lib/hooks/useAgentChat';
import type { ChatMessageRow } from '@/lib/db/types';

const SUGGESTIONS = ['Find venues til os', 'Hvad mangler vi at booke?', 'Skriv til fotografer'];

export default function Ava() {
  const { loading, event, couple } = useWedding();

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
        <p className="mt-4 font-serif text-[1.2rem] text-ink">Lad os planlægge jeres bryllup</p>
        <p className="mt-2 max-w-sm text-[0.9rem] text-ink-soft">
          Fortæl mig om jeres dag, så går jeg i gang med at finde venues.
        </p>
      </div>
    );
  }

  return <AvaChat key={event.id} eventId={event.id} coupleA={couple.a} />;
}

function AvaChat({ eventId, coupleA }: { eventId: string; coupleA: string }) {
  const supabase = useMemo(() => createClient(), []);
  const { clearAvaBadge } = useKalas();
  const { refresh } = useWedding();
  const { messages, agentStatus, sendMessage, setMessages } = useAgentChat({
    initialEventId: eventId,
    onTurnComplete: () => void refresh(),
  });
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
          <div className="text-[0.72rem] text-success">● Online · jeres bryllupsplanlægger</div>
        </div>
      </header>

      <div className="hide-scrollbar flex-1 space-y-4 overflow-y-auto py-7">
        {visible.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
        {agentStatus && <TypingDots label={agentStatus} />}
        <div ref={endRef} />
      </div>

      <div className="pb-3 pt-2 lg:pb-7">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => sendMessage(s)} disabled={agentStatus !== null}
              className="rounded-full rule bg-card px-3.5 py-2 text-[0.8rem] text-ink-soft transition-colors hover:bg-shell cursor-pointer disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); const t = draft; setDraft(''); void sendMessage(t); }}
          className="flex items-center gap-2 rounded-full rule bg-card px-2 py-2">
          <button type="button" aria-label="Vedhæft fil" disabled
            className="flex h-10 w-10 items-center justify-center rounded-full text-faint cursor-not-allowed">
            <Paperclip size={17} />
          </button>
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder={`Skriv til Ava, ${coupleA || 'du'}…`}
            aria-label="Besked til Ava"
            className="flex-1 bg-transparent text-[0.98rem] text-ink placeholder:text-faint focus:outline-none" />
          <button type="submit" aria-label="Send besked" disabled={agentStatus !== null || !draft.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-ink transition-colors hover:bg-sage-strong cursor-pointer disabled:opacity-50">
            <Send size={16} />
          </button>
        </form>
      </div>
      <OnboardingHint id="ava" />
    </div>
  );
}

function payloadHint(msg: ChatMessageRow): string | null {
  const p = msg.payload;
  if (!p) return null;
  if (p.kind === 'venue_batch') return `${p.venue_ids.length} venues lagt på jeres board — se dem under Venues.`;
  if (p.kind === 'draft') return 'Et udkast er klar til godkendelse.';
  if (p.kind === 'reply_proposal') return 'Jeg har forberedt et svar til en leverandør.';
  if (p.kind === 'send_report') return `Sendt til ${p.sent}, ${p.skipped} sprunget over.`;
  if (p.kind === 'invite_brief') return 'Invitationstekst er klar under Invitationer.';
  return null;
}

function Bubble({ msg }: { msg: ChatMessageRow }) {
  const mine = msg.role === 'user';
  const hint = payloadHint(msg);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      {msg.content && (
        <div className={cn('max-w-[80%] whitespace-pre-line rounded-3xl px-5 py-3.5 text-[0.97rem] leading-relaxed',
          mine ? 'rounded-br-lg bg-ink text-canvas' : 'rounded-bl-lg rule bg-card text-ink')}>
          {msg.content}
        </div>
      )}
      {hint && (
        <div className="mt-2 max-w-[80%] rounded-full bg-sage-tint px-4 py-2 text-[0.78rem] text-ink">
          {hint}
        </div>
      )}
    </motion.div>
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
