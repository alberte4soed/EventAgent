import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Upload, Utensils, Send, Users, Clock, CheckCheck, ChevronRight, ChevronDown, Trash2, Search, X, Check, Link2 } from 'lucide-react';
import { Eyebrow, Pill, Chip, cn } from '../ui';
import AnimateNumber from '../AnimateNumber';
import OnboardingHint from '../OnboardingHint';
import { useWedding } from '../useWedding';
import { parseConfig } from '../site/config';
import type { RsvpSubEvent, RsvpQuestion } from '../site/config';
import type { GuestRow as GuestRecord, RsvpStatus } from '@/lib/db/types';

const RSVP_CYCLE: Record<RsvpStatus, RsvpStatus> = { afventer: 'ja', ja: 'nej', nej: 'afventer' };

type Tab = 'gæsteliste' | 'beskeder';
type Filter = 'alle' | 'ja' | 'afventer' | 'afbud';

type MessageThread = {
  id: string; subject: string; preview: string;
  recipientLabel: string; sentAt?: string; status: 'draft' | 'sent'; replies: number;
};

const THREADS: MessageThread[] = [
  { id: 'm1', subject: 'Vi glæder os til at se jer! 🎉', preview: 'Kære alle, vi kan endelig afsløre alle detaljerne om vores store dag...', recipientLabel: 'Bekræftede gæster', sentAt: '3 dage siden', status: 'sent', replies: 12 },
  { id: 'm2', subject: 'Mangler stadig dit svar', preview: 'Hej! Vi har endnu ikke hørt fra dig angående vores bryllup den 12. september...', recipientLabel: 'Afventende svar', sentAt: '1 uge siden', status: 'sent', replies: 4 },
  { id: 'm3', subject: 'Praktisk info om dagen', preview: 'Her er alt I skal vide: parkering, overnatning og dresscode...', recipientLabel: 'Alle gæster', sentAt: undefined, status: 'draft', replies: 0 },
];

function makeTemplates(a: string, b: string, dateLabel: string) {
  const sign = `${a} & ${b}`;
  return [
    { id: 'tp1', label: 'Praktisk info', subject: 'Alt du skal vide om dagen', recipients: 'Alle gæster', body: `Kære [navn],\n\nVi glæder os enormt til at fejre vores store dag med dig!\n\nHer er de vigtigste praktiske informationer:\n\n📍 Sted: [venue]\n🕐 Ceremoni starter kl. [tid]\n🚗 Parkering: [info]\n\nKontakt os hvis du har spørgsmål.\n\nMed kærlig hilsen,\n${sign}` },
    { id: 'tp2', label: 'Rykker – RSVP', subject: 'Mangler stadig dit svar 💌', recipients: 'Afventende svar', body: `Hej [navn],\n\nVi mangler stadig at høre om du kan komme til vores bryllup den ${dateLabel}.\n\nVil du svare inden [dato]?\n\nMed håb om at se dig,\n${sign}` },
    { id: 'tp3', label: 'Tak for svar', subject: 'Tak for dit svar! 🙏', recipients: 'Bekræftede', body: `Kære [navn],\n\nTusen tak — vi er så glade for at du kommer!\n\nKærlig hilsen,\n${sign}` },
  ];
}

export default function Guests() {
  const { couple, guests: guestList, weddingSite, addGuest: addGuestRow, updateGuest, deleteGuest } = useWedding();
  const siteBase = weddingSite?.published && weddingSite.domain
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/w/${weddingSite.domain}`
    : null;
  const guestLink = (token: string) => (siteBase ? `${siteBase}?rsvp=${token}` : null);
  const [tab, setTab] = useState<Tab>('gæsteliste');
  const [filter, setFilter] = useState<Filter>('alle');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSide, setNewSide] = useState('Fælles');
  const addInputRef = useRef<HTMLInputElement>(null);

  const rsvpStats = useMemo(() => ({
    invited: guestList.length,
    ja: guestList.filter((g) => g.rsvp === 'ja').length,
    afventer: guestList.filter((g) => g.rsvp === 'afventer').length,
    nej: guestList.filter((g) => g.rsvp === 'nej').length,
  }), [guestList]);

  const siteConfig = useMemo(() => parseConfig(weddingSite?.config), [weddingSite]);
  // Headcount per sub-event: the guest + companion + children when they said yes.
  const subEventCounts = useMemo(() => siteConfig.rsvpEvents.map((ev) => ({
    ...ev,
    count: guestList.reduce((n, g) => g.rsvp_events?.[ev.id] === true
      ? n + 1 + (g.plus_one ? 1 : 0) + (g.children_count ?? 0) : n, 0),
  })), [siteConfig.rsvpEvents, guestList]);

  const rsvpFilter = filter === 'afbud' ? 'nej' : filter;
  const list = guestList
    .filter((g) => filter === 'alle' || g.rsvp === rsvpFilter)
    .filter((g) => !query.trim() || g.name.toLowerCase().includes(query.trim().toLowerCase()));

  const startAdding = () => { setAdding(true); setTimeout(() => addInputRef.current?.focus(), 60); };

  const addGuest = () => {
    const name = newName.trim();
    if (!name) { setAdding(false); return; }
    void addGuestRow({ name, side: newSide });
    setNewName('');
    setAdding(false);
  };

  const removeGuest = (id: string) => void deleteGuest(id);
  const cycleRsvp = (g: GuestRecord) => void updateGuest(g.id, { rsvp: RSVP_CYCLE[g.rsvp] });

  const sides = ['Fælles', couple.a || 'Partner 1', couple.b || 'Partner 2'].filter(Boolean);

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <Eyebrow>Gæster · {rsvpStats.invited} inviteret</Eyebrow>
          <h1 className="display mt-4 text-[clamp(2.5rem,5vw,4rem)] text-ink">
            Listen, der <span className="italic">tæller for jer</span>
          </h1>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Pill variant="outline"><Upload size={15} /> Importér</Pill>
          <Pill arrow onClick={startAdding}><Plus size={15} /> Tilføj</Pill>
        </div>
      </div>

      {/* RSVP rings */}
      <div className="mt-10 grid gap-10 sm:grid-cols-3">
        <Ring value={rsvpStats.ja}       total={rsvpStats.invited} label="Bekræftet"    color="var(--color-sage)" />
        <Ring value={rsvpStats.afventer} total={rsvpStats.invited} label="Mangler svar" color="var(--color-line-strong)" track />
        <Ring value={rsvpStats.nej}      total={rsvpStats.invited} label="Afbud"        color="var(--color-clay)" />
      </div>

      <p className="mt-6 flex items-center gap-2 text-[0.82rem] text-muted">
        <Utensils size={13} className="text-sage" />
        Ava sender catering {rsvpStats.ja} kuverter — opdateres automatisk.
      </p>

      {/* Per-sub-event headcounts (from the website's RSVP) */}
      {subEventCounts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {subEventCounts.map((ev) => (
            <span key={ev.id} className="rounded-full rule bg-card px-3.5 py-1.5 text-[0.76rem] text-ink-soft">
              {ev.label || 'Delarrangement'}: <span className="font-medium text-ink">{ev.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Section tabs */}
      <div className="mt-10 flex gap-1 border-b border-[var(--color-line)]">
        {(['gæsteliste', 'beskeder'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('relative px-5 py-3 text-[0.85rem] capitalize transition-colors cursor-pointer',
              tab === t ? 'text-ink' : 'text-muted hover:text-ink')}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {tab === t && (
              <motion.span layoutId="guest-section-tab"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'gæsteliste' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* RSVP reminder */}
            {rsvpStats.afventer > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-6 flex items-center justify-between gap-4 rounded-2xl rule bg-card px-5 py-4">
                <div>
                  <p className="text-[0.88rem] font-medium text-ink">
                    {rsvpStats.afventer} gæster mangler stadig svar
                  </p>
                  <p className="mt-0.5 text-[0.76rem] text-muted">
                    Ava sender en venlig påmindelse på jeres vegne
                  </p>
                </div>
                <button
                  onClick={() => setTab('beskeder')}
                  className="shrink-0 rounded-full bg-ink px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                  Send påmindelser
                </button>
              </motion.div>
            )}

            {/* Add guest inline */}
            <AnimatePresence>
              {adding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                  className="overflow-hidden">
                  <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl rule bg-card px-5 py-4">
                    <input ref={addInputRef} value={newName} onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addGuest(); if (e.key === 'Escape') setAdding(false); }}
                      placeholder="Gæstens navn…" aria-label="Gæstens navn"
                      className="flex-1 min-w-[160px] bg-transparent font-serif text-[1.05rem] text-ink placeholder:text-muted border-b border-[var(--color-line)] pb-1 focus:outline-none focus:border-ink" />
                    <div className="flex gap-1.5">
                      {sides.map((s) => (
                        <button key={s} onClick={() => setNewSide(s)}
                          className={cn('rounded-full px-3 py-1.5 text-[0.72rem] transition-colors cursor-pointer',
                            newSide === s ? 'bg-ink text-canvas' : 'rule text-ink-soft hover:bg-shell')}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <button onClick={addGuest} aria-label="Gem gæst"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-canvas hover:opacity-90 transition-opacity cursor-pointer"
                      style={{ background: 'var(--color-terracotta)' }}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => setAdding(false)} aria-label="Annuller"
                      className="text-muted hover:text-ink transition-colors cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search + mobile add */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-full rule bg-card px-4 py-2.5">
                <Search size={14} className="shrink-0 text-muted" />
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Søg i gæstelisten…" aria-label="Søg gæster"
                  className="flex-1 bg-transparent text-[0.85rem] text-ink placeholder:text-muted focus:outline-none" />
                {query && (
                  <button onClick={() => setQuery('')} aria-label="Ryd søgning"
                    className="shrink-0 text-muted hover:text-ink cursor-pointer"><X size={13} /></button>
                )}
              </div>
              <button onClick={startAdding}
                className="sm:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-canvas cursor-pointer"
                style={{ background: 'var(--color-terracotta)' }} aria-label="Tilføj gæst">
                <Plus size={16} />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="mt-2 flex gap-1 rule-b">
              {(['alle', 'ja', 'afventer', 'afbud'] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn('relative px-4 py-3 text-[0.85rem] capitalize transition-colors cursor-pointer',
                    filter === f ? 'text-ink' : 'text-muted hover:text-ink')}>
                  {f}
                  {filter === f && (
                    <motion.span layoutId="guest-tab"
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-sage" />
                  )}
                </button>
              ))}
            </div>

            {/* Table header */}
            <div className="mt-4 grid items-center gap-4 pb-3 rule-b"
              style={{ gridTemplateColumns: '1fr 90px 90px 20px' }}>
              <span className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-muted">Navn</span>
              <span className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-muted">RSVP</span>
              <span className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-muted">Måltid</span>
              <span className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-muted">—</span>
            </div>
            <div className="divide-y divide-[var(--color-line)]">
              {list.map((g, i) => (
                <GuestRow key={g.id} g={g} i={i} link={guestLink(g.rsvp_token)}
                  subEvents={siteConfig.rsvpEvents} questions={siteConfig.rsvpQuestions}
                  onRemove={() => removeGuest(g.id)} onCycle={() => cycleRsvp(g)} />
              ))}
            </div>
            {list.length === 0 && (
              <p className="py-10 text-center font-serif text-[1.1rem] italic text-muted">
                {query ? `Ingen gæster matcher "${query}"` : 'Ingen gæster i dette filter endnu.'}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div key="messaging" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MessagingPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <OnboardingHint id="guests" />
    </div>
  );
}

function GuestRow({ g, i, link, subEvents, questions, onRemove, onCycle }: {
  g: GuestRecord; i: number; link: string | null;
  subEvents: RsvpSubEvent[]; questions: RsvpQuestion[];
  onRemove: () => void; onCycle: () => void;
}) {
  const isAfbud = g.rsvp === 'nej';
  const rsvpLabel = isAfbud ? 'afbud' : g.rsvp;
  const tone = g.rsvp === 'ja' ? 'success' : g.rsvp === 'afventer' ? 'clay' : 'neutral';
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const detail = [g.plus_one_name && `+ ${g.plus_one_name}`, g.dietary && g.dietary].filter(Boolean).join(' · ');

  const eventAnswers = subEvents
    .map((ev) => ({ label: ev.label || 'Delarrangement', answer: g.rsvp_events?.[ev.id] }))
    .filter((x): x is { label: string; answer: boolean } => typeof x.answer === 'boolean');
  const knownQ = new Set(questions.map((q) => q.id));
  const questionAnswers = questions
    .map((q) => ({ label: q.label || 'Spørgsmål', answer: g.custom_answers?.[q.id] }))
    .filter((x): x is { label: string; answer: string } => Boolean(x.answer));
  // Answers to since-deleted questions stay visible instead of vanishing.
  const orphanAnswers = Object.entries(g.custom_answers ?? {})
    .filter(([id]) => !knownQ.has(id))
    .map(([, answer]) => answer);
  const hasExtras = eventAnswers.length > 0 || questionAnswers.length > 0 ||
    orphanAnswers.length > 0 || (g.children_count ?? 0) > 0 || Boolean(g.notes);

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.03, 0.25) }}
      className="py-4"
    >
      <div className="grid items-center gap-4" style={{ gridTemplateColumns: '1fr 90px 90px 64px' }}>
        <div className="min-w-0">
          <div className={cn('flex items-center gap-1.5 font-serif text-[1.05rem] text-ink', isAfbud && 'opacity-40')}>
            <span className="truncate">{g.name}</span>
            {g.responded_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" title="Har svaret" />}
          </div>
          <div className="text-[0.76rem] text-muted truncate">{g.side}{detail && ` · ${detail}`}</div>
        </div>

        <button onClick={onCycle} aria-label={`Skift RSVP for ${g.name}`}
          className="text-left cursor-pointer" title="Klik for at skifte svar">
          {isAfbud ? (
            <span className="text-[0.82rem] text-muted line-through">{rsvpLabel}</span>
          ) : (
            <Chip tone={tone}>{rsvpLabel}</Chip>
          )}
        </button>

        <div>
          {g.meal ? (
            <span className="text-[0.82rem] text-ink-soft capitalize">{g.meal}</span>
          ) : (
            <span className="text-[0.82rem] text-muted">—</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {hasExtras && (
            <button onClick={() => setExpanded((v) => !v)} aria-label={`Vis detaljer for ${g.name}`}
              className="text-muted/50 hover:text-ink transition-colors cursor-pointer">
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="block">
                <ChevronDown size={14} />
              </motion.span>
            </button>
          )}
          {link && (
            <button onClick={copyLink} aria-label={`Kopiér svar-link til ${g.name}`} title="Kopiér personligt svar-link"
              className="text-muted/50 hover:text-ink transition-colors cursor-pointer">
              {copied ? <Check size={13} className="text-success" /> : <Link2 size={13} />}
            </button>
          )}
          <button onClick={onRemove} aria-label={`Fjern ${g.name}`}
            className="text-muted/50 hover:text-[var(--color-terracotta)] transition-colors cursor-pointer">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && hasExtras && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            className="overflow-hidden">
            <div className="mt-3 rounded-xl bg-shell/60 px-4 py-3 space-y-1.5">
              {eventAnswers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {eventAnswers.map((x, idx) => (
                    <span key={idx} className={cn('rounded-full px-2.5 py-0.5 text-[0.7rem]',
                      x.answer ? 'bg-sage-tint text-ink' : 'rule text-muted line-through')}>
                      {x.label}
                    </span>
                  ))}
                </div>
              )}
              {(g.children_count ?? 0) > 0 && (
                <p className="text-[0.78rem] text-ink-soft">Børn: {g.children_count}</p>
              )}
              {questionAnswers.map((x, idx) => (
                <p key={idx} className="text-[0.78rem] text-ink-soft">
                  <span className="text-muted">{x.label}:</span> {x.answer}
                </p>
              ))}
              {orphanAnswers.length > 0 && (
                <p className="text-[0.78rem] text-muted">Tidligere spørgsmål: {orphanAnswers.join(' · ')}</p>
              )}
              {g.notes && <p className="text-[0.78rem] text-ink-soft italic">{`"${g.notes}"`}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MessagingPanel() {
  const { couple } = useWedding();
  const TEMPLATES = makeTemplates(couple.a, couple.b, couple.dateLabel);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const thread = THREADS.find((t) => t.id === activeThread);

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
      {/* left: threads + compose */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-[0.82rem] text-muted">{THREADS.length} beskeder sendt eller kladde</p>
          <button
            onClick={() => { setComposing(true); setActiveThread(null); }}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[0.72rem] font-medium uppercase tracking-widest text-canvas hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Send size={11} /> Ny besked
          </button>
        </div>

        <ol className="divide-y divide-[var(--color-line)] border-t border-b border-[var(--color-line)]">
          {THREADS.map((t) => (
            <motion.li
              key={t.id}
              whileHover={{ backgroundColor: 'var(--color-shell)' }}
              onClick={() => { setActiveThread(t.id); setComposing(false); }}
              className={cn('cursor-pointer px-4 py-4 transition-colors', activeThread === t.id && 'bg-shell')}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {t.status === 'draft' && (
                      <span className="rounded-full bg-[#e8ddd9] px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-[#8b5e52]">Kladde</span>
                    )}
                    <h3 className="font-serif text-[0.95rem] text-ink truncate">{t.subject}</h3>
                  </div>
                  <p className="text-[0.78rem] text-muted truncate">{t.preview}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[0.68rem] text-muted"><Users size={10} /> {t.recipientLabel}</span>
                    {t.sentAt && <span className="flex items-center gap-1 text-[0.68rem] text-muted"><Clock size={10} /> {t.sentAt}</span>}
                    {t.replies > 0 && <span className="flex items-center gap-1 text-[0.68rem] text-muted"><CheckCheck size={10} /> {t.replies} svar</span>}
                  </div>
                </div>
                <ChevronRight size={14} className="mt-1 shrink-0 text-muted" />
              </div>
            </motion.li>
          ))}
        </ol>

        {/* thread detail */}
        <AnimatePresence>
          {thread && (
            <motion.div key={thread.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-6 rounded-2xl border border-[var(--color-line)] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[1.1rem] text-ink">{thread.subject}</h3>
                  <p className="mt-1 text-[0.75rem] text-muted">{thread.recipientLabel} · {thread.sentAt ?? 'Kladde'}</p>
                </div>
                <button onClick={() => setActiveThread(null)} className="text-[0.72rem] text-muted hover:text-ink cursor-pointer">Luk</button>
              </div>
              <p className="text-[0.88rem] text-ink-soft leading-relaxed whitespace-pre-line">{thread.preview}</p>
              {thread.status === 'draft' && (
                <button className="mt-5 flex items-center gap-2 rounded-full bg-[#8b5e52] px-5 py-2.5 text-[0.72rem] font-medium uppercase tracking-widest text-white hover:opacity-90 cursor-pointer">
                  <Send size={11} /> Send nu
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* compose */}
        <AnimatePresence>
          {composing && (
            <motion.div key="compose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-6 rounded-2xl border border-[var(--color-line)] p-6">
              <h3 className="font-serif text-[1rem] text-ink mb-5">Ny besked</h3>
              <div className="space-y-4">
                <div>
                  <label className="eyebrow text-[0.65rem] text-muted block mb-1.5">Modtagere</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Alle gæster', 'Bekræftede', 'Afventende'].map((r) => (
                      <button key={r} className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[0.72rem] hover:bg-shell transition-colors cursor-pointer">{r}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="eyebrow text-[0.65rem] text-muted block mb-1.5">Emne</label>
                  <input className="w-full rounded-xl border border-[var(--color-line)] bg-transparent px-4 py-2.5 text-[0.88rem] text-ink outline-none focus:border-ink transition-colors" placeholder="Emne..." />
                </div>
                <div>
                  <label className="eyebrow text-[0.65rem] text-muted block mb-1.5">Besked</label>
                  <textarea rows={6} value={messageBody} onChange={(e) => setMessageBody(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-transparent px-4 py-3 text-[0.88rem] text-ink outline-none focus:border-ink transition-colors resize-none leading-relaxed"
                    placeholder="Skriv din besked her..." />
                </div>
                <div className="flex gap-3 pt-1">
                  <button className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.72rem] font-medium uppercase tracking-widest text-canvas hover:opacity-90 cursor-pointer">
                    <Send size={11} /> Send
                  </button>
                  <button onClick={() => setComposing(false)} className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-[0.72rem] uppercase tracking-widest text-muted hover:text-ink cursor-pointer">
                    Annuller
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* right: templates */}
      <div>
        <h2 className="font-serif text-[1rem] text-ink mb-4">Skabeloner</h2>
        <div className="space-y-3">
          {TEMPLATES.map((tp) => (
            <motion.button key={tp.id} whileHover={{ scale: 1.01 }}
              onClick={() => { setSelectedTemplate(tp.id === selectedTemplate ? null : tp.id); setComposing(true); setMessageBody(tp.body); setActiveThread(null); }}
              className={cn('w-full rounded-2xl border p-4 text-left transition-colors cursor-pointer',
                selectedTemplate === tp.id ? 'border-ink bg-shell' : 'border-[var(--color-line)] hover:bg-shell')}>
              <div className="flex items-center justify-between">
                <span className="font-serif text-[0.95rem] text-ink">{tp.label}</span>
                <span className="text-[0.68rem] text-muted">{tp.recipients}</span>
              </div>
              <p className="mt-1 text-[0.75rem] text-muted">{tp.subject}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Ring({ value, total, label, color, track }: {
  value: number; total: number; label: string; color: string; track?: boolean;
}) {
  const r   = 52;
  const c   = 2 * Math.PI * r;
  const pct = total > 0 ? value / total : 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[120px] w-[120px] shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-line)" strokeWidth="1.5" />
          <motion.circle
            cx="60" cy="60" r={r} fill="none" stroke={color}
            strokeWidth={track ? 1.5 : 2} strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: c * (1 - pct) }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
      </div>
      <div>
        <div className="font-serif text-[2.6rem] leading-none text-ink">
          <AnimateNumber value={value} />
        </div>
        <div className="eyebrow mt-2">{label}</div>
      </div>
    </div>
  );
}
