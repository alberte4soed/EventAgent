"use client";

/* Invitation Studio — build a shareable ONLINE invitation: pick a template,
   fill in your details, and publish a personal link guests open as an envelope
   that unfolds the invitation (with countdown, photo, message and RSVP). The
   look/content persists in the `invitations` table via saveInvite(); the public
   render lives at /i/[slug]. Physical print ordering has been retired in favour
   of the online flow. */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Shuffle, Share2, Link as LinkIcon, X, Image as ImageIcon, Eye } from 'lucide-react';
import { useWedding } from '../useWedding';
import { cn } from '../ui';
import OnboardingHint from '../OnboardingHint';
import { slugify } from '../site/config';
import {
  PALETTES, FONTS, PRESETS, CATEGORIES, useInviteFonts,
  InviteCard, InviteBack, FlipCard, paletteById, fontById,
  type PaletteId, type FontId, type Alignment, type Composition, type Shape, type Frame, type Category, type InvitePreset,
} from '../invite/theme';
import { EnvelopeReveal } from '../invite/EnvelopeReveal';
import { parseInviteConfig, type InviteConfig } from '../invite/config';

type Tab = 'design' | 'tekst' | 'del';

const rand = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ─── Panel label ───────────────────────────────────────────────────────── */
function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize:11, letterSpacing:'0.22em', textTransform:'uppercase', color:'#a59b89', fontWeight:600, marginBottom:13, fontFamily:"'Montserrat',sans-serif" }}>
      {children}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function Invites() {
  const { loading, couple, venues, event, invitation, guests, saveInvite } = useWedding();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-[0.85rem] text-muted">Indlæser…</div>;
  }
  const chosen =
    venues.find((v) => v.id === event?.chosen_venue_id) ??
    venues.find((v) => v.category === 'venue' && v.swipe_status === 'liked');
  return (
    <InvitesStudio
      couple={{ a: couple.a, b: couple.b, dateLabel: couple.dateLabel, dateISO: couple.dateISO, guests: couple.guests }}
      venueName={chosen?.name ?? ''}
      eventId={event?.id ?? null}
      invitation={invitation}
      guests={guests}
      saveInvite={saveInvite}
    />
  );
}

interface StudioCouple { a: string; b: string; dateLabel: string; dateISO: string | null; guests: number }

function InvitesStudio({ couple, venueName, eventId, invitation, guests, saveInvite }: {
  couple: StudioCouple;
  venueName: string;
  eventId: string | null;
  invitation: ReturnType<typeof useWedding>['invitation'];
  guests: ReturnType<typeof useWedding>['guests'];
  saveInvite: ReturnType<typeof useWedding>['saveInvite'];
}) {
  useInviteFonts();

  // Seed the initial config from the stored invitation, filling blanks with the
  // couple's real details.
  const seed = useCallback((): InviteConfig => {
    const base = parseInviteConfig(invitation?.config);
    return {
      ...base,
      names: base.names || (couple.b ? `${couple.a} & ${couple.b}` : couple.a || 'Vores navne'),
      dateLabel: base.dateLabel || couple.dateLabel || '',
      dateISO: base.dateISO || couple.dateISO || '',
      venue: base.venue || venueName || '',
      envelope: {
        ...base.envelope,
        monogram: base.envelope.monogram || [couple.a?.[0], couple.b?.[0]].filter(Boolean).join(' & '),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [cfg, setCfg] = useState<InviteConfig>(seed);
  const update = (patch: Partial<InviteConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const updateEnvelope = (patch: Partial<InviteConfig['envelope']>) =>
    setCfg((c) => ({ ...c, envelope: { ...c.envelope, ...patch } }));

  const [mode, setMode] = useState<'browse' | 'edit'>(invitation ? 'edit' : 'browse');
  const [category, setCategory] = useState<Category>('Alle');
  const [tab, setTab]   = useState<Tab>('design');
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [avaDraft, setAva] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [envelopeKey, setEnvelopeKey] = useState(0);

  // Slug + publish state (persisted alongside config).
  const [slug, setSlug] = useState(invitation?.slug ?? slugify(`${couple.a}-${couple.b}`));
  const [published, setPublished] = useState(invitation?.published ?? false);
  const [copied, setCopied] = useState<string | null>(null);

  // Couple photo preview URL (the path lives in cfg.photoPath).
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!cfg.photoPath) { setPhotoUrl(null); return; }
    let alive = true;
    fetch(`/api/invites/photo?path=${encodeURIComponent(cfg.photoPath)}`)
      .then((r) => r.json()).then((d) => { if (alive) setPhotoUrl(d.url ?? null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [cfg.photoPath]);

  // Debounced autosave of config + slug (never published — that's explicit).
  const firstRun = useRef(true);
  useEffect(() => {
    if (!eventId) return;
    if (firstRun.current) { firstRun.current = false; return; }
    const id = setTimeout(() => {
      void saveInvite({ config: cfg as unknown as Record<string, unknown>, slug: slug || null });
    }, 800);
    return () => clearTimeout(id);
  }, [cfg, slug, eventId, saveInvite]);

  const pal  = paletteById(cfg.paletteId);
  const font = fontById(cfg.fontId);
  const linkBase = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = `${linkBase}/i/${slug}`;

  const applyPreset = (p: InvitePreset) => {
    update({ presetId: p.id, paletteId: p.pal, fontId: p.font, alignment: p.align, composition: p.comp, shape: p.shape, frame: p.frame, photoOnCard: Boolean(p.photo) });
  };

  const shuffle = () => update({ presetId: null, paletteId: rand(PALETTES).id as PaletteId, fontId: rand(FONTS).id as FontId });

  const handleAva = () => {
    setAva(true);
    setTimeout(() => update({
      eyebrow: 'Vi skal giftes',
      closing: 'og det ville betyde alt for os at have jer med. Svar via linket herunder.',
      message: cfg.message || `Vi mødtes en helt almindelig dag, og siden har intet været helt almindeligt. Nu vil vi fejre kærligheden — sammen med jer.`,
    }), 700);
  };

  const uploadPhoto = async (file: File) => {
    if (!eventId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('eventId', eventId);
      const res = await fetch('/api/invites/photo', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.path) { update({ photoPath: data.path }); setPhotoUrl(data.url ?? null); }
    } finally { setUploading(false); }
  };

  const togglePublish = async () => {
    const next = !published;
    setPublished(next);
    await saveInvite({ config: cfg as unknown as Record<string, unknown>, slug: slug || null, published: next });
  };

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1800); } catch { /* ignore */ }
  };
  const guestLink = (token: string) => `${shareLink}?rsvp=${token}`;
  const copyAllGuestLinks = () => {
    const lines = guests.map((g) => `${g.name}: ${guestLink(g.rsvp_token)}`).join('\n');
    void copy(lines || shareLink, 'all');
  };

  const cardKey = `${cfg.paletteId}-${cfg.fontId}-${cfg.alignment}-${cfg.composition}`;

  const front = (
    <InviteCard paletteId={cfg.paletteId} fontId={cfg.fontId} alignment={cfg.alignment} composition={cfg.composition}
      shape={cfg.shape} frame={cfg.frame} photoUrl={photoUrl} photoOnCard={cfg.photoOnCard}
      eyebrow={cfg.eyebrow} names={cfg.names} date={cfg.dateLabel} venue={cfg.venue} closing={cfg.closing} />
  );
  const back = (
    <InviteBack paletteId={cfg.paletteId} fontId={cfg.fontId} domain={slug ? `${slug}.kalas.dk` : 'kalas.dk'}
      program={cfg.program.length ? cfg.program : undefined} rsvpNote={cfg.rsvpDeadline ? `RSVP senest ${cfg.rsvpDeadline}` : undefined} />
  );

  /* ── Browse mode — pick a template ───────────────────────────────────── */
  if (mode === 'browse') {
    const shown = category === 'Alle' ? PRESETS : PRESETS.filter((p) => p.category === category);
    return (
      <div className="min-h-full px-6 py-8 sm:px-9 lg:px-12 lg:py-8">
        <div className="max-w-2xl">
          <p className="max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
            Vælg en skabelon sat med jeres navne og dato. Bagefter tilpasser du alt —
            og deler invitationen som et personligt link, gæsterne åbner som en kuvert.
          </p>
        </div>

        {/* Style filter — like Zola's category chips */}
        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn('rounded-full px-4 py-1.5 text-[0.78rem] font-medium transition-colors cursor-pointer',
                category===c ? 'bg-ink text-canvas' : 'rule text-ink-soft hover:text-ink')}>
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
          {shown.map((p, i) => (
            <motion.button key={p.id}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => { applyPreset(p); setMode('edit'); }}
              className="group text-left cursor-pointer">
              <div className="transition-transform duration-300 group-hover:-translate-y-2">
                <InviteCard paletteId={p.pal} fontId={p.font} alignment={p.align} composition={p.comp}
                  shape={p.shape} frame={p.frame} photoUrl={photoUrl} photoOnCard={Boolean(p.photo)}
                  eyebrow={cfg.eyebrow} names={cfg.names} date={cfg.dateLabel} venue={cfg.venue} closing={cfg.closing} />
              </div>
              <p className="mt-4 font-serif text-[1.1rem] text-ink">{p.name}</p>
              <p className="mt-0.5 text-[0.76rem] text-muted leading-snug">{p.desc}</p>
            </motion.button>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-3 rule-t pt-8">
          <button onClick={() => { update({ presetId: null }); setMode('edit'); }}
            className="h-8 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.12em] text-canvas hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: 'var(--color-ink)' }}>
            Byg fra bunden
          </button>
          <button onClick={() => { shuffle(); setMode('edit'); }}
            className="flex h-8 items-center gap-1.5 rounded-full rule px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink hover:bg-card transition-colors cursor-pointer">
            <Shuffle size={12} /> Overrask mig
          </button>
        </div>
        <OnboardingHint id="invites" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id:'design', label:'Design' },
    { id:'tekst',  label:'Tekst'  },
    { id:'del',    label:'Del'    },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_360px]">

      {/* ── Left: studio panel ─────────────────────────────────────────── */}
      <div className="px-6 py-8 sm:px-9 lg:px-12 lg:py-8" style={{ background:'#FBF9F5' }}>

        <button onClick={() => setMode('browse')}
          className="mb-5 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-muted hover:text-ink transition-colors cursor-pointer">
          ← Alle skabeloner
        </button>
        <h1 className="display text-[clamp(1.8rem,3.5vw,2.6rem)] text-ink leading-tight">
          {cfg.presetId ? PRESETS.find(p => p.id === cfg.presetId)?.name : 'Jeres invitation'}<span className="italic">.</span>
        </h1>
        <p className="mt-2 max-w-sm text-[0.85rem] leading-relaxed text-muted">
          Tilpas design, tekst og kuvert — invitationen opdateres live til højre.
        </p>

        <button onClick={() => { shuffle(); }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-canvas transition-opacity hover:opacity-85 cursor-pointer">
          <Shuffle size={12} /> Overrask mig
        </button>

        {/* Tabs */}
        <div className="mt-7 flex rule-b">
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('relative pb-3 pr-6 text-[0.8rem] font-medium cursor-pointer transition-colors',
                tab===id ? 'text-ink' : 'text-muted hover:text-ink-soft')}>
              {label}
              {tab===id && (
                <motion.span layoutId="inv-tab" className="absolute bottom-0 left-0 h-px bg-ink"
                  style={{ right:'1.5rem' }} transition={{ type:'spring', stiffness:380, damping:34 }} />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Design ─────────────────────────────────────────────────── */}
          {tab==='design' && (
            <motion.div key="design"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.2 }} className="mt-7 space-y-8">

              <div>
                <PanelLabel>Farvepalette</PanelLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {PALETTES.map(p => (
                    <div key={p.id} className="relative">
                      <button onClick={() => update({ paletteId: p.id, presetId: null })}
                        className="w-full overflow-hidden rounded-xl cursor-pointer block transition-all"
                        style={{ border:'1px solid #e6ded0', background:'#fff' }}>
                        <div className="flex h-10">
                          {[p.bg, p.soft, p.accent, p.ink].map((c,i) => (<div key={i} className="flex-1" style={{ background:c }} />))}
                        </div>
                        <div className="px-2.5 py-1.5 text-left" style={{ fontFamily:"'Montserrat',sans-serif", fontSize:11, fontWeight:500, color:'#5e564a', letterSpacing:'0.02em' }}>
                          {p.name}
                        </div>
                      </button>
                      {cfg.paletteId===p.id && (<div className="pointer-events-none absolute -inset-[2px] rounded-[14px] border-2 border-ink" />)}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <PanelLabel>Typografi</PanelLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {FONTS.map(f => (
                    <div key={f.id} className="relative">
                      <button onClick={() => update({ fontId: f.id, presetId: null })}
                        className="w-full rounded-xl px-3 py-3 text-left cursor-pointer block transition-all overflow-hidden"
                        style={{ border:'1px solid #e6ded0', background:'#fff' }}>
                        <div className="truncate text-[1.35rem] leading-[1.1] mb-1.5" style={{ fontFamily:f.head, fontWeight:f.w, color:'#2a261f' }}>
                          {cfg.names}
                        </div>
                        <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'#a39a89' }}>
                          {f.name}
                        </div>
                      </button>
                      {cfg.fontId===f.id && (<div className="pointer-events-none absolute -inset-[2px] rounded-[14px] border-2 border-ink" />)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <PanelLabel>Justering</PanelLabel>
                  <div className="flex gap-2">
                    {(['center','left'] as Alignment[]).map(a => (
                      <button key={a} onClick={() => update({ alignment: a })}
                        className={cn('flex-1 rounded-xl border px-3 py-2 text-[0.75rem] cursor-pointer transition-all',
                          cfg.alignment===a ? 'border-ink bg-ink text-canvas' : 'text-ink-soft hover:text-ink')}
                        style={{ borderColor: cfg.alignment===a ? undefined : '#e6ded0', background: cfg.alignment===a ? undefined : '#fff' }}>
                        {a==='center' ? 'Centreret' : 'Venstre'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <PanelLabel>Komposition</PanelLabel>
                  <div className="flex gap-1.5">
                    {(['centered','top','spread'] as Composition[]).map(v => (
                      <button key={v} onClick={() => update({ composition: v })}
                        className={cn('flex-1 rounded-xl border px-2 py-2 text-[0.72rem] cursor-pointer transition-all',
                          cfg.composition===v ? 'border-ink bg-ink text-canvas' : 'text-ink-soft hover:text-ink')}
                        style={{ borderColor: cfg.composition===v ? undefined : '#e6ded0', background: cfg.composition===v ? undefined : '#fff' }}>
                        {v==='centered'?'Midt':v==='top'?'Top':'Spredt'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <PanelLabel>Form</PanelLabel>
                  <div className="flex gap-1.5">
                    {([['rectangle','Kant'],['rounded','Rund'],['arched','Bue']] as [Shape,string][]).map(([v,label]) => (
                      <button key={v} onClick={() => update({ shape: v })}
                        className={cn('flex-1 rounded-xl border px-2 py-2 text-[0.72rem] cursor-pointer transition-all',
                          cfg.shape===v ? 'border-ink bg-ink text-canvas' : 'text-ink-soft hover:text-ink')}
                        style={{ borderColor: cfg.shape===v ? undefined : '#e6ded0', background: cfg.shape===v ? undefined : '#fff' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <PanelLabel>Ramme</PanelLabel>
                  <div className="flex gap-1.5">
                    {([['none','Ingen'],['line','Linje'],['botanical','Botanisk']] as [Frame,string][]).map(([v,label]) => (
                      <button key={v} onClick={() => update({ frame: v })}
                        className={cn('flex-1 rounded-xl border px-2 py-2 text-[0.72rem] cursor-pointer transition-all',
                          cfg.frame===v ? 'border-ink bg-ink text-canvas' : 'text-ink-soft hover:text-ink')}
                        style={{ borderColor: cfg.frame===v ? undefined : '#e6ded0', background: cfg.frame===v ? undefined : '#fff' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Envelope */}
              <div className="rule rounded-2xl bg-card p-4">
                <div className="flex items-center justify-between">
                  <PanelLabel>Kuvert-åbning</PanelLabel>
                  <button onClick={() => updateEnvelope({ enabled: !cfg.envelope.enabled })}
                    className={cn('relative h-5 w-9 rounded-full transition-colors cursor-pointer', cfg.envelope.enabled ? 'bg-sage' : 'bg-line-strong')}>
                    <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', cfg.envelope.enabled ? 'left-4' : 'left-0.5')} />
                  </button>
                </div>
                {cfg.envelope.enabled && (
                  <div className="space-y-4">
                    <label className="block">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted mb-2">Segl (initialer)</p>
                      <input value={cfg.envelope.monogram} onChange={e => updateEnvelope({ monogram: e.target.value })} placeholder="C & E"
                        className="w-full rule-b border-0 bg-transparent pb-2 text-[0.95rem] text-ink focus:outline-none" />
                    </label>
                    <label className="block">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted mb-2">Linje på kuverten</p>
                      <input value={cfg.envelope.note} onChange={e => updateEnvelope({ note: e.target.value })} placeholder="A Love Letter From…"
                        className="w-full rule-b border-0 bg-transparent pb-2 text-[0.95rem] text-ink focus:outline-none" />
                    </label>
                    <button onClick={() => { setEnvelopeKey(k => k + 1); setShowEnvelope(true); }}
                      className="flex items-center gap-2 rounded-full rule bg-shell px-4 py-2 text-[0.78rem] text-ink hover:bg-card transition-colors cursor-pointer">
                      <Eye size={13} className="text-muted" /> Se åbningen
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Tekst ──────────────────────────────────────────────────── */}
          {tab==='tekst' && (
            <motion.div key="tekst"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.2 }} className="mt-7 space-y-7">

              <button onClick={handleAva} disabled={avaDraft}
                className="flex w-full items-center gap-3 rounded-2xl rule bg-card p-4 text-left transition-colors hover:bg-shell cursor-pointer disabled:opacity-60 disabled:cursor-default">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-tint">
                  <Sparkles size={15} className="text-ink" />
                </span>
                <div>
                  <span className="block text-[0.88rem] font-medium text-ink">
                    {avaDraft ? 'Ava har skrevet ordlyden' : 'Lad Ava skrive ordlyden'}
                  </span>
                  <span className="block text-[0.75rem] text-muted mt-0.5">
                    {avaDraft ? 'Tilpas frit herunder' : 'Baseret på jeres stil, dato og venue'}
                  </span>
                </div>
                {avaDraft && <Check size={14} className="ml-auto text-sage shrink-0" />}
              </button>

              {([
                { label:'Overlinje', val:cfg.eyebrow, set:(v:string)=>update({ eyebrow:v }), ph:'Vi skal giftes…' },
                { label:'Navne',     val:cfg.names,   set:(v:string)=>update({ names:v }),   ph:`${couple.a} & ${couple.b}` },
                { label:'Venue',     val:cfg.venue,   set:(v:string)=>update({ venue:v }),   ph:'Sonnerupgaard Gods' },
                { label:'Undertekst',val:cfg.closing, set:(v:string)=>update({ closing:v }), ph:'og vi ville elske at fejre dagen med jer…' },
              ]).map(({ label, val, set, ph }) => (
                <label key={label} className="block">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted mb-2">{label}</p>
                  <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full rule-b border-0 bg-transparent pb-2.5 text-[0.95rem] text-ink focus:outline-none" />
                </label>
              ))}

              {/* Date — drives the label + the live countdown */}
              <label className="block">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted mb-2">Dato</p>
                <input type="date" value={cfg.dateISO}
                  onChange={e => update({ dateISO: e.target.value, dateLabel: formatDate(e.target.value) || cfg.dateLabel })}
                  className="w-full rule-b border-0 bg-transparent pb-2.5 text-[0.95rem] text-ink focus:outline-none" />
                <input value={cfg.dateLabel} onChange={e => update({ dateLabel: e.target.value })} placeholder="12. september 2026"
                  className="mt-2 w-full rule-b border-0 bg-transparent pb-2.5 text-[0.95rem] text-ink focus:outline-none" />
              </label>

              {/* Message / our story */}
              <label className="block">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted mb-2">Personlig besked</p>
                <textarea value={cfg.message} onChange={e => update({ message: e.target.value })} rows={4}
                  placeholder="Fortæl kort jeres historie eller en hilsen til gæsterne…"
                  className="w-full rounded-xl rule bg-white px-4 py-3 text-[0.92rem] text-ink focus:outline-none resize-none" />
              </label>

              {/* Photo */}
              <div>
                <PanelLabel>Foto</PanelLabel>
                {photoUrl ? (
                  <div className="relative overflow-hidden rounded-xl rule">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="" className="h-40 w-full object-cover" />
                    <button onClick={() => { update({ photoPath: '' }); setPhotoUrl(null); }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-line-strong)] bg-white px-4 py-6 text-[0.82rem] text-muted hover:text-ink transition-colors">
                    <ImageIcon size={15} /> {uploading ? 'Uploader…' : 'Upload et par-foto'}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPhoto(f); }} />
                  </label>
                )}
                {photoUrl && (
                  <label className="mt-3 flex items-center gap-2 text-[0.86rem] text-ink cursor-pointer">
                    <input type="checkbox" checked={cfg.photoOnCard} onChange={e => update({ photoOnCard: e.target.checked })} />
                    Vis fotoet på selve kortet
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Del ────────────────────────────────────────────────────── */}
          {tab==='del' && (
            <motion.div key="del"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.2 }} className="mt-7 space-y-7">

              {/* Sections toggles */}
              <div>
                <PanelLabel>Vis på invitationen</PanelLabel>
                <div className="space-y-2">
                  {([
                    ['countdown','Nedtælling til dagen', cfg.countdown, (v:boolean)=>update({ countdown:v })],
                    ['showProgram','Program for dagen', cfg.showProgram, (v:boolean)=>update({ showProgram:v })],
                    ['rsvpEnabled','RSVP-svar', cfg.rsvpEnabled, (v:boolean)=>update({ rsvpEnabled:v })],
                  ] as const).map(([id,label,val,set]) => (
                    <div key={id} className="flex items-center justify-between rounded-xl rule bg-card px-4 py-3">
                      <span className="text-[0.86rem] text-ink">{label}</span>
                      <button onClick={() => set(!val)}
                        className={cn('relative h-5 w-9 rounded-full transition-colors cursor-pointer', val ? 'bg-sage' : 'bg-line-strong')}>
                        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', val ? 'left-4' : 'left-0.5')} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {cfg.rsvpEnabled && (
                <div className="space-y-4 rule rounded-2xl bg-card p-4">
                  <label className="block">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted mb-2">RSVP-frist</p>
                    <input value={cfg.rsvpDeadline} onChange={e => update({ rsvpDeadline: e.target.value })} placeholder="1. august 2026"
                      className="w-full rule-b border-0 bg-transparent pb-2 text-[0.95rem] text-ink focus:outline-none" />
                  </label>
                  {([
                    ['rsvpPlusOne','Spørg om ledsager', cfg.rsvpPlusOne, (v:boolean)=>update({ rsvpPlusOne:v })],
                    ['rsvpMeal','Spørg om menuvalg', cfg.rsvpMeal, (v:boolean)=>update({ rsvpMeal:v })],
                    ['rsvpDietary','Spørg om allergier', cfg.rsvpDietary, (v:boolean)=>update({ rsvpDietary:v })],
                  ] as const).map(([id,label,val,set]) => (
                    <label key={id} className="flex items-center gap-2 text-[0.86rem] text-ink cursor-pointer">
                      <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} /> {label}
                    </label>
                  ))}
                </div>
              )}

              {/* Link + publish */}
              <div>
                <PanelLabel>Adresse</PanelLabel>
                <div className="flex items-center gap-1.5 rule rounded-xl bg-white overflow-hidden">
                  <span className="pl-4 text-[0.78rem] text-muted">/i/</span>
                  <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 bg-transparent pr-4 py-2.5 text-[0.85rem] text-ink focus:outline-none" />
                </div>
              </div>

              <button onClick={togglePublish}
                className={cn('flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer',
                  published ? 'bg-sage text-ink' : 'bg-ink text-canvas hover:bg-ink/85')}>
                {published ? '● Live — invitationen er delt' : 'Publicér invitationen'}
              </button>

              {published && (
                <div className="space-y-3">
                  <div>
                    <PanelLabel>Delbart link</PanelLabel>
                    <div className="flex items-center gap-2">
                      <input readOnly value={shareLink} className="flex-1 rule rounded-xl bg-white px-3 py-2.5 text-[0.8rem] text-ink-soft focus:outline-none" />
                      <button onClick={() => copy(shareLink, 'link')}
                        className="flex items-center gap-1.5 rounded-xl rule bg-card px-3 py-2.5 text-[0.78rem] text-ink hover:bg-shell transition-colors cursor-pointer">
                        {copied==='link' ? <Check size={13} className="text-sage" /> : <LinkIcon size={13} className="text-muted" />}
                        {copied==='link' ? 'Kopieret' : 'Kopiér'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <PanelLabel>Personlige gæste-links</PanelLabel>
                    <p className="mb-3 text-[0.78rem] text-muted">
                      Hver gæst får et link, hvor kuverten hilser med deres navn og RSVP er forudfyldt.
                    </p>
                    {guests.length > 0 ? (
                      <>
                        <div className="max-h-52 space-y-1.5 overflow-y-auto">
                          {guests.map((g) => (
                            <div key={g.id} className="flex items-center justify-between gap-2 rounded-xl rule bg-white px-3 py-2">
                              <span className="truncate text-[0.82rem] text-ink">{g.name}</span>
                              <button onClick={() => copy(guestLink(g.rsvp_token), g.id)}
                                className="shrink-0 rounded-lg rule bg-card px-2.5 py-1 text-[0.72rem] text-ink hover:bg-shell transition-colors cursor-pointer">
                                {copied===g.id ? 'Kopieret' : 'Kopiér link'}
                              </button>
                            </div>
                          ))}
                        </div>
                        <button onClick={copyAllGuestLinks}
                          className="mt-3 flex items-center gap-2 rounded-xl rule bg-card px-4 py-2.5 text-[0.8rem] text-ink hover:bg-shell transition-colors cursor-pointer">
                          <Share2 size={13} className="text-muted" /> {copied==='all' ? 'Alle links kopieret' : 'Kopiér alle gæste-links'}
                        </button>
                      </>
                    ) : (
                      <p className="text-[0.8rem] text-muted">Tilføj gæster i Gæsteliste for at få personlige links.</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Mobile preview */}
        <div className="lg:hidden mt-12 pb-8">
          <p className="eyebrow mb-5 text-center">Forhåndsvisning</p>
          <AnimatePresence mode="wait">
            <motion.div key={cardKey} initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.97 }}
              transition={{ duration:0.35, ease:[0.22,1,0.36,1] }} className="mx-auto max-w-[300px]">
              <FlipCard side={side} front={front} back={back} />
            </motion.div>
          </AnimatePresence>
          <div className="mt-5 text-center">
            <button onClick={() => setSide(s => s === 'front' ? 'back' : 'front')}
              className="rounded-full rule bg-card px-5 py-2 text-[0.74rem] text-ink-soft hover:text-ink transition-colors cursor-pointer">
              {side === 'front' ? 'Vend kortet — se bagsiden' : 'Vend tilbage til forsiden'}
            </button>
          </div>
        </div>

        <OnboardingHint id="invites" />
      </div>

      {/* ── Right: sticky stage ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden" style={{ background:'#E9E4DB' }}>
        <p style={{ position:'absolute', top:30, fontSize:11, letterSpacing:'0.32em', textTransform:'uppercase', color:'#9a9082', fontFamily:"'Montserrat',sans-serif" }}>
          Invitation Studio
        </p>
        <AnimatePresence mode="wait">
          <motion.div key={cardKey} initial={{ opacity:0, scale:0.96, y:14 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.96 }}
            transition={{ duration:0.42, ease:[0.22,1,0.36,1] }} style={{ width:'100%', maxWidth:300, padding:'0 20px' }}>
            <FlipCard side={side} front={front} back={back} />
          </motion.div>
        </AnimatePresence>
        <p style={{ position:'absolute', bottom:30, fontSize:11, letterSpacing:'0.04em', color:'#a79e90', fontStyle:'italic', fontFamily:"'EB Garamond',serif" }}>
          {pal.name} · {font.name}
        </p>
        <div className="absolute bottom-12 flex items-center gap-2.5">
          <button onClick={() => setSide(s => s === 'front' ? 'back' : 'front')}
            className="rounded-full bg-ink px-4 py-1.5 text-[0.7rem] text-canvas hover:opacity-85 transition-opacity cursor-pointer">
            {side === 'front' ? 'Vend kortet' : 'Se forsiden'}
          </button>
          <button onClick={() => { setEnvelopeKey(k => k + 1); setShowEnvelope(true); }}
            className="rounded-full rule bg-card/80 px-4 py-1.5 text-[0.7rem] text-ink-soft hover:text-ink transition-colors cursor-pointer backdrop-blur-sm">
            Se åbningen
          </button>
        </div>
      </div>

      {/* Envelope opening preview (full-screen) */}
      {showEnvelope && (
        <div className="fixed inset-0 z-[80]">
          <EnvelopeReveal key={envelopeKey} paletteId={cfg.paletteId} fontId={cfg.fontId}
            monogram={cfg.envelope.monogram} note={cfg.envelope.note} names={cfg.names} persistKey={null}>
            <div style={{ minHeight:'100vh', background:pal.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
              <div style={{ width:'100%', maxWidth:300 }}>{front}</div>
            </div>
          </EnvelopeReveal>
          <button onClick={() => setShowEnvelope(false)}
            className="fixed right-5 top-5 z-[90] flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
