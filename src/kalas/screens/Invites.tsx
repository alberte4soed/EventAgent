"use client";

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Send, Shuffle, Download, Share2, Mail } from 'lucide-react';
import { useWedding } from '../useWedding';
import { Eyebrow, Pill, cn } from '../ui';
import OnboardingHint from '../OnboardingHint';
import { suggestedQuantity } from '@/lib/invites';

interface InviteCouple { a: string; b: string; dateLabel: string; guests: number }

/* ─── Load extra Google Fonts for pairings ─────────────────────────── */
function useInviteFonts() {
  useEffect(() => {
    const id = 'invite-studio-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Serif+Display&family=Marcellus&family=Bodoni+Moda:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;500&family=Italiana&family=Pinyon+Script&family=Parisienne&family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@300;400;500&family=Mulish:wght@300;400;500&family=DM+Sans:wght@300;400;500&family=Jost:wght@300;400;500&family=Nunito+Sans:wght@300;400&family=Lato:wght@300;400&family=Tenor+Sans&display=swap';
    document.head.appendChild(link);
  }, []);
}

/* ─── Palettes — exact 8 from screenshots ──────────────────────────── */
const PALETTES = [
  { id: 'champagne',   name: 'Champagne',    bg: '#faf6ef', soft: '#ede5d4', accent: '#b89650', ink: '#1c1814' },
  { id: 'ivory-gold',  name: 'Ivory & Gold',  bg: '#fdfaf5', soft: '#f4e8cc', accent: '#c9a227', ink: '#1a1814' },
  { id: 'black-tie',   name: 'Black Tie',     bg: '#fafafa', soft: '#e8e6e0', accent: '#c9a227', ink: '#0e0e0c' },
  { id: 'greige',      name: 'Greige',        bg: '#f2ece4', soft: '#ddd5c8', accent: '#8a7a68', ink: '#2c2820' },
  { id: 'mono',        name: 'Mono',          bg: '#fafaf8', soft: '#e0e0dc', accent: '#6e6e68', ink: '#141414' },
  { id: 'slate',       name: 'Slate',         bg: '#eef2f6', soft: '#c8d4e4', accent: '#4a6480', ink: '#1a2434' },
  { id: 'blush',       name: 'Blush',         bg: '#fdf2f0', soft: '#f4cecc', accent: '#c06058', ink: '#280a08' },
  { id: 'lavender',    name: 'Lavender',      bg: '#f6f2fc', soft: '#e0d4f4', accent: '#7040b0', ink: '#28103e' },
  /* Kalas-brand extras */
  { id: 'botanisk',    name: 'Botanisk',      bg: '#e8edd8', soft: '#d4e0c0', accent: '#6a7e5a', ink: '#2e3325' },
  { id: 'forest',      name: 'Dyb Skov',      bg: '#3a4f37', soft: '#2e3d2c', accent: '#d4c89a', ink: '#f3f1e6' },
  { id: 'rose',        name: 'Rose & Skov',   bg: '#faf3ee', soft: '#f0e0d4', accent: '#a87e72', ink: '#3a4f37' },
  { id: 'midnight',    name: 'Midnight',      bg: '#1a1a2e', soft: '#252540', accent: '#c9a227', ink: '#f2f2f0' },
] as const;
type PaletteId = typeof PALETTES[number]['id'];

/* ─── Font pairings ─────────────────────────────────────────────────── */
/* `cq` = headline size in cqw (percent of card width) so text always fits. */
const FONTS = [
  { id: 'cormorant',   name: 'Cormorant',     head: "'Cormorant Garamond',serif",   body: "'Montserrat',sans-serif",    w: 500, sp: '-0.01em', sz: '2.6rem', cq: 12.5 },
  { id: 'playfair',    name: 'Playfair',      head: "'Playfair Display',serif",      body: "'Mulish',sans-serif",        w: 500, sp: '-0.01em', sz: '2.4rem', cq: 11.5 },
  { id: 'dm-serif',    name: 'DM Serif',      head: "'DM Serif Display',serif",      body: "'DM Sans',sans-serif",       w: 400, sp: '0',       sz: '2.4rem', cq: 11.5 },
  { id: 'marcellus',   name: 'Marcellus',     head: "'Marcellus',serif",             body: "'Jost',sans-serif",          w: 400, sp: '0.04em',  sz: '2.2rem', cq: 10.5 },
  { id: 'bodoni',      name: 'Bodoni',        head: "'Bodoni Moda',serif",           body: "'Nunito Sans',sans-serif",   w: 500, sp: '0.02em',  sz: '2.2rem', cq: 10.5 },
  { id: 'eb-garamond', name: 'EB Garamond',   head: "'EB Garamond',serif",           body: "'Lato',sans-serif",          w: 400, sp: '-0.01em', sz: '2.6rem', cq: 12.5 },
  { id: 'cinzel',      name: 'Cinzel',        head: "'Cinzel',serif",                body: "'Montserrat',sans-serif",    w: 400, sp: '0.08em',  sz: '1.9rem', cq: 9 },
  { id: 'italiana',    name: 'Italiana',      head: "'Italiana',serif",              body: "'Montserrat',sans-serif",    w: 400, sp: '0.02em',  sz: '2.6rem', cq: 12.5 },
  { id: 'pinyon',      name: 'Pinyon Script', head: "'Pinyon Script',cursive",       body: "'Tenor Sans',sans-serif",    w: 400, sp: '0.01em',  sz: '3.2rem', cq: 14.5 },
  { id: 'parisienne',  name: 'Parisienne',    head: "'Parisienne',cursive",          body: "'Libre Baskerville',serif",  w: 400, sp: '0.01em',  sz: '2.8rem', cq: 13 },
] as const;
type FontId = typeof FONTS[number]['id'];

/* ─── Paper ─────────────────────────────────────────────────────────── */
const PAPERS = [
  { id: 'digital',     name: 'Digital',      desc: 'Gratis · Send via email',       price: 'Inkluderet'   },
  { id: 'cotton',      name: 'Bomuldspapir', desc: '300g · Håndtrykt feel',         price: 'Fra 8 kr./stk' },
  { id: 'letterpress', name: 'Letterpress',  desc: 'Håndpresset · dybde i trykket', price: 'Fra 25 kr./stk'},
] as const;

type Tab = 'design' | 'tekst' | 'afsend';

/* ─── Ava's curated starting points — one tap applies the whole look ─── */
const PRESETS: Array<{
  id: string; name: string; desc: string;
  pal: PaletteId; font: FontId;
  align: 'center' | 'left'; comp: 'centered' | 'top' | 'spread';
}> = [
  { id: 'botanisk',  name: 'Botanisk',   desc: 'Grønt, roligt, jeres stil',   pal: 'botanisk',  font: 'cormorant',  align: 'center', comp: 'centered' },
  { id: 'editorial', name: 'Editorial',  desc: 'Sort/hvid, skarpt, moderne',  pal: 'black-tie', font: 'italiana',   align: 'center', comp: 'centered' },
  { id: 'romantisk', name: 'Romantisk',  desc: 'Blush, script, blødt',        pal: 'blush',     font: 'pinyon',     align: 'center', comp: 'centered' },
  { id: 'klassisk',  name: 'Klassisk',   desc: 'Champagne og guld',           pal: 'ivory-gold',font: 'playfair',   align: 'left',   comp: 'top' },
  { id: 'noir',      name: 'Noir',       desc: 'Mørk, festlig, dramatisk',    pal: 'midnight',  font: 'bodoni',     align: 'center', comp: 'spread' },
];

/* ─── Card ──────────────────────────────────────────────────────────── */
function InviteCard({
  paletteId, fontId,
  alignment, composition,
  eyebrow, names, date, venue, closing,
}: {
  paletteId: PaletteId; fontId: FontId;
  alignment: 'center' | 'left';
  composition: 'centered' | 'top' | 'spread';
  eyebrow: string; names: string; date: string; venue: string; closing: string;
}) {
  const pal  = PALETTES.find(p => p.id === paletteId) ?? PALETTES[0];
  const font = FONTS.find(f => f.id === fontId) ?? FONTS[0];

  const topP    = composition === 'top' ? 48 : 60;
  const bottomP = composition === 'top' ? 44 : 60;

  const jc   = composition === 'centered' ? 'center' : composition === 'top' ? 'flex-start' : 'space-between';
  const ta   = alignment === 'center' ? 'center' : 'left';
  const ai   = alignment === 'center' ? 'center' : 'flex-start';

  return (
    <div style={{
      position:'relative', overflow:'hidden',
      aspectRatio:'5/8',
      background: pal.bg,
      borderRadius: 3,
      boxShadow: '0 32px 80px -8px rgba(0,0,0,0.20), 0 8px 28px -4px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        position:'relative', zIndex:2, height:'100%',
        display:'flex', flexDirection:'column',
        alignItems: ai, justifyContent: jc,
        textAlign: ta,
        gap: 11,
        padding: `${topP}px 30px ${bottomP}px`,
      }}>
        {/* Eyebrow */}
        <p style={{ fontFamily: font.body, fontSize:9.5, fontWeight:500, letterSpacing:'0.38em', textTransform:'uppercase', color:pal.accent, margin:0 }}>
          {eyebrow}
        </p>

        {/* Names — the hero */}
        <p style={{ fontFamily:font.head, fontWeight:font.w, fontSize:font.sz, letterSpacing:font.sp, lineHeight:1.06, color:pal.ink, margin:0 }}>
          {names}
        </p>

        {/* Ornamental rule below names */}
        <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent: alignment==='center'?'center':'flex-start' }}>
          <span style={{ width:20, height:'0.5px', background:pal.accent, opacity:0.5, display:'block' }}/>
          <span style={{ width:4, height:4, borderRadius:'50%', background:pal.accent, opacity:0.4, display:'block' }}/>
          <span style={{ width:20, height:'0.5px', background:pal.accent, opacity:0.5, display:'block' }}/>
        </div>

        {/* Date — serif for elegance */}
        <p style={{ fontFamily:font.head, fontSize:15, fontWeight:400, letterSpacing:'0.01em', color:pal.ink, margin:0 }}>
          {date}
        </p>

        {/* Venue — small caps sans */}
        <p style={{ fontFamily:font.body, fontSize:10, fontWeight:500, letterSpacing:'0.22em', textTransform:'uppercase', color:pal.ink, opacity:0.6, margin:0 }}>
          {venue}
        </p>

        {/* Closing — italic serif in accent */}
        <p style={{ fontFamily:font.head, fontStyle:'italic', fontSize:14, fontWeight:400, color:pal.accent, opacity:0.88, margin:0 }}>
          {closing}
        </p>
      </div>
    </div>
  );
}

/* ─── Card back — program + RSVP, same palette & type ───────────────── */
function InviteBack({ paletteId, fontId, domain }: { paletteId: PaletteId; fontId: FontId; domain: string }) {
  const pal  = PALETTES.find(p => p.id === paletteId) ?? PALETTES[0];
  const font = FONTS.find(f => f.id === fontId) ?? FONTS[0];

  const row = (time: string, label: string) => (
    <div key={time} style={{ display:'flex', alignItems:'baseline', gap:12, justifyContent:'center' }}>
      <span style={{ fontFamily:font.body, fontSize:9.5, letterSpacing:'0.12em', color:pal.ink, opacity:0.5, width:34, textAlign:'right' }}>{time}</span>
      <span style={{ width:3, height:3, borderRadius:'50%', background:pal.accent, opacity:0.6, alignSelf:'center' }} />
      <span style={{ fontFamily:font.head, fontSize:13.5, color:pal.ink, width:120, textAlign:'left' }}>{label}</span>
    </div>
  );

  return (
    <div style={{
      position:'relative', overflow:'hidden', aspectRatio:'5/8',
      background: pal.bg, borderRadius: 3,
      boxShadow: '0 32px 80px -8px rgba(0,0,0,0.20), 0 8px 28px -4px rgba(0,0,0,0.10)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap: 18, padding: '48px 28px', textAlign:'center',
    }}>
      <div style={{ position:'absolute', inset:14, border:`0.75px solid ${pal.accent}`, opacity:0.35, pointerEvents:'none' }} />

      <p style={{ fontFamily:font.body, fontSize:9, fontWeight:500, letterSpacing:'0.38em', textTransform:'uppercase', color:pal.accent, margin:0 }}>
        Program for dagen
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {row('14:00', 'Vielse')}
        {row('15:30', 'Velkomst')}
        {row('18:00', 'Middag')}
        {row('22:00', 'Fest & dans')}
      </div>

      <div style={{ width:26, height:'0.5px', background:pal.accent, opacity:0.5 }} />

      <div>
        <p style={{ fontFamily:font.body, fontSize:8.5, fontWeight:500, letterSpacing:'0.3em', textTransform:'uppercase', color:pal.accent, margin:0 }}>
          RSVP senest 1. august
        </p>
        <p style={{ fontFamily:font.head, fontSize:14, color:pal.ink, margin:'8px 0 0' }}>
          {domain}
        </p>
        <p style={{ fontFamily:font.head, fontStyle:'italic', fontSize:12.5, color:pal.ink, opacity:0.6, margin:'6px 0 0' }}>
          — svar, menu og overnatning
        </p>
      </div>

      {/* QR placeholder */}
      <svg viewBox="0 0 44 44" width="40" style={{ color:pal.ink, opacity:0.75 }} fill="currentColor">
        <rect x="0" y="0" width="14" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.4"/>
        <rect x="4.5" y="4.5" width="5" height="5"/>
        <rect x="30" y="0" width="14" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.4"/>
        <rect x="34.5" y="4.5" width="5" height="5"/>
        <rect x="0" y="30" width="14" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.4"/>
        <rect x="4.5" y="34.5" width="5" height="5"/>
        <rect x="20" y="4" width="4" height="4"/><rect x="20" y="12" width="4" height="4"/>
        <rect x="26" y="20" width="4" height="4"/><rect x="34" y="20" width="4" height="4"/>
        <rect x="20" y="26" width="4" height="4"/><rect x="30" y="30" width="4" height="4"/>
        <rect x="38" y="34" width="4" height="4"/><rect x="22" y="36" width="4" height="4"/>
      </svg>
    </div>
  );
}

/* ─── Flip container — front/back with 3D turn ──────────────────────── */
function FlipCard({ side, front, back }: { side: 'front' | 'back'; front: ReactNode; back: ReactNode }) {
  return (
    <div style={{ perspective: 1400 }}>
      <motion.div
        animate={{ rotateY: side === 'back' ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        style={{ transformStyle: 'preserve-3d', position: 'relative' }}
      >
        <div style={{ backfaceVisibility: 'hidden' }}>{front}</div>
        <div style={{ position:'absolute', inset:0, transform:'rotateY(180deg)', backfaceVisibility:'hidden' }}>{back}</div>
      </motion.div>
    </div>
  );
}

/* ─── Panel label ───────────────────────────────────────────────────── */
function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize:11, letterSpacing:'0.22em', textTransform:'uppercase', color:'#a59b89', fontWeight:600, marginBottom:13, fontFamily:"'Montserrat',sans-serif" }}>
      {children}
    </p>
  );
}

const rand = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

/* ══════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════ */
export default function Invites() {
  const { loading, couple, venues, event } = useWedding();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-[0.85rem] text-muted">Indlæser…</div>;
  }
  const chosen =
    venues.find((v) => v.id === event?.chosen_venue_id) ??
    venues.find((v) => v.category === 'venue' && v.swipe_status === 'liked');
  return (
    <InvitesStudio
      couple={{ a: couple.a, b: couple.b, dateLabel: couple.dateLabel, guests: couple.guests }}
      venueName={chosen?.name ?? ''}
      eventId={event?.id ?? null}
    />
  );
}

function InvitesStudio({ couple, venueName, eventId }: { couple: InviteCouple; venueName: string; eventId: string | null }) {
  useInviteFonts();

  const [mode,      setMode]   = useState<'browse' | 'edit'>('browse');
  const [tab,       setTab]    = useState<Tab>('design');
  const [paletteId, setPal]    = useState<PaletteId>('ivory-gold');
  const [fontId,    setFont]   = useState<FontId>('playfair');
  const [alignment, setAlign]  = useState<'center'|'left'>('left');
  const [comp,      setComp]   = useState<'centered'|'top'|'spread'>('top');
  const [paperId,   setPaper]  = useState('digital');
  const [avaDraft,  setAva]    = useState(false);
  const [sent,      setSent]   = useState(false);
  const [busy,      setBusy]   = useState(false);
  const [side,      setSide]   = useState<'front' | 'back'>('front');
  const [presetId,  setPreset] = useState<string | null>(null);

  const [eyebrow, setEyebrow] = useState('Vi skal giftes');
  const [names,   setNames]   = useState(couple.b ? `${couple.a} & ${couple.b}` : couple.a || 'Vores navne');
  const [date,    setDate]    = useState(couple.dateLabel || 'Vores dato');
  const [venue,   setVenue]   = useState(venueName || 'Vores venue');
  const [closing, setClosing] = useState('og vi ville elske at fejre dagen med jer');

  const domain = `${(couple.a || 'os').toLowerCase()}${couple.b ? `-${couple.b.toLowerCase()}` : ''}.kalas.dk`;

  async function submitOrder() {
    if (paperId === 'digital' || !eventId) { setSent(true); return; }
    setBusy(true);
    try {
      const wording = [eyebrow, names, date, venue, closing].filter(Boolean).join('\n');
      const res = await fetch('/api/invites/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          style: `${paletteId} · ${fontId}`,
          palette: paletteId,
          wording,
          quantity: suggestedQuantity(couple.guests || null),
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; return; }
      // Stripe not configured yet (503) — mark queued locally so the flow isn't blocked.
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  const applyPreset = (p: typeof PRESETS[number]) => {
    setPreset(p.id);
    setPal(p.pal); setFont(p.font);
    setAlign(p.align); setComp(p.comp);
  };

  const pal   = PALETTES.find(p => p.id === paletteId) ?? PALETTES[0];
  const font  = FONTS.find(f => f.id === fontId) ?? FONTS[0];
  const paper = PAPERS.find(p => p.id === paperId) ?? PAPERS[0];

  const cardKey = `${paletteId}-${fontId}-${alignment}-${comp}`;

  const shuffle = () => {
    setPal(rand(PALETTES).id);
    setFont(rand(FONTS).id);
  };

  const handleAva = () => {
    setAva(true);
    setTimeout(() => {
      setEyebrow('Vi skal giftes');
      setClosing('og det ville betyde alt for os at have jer med. Svar via linket på bagsiden.');
    }, 900);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id:'design', label:'Design'  },
    { id:'tekst',  label:'Tekst'   },
    { id:'afsend', label:'Afsend'  },
  ];

  /* ── Browse mode — pick a design like flipping through paper samples ── */
  if (mode === 'browse') {
    return (
      <div className="min-h-full px-6 py-10 sm:px-10 lg:px-16 lg:py-14">
        <div className="max-w-2xl">
          <p className="max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
            Fem designs sat med jeres navne og dato. Vælg det der føles rigtigt —
            alt kan tilpasses bagefter.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-8">
          {PRESETS.map((p, i) => (
            <motion.button key={p.id}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => { applyPreset(p); setMode('edit'); }}
              className="group text-left cursor-pointer">
              <div className="transition-transform duration-300 group-hover:-translate-y-2">
                <InviteCard
                  paletteId={p.pal} fontId={p.font}
                  alignment={p.align} composition={p.comp}
                  eyebrow={eyebrow} names={names} date={date} venue={venue} closing={closing}
                />
              </div>
              <p className="mt-4 font-serif text-[1.1rem] text-ink">{p.name}</p>
              <p className="mt-0.5 text-[0.76rem] text-muted leading-snug">{p.desc}</p>
              <p className="mt-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity">
                Tilpas dette design →
              </p>
            </motion.button>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-3 rule-t pt-8">
          <button onClick={() => { setPreset(null); setMode('edit'); }}
            className="h-8 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.12em] text-canvas hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: 'var(--color-terracotta)' }}>
            Byg fra bunden
          </button>
          <button onClick={() => { setPreset(null); shuffle(); setMode('edit'); }}
            className="flex h-8 items-center gap-1.5 rounded-full rule px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink hover:bg-card transition-colors cursor-pointer">
            <Shuffle size={12} /> Overrask mig
          </button>
        </div>
        <OnboardingHint id="invites" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_360px]">

      {/* ── Left: studio panel ─────────────────────────────────────── */}
      <div className="px-6 py-8 sm:px-10 lg:px-12 lg:py-10" style={{ background:'#FBF9F5' }}>

        {/* Header */}
        <button onClick={() => setMode('browse')}
          className="mb-5 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-muted hover:text-ink transition-colors cursor-pointer">
          ← Alle designs
        </button>
        <h1 className="display text-[clamp(1.8rem,3.5vw,2.6rem)] text-ink leading-tight">
          {presetId ? PRESETS.find(p => p.id === presetId)?.name : 'Jeres design'}<span className="italic">.</span>
        </h1>
        <p className="mt-2 max-w-sm text-[0.85rem] leading-relaxed text-muted">
          Tilpas palette, typografi og motiv — kortet opdateres live til højre.
        </p>

        {/* Shuffle */}
        <button onClick={() => { setPreset(null); shuffle(); }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-canvas transition-opacity hover:opacity-85 cursor-pointer">
          <Shuffle size={12} /> Overrask mig
        </button>

        {/* Tabs */}
        <div className="mt-7 flex rule-b">
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                'relative pb-3 pr-6 text-[0.8rem] font-medium cursor-pointer transition-colors',
                tab===id ? 'text-ink' : 'text-muted hover:text-ink-soft',
              )}>
              {label}
              {tab===id && (
                <motion.span layoutId="inv-tab"
                  className="absolute bottom-0 left-0 h-px bg-ink"
                  style={{ right:'1.5rem' }}
                  transition={{ type:'spring', stiffness:380, damping:34 }} />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Design ──────────────────────────────────────────────── */}
          {tab==='design' && (
            <motion.div key="design"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.2 }} className="mt-7 space-y-8">

              {/* Colour palette */}
              <div>
                <PanelLabel>Farvepalette</PanelLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {PALETTES.map(p => (
                    <div key={p.id} className="relative">
                      <button onClick={() => setPal(p.id)}
                        className="w-full overflow-hidden rounded-xl cursor-pointer block transition-all"
                        style={{ border:'1px solid #e6ded0', background:'#fff' }}>
                        <div className="flex h-10">
                          {[p.bg, p.soft, p.accent, p.ink].map((c,i) => (
                            <div key={i} className="flex-1" style={{ background:c }} />
                          ))}
                        </div>
                        <div className="px-2.5 py-1.5 text-left"
                          style={{ fontFamily:"'Montserrat',sans-serif", fontSize:11, fontWeight:500, color:'#5e564a', letterSpacing:'0.02em' }}>
                          {p.name}
                        </div>
                      </button>
                      {paletteId===p.id && (
                        <div className="pointer-events-none absolute -inset-[2px] rounded-[14px] border-2 border-ink" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <PanelLabel>Typografi</PanelLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {FONTS.map(f => (
                    <div key={f.id} className="relative">
                      <button onClick={() => setFont(f.id)}
                        className="w-full rounded-xl px-3 py-3 text-left cursor-pointer block transition-all overflow-hidden"
                        style={{ border:'1px solid #e6ded0', background:'#fff' }}>
                        <div className="truncate text-[1.35rem] leading-[1.1] mb-1.5" style={{ fontFamily:f.head, fontWeight:f.w, color:'#2a261f' }}>
                          {names}
                        </div>
                        <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'#a39a89' }}>
                          {f.name}
                        </div>
                      </button>
                      {fontId===f.id && (
                        <div className="pointer-events-none absolute -inset-[2px] rounded-[14px] border-2 border-ink" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alignment + Composition */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <PanelLabel>Justering</PanelLabel>
                  <div className="flex gap-2">
                    {(['center','left'] as const).map(a => (
                      <button key={a} onClick={() => setAlign(a)}
                        className={cn('flex-1 rounded-xl border px-3 py-2 text-[0.75rem] cursor-pointer transition-all',
                          alignment===a ? 'border-ink bg-ink text-canvas' : 'text-ink-soft hover:text-ink')}
                        style={{ borderColor: alignment===a ? undefined : '#e6ded0', background: alignment===a ? undefined : '#fff' }}>
                        {a==='center' ? 'Centreret' : 'Venstre'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <PanelLabel>Komposition</PanelLabel>
                  <div className="flex gap-1.5">
                    {(['centered','top','spread'] as const).map(v => (
                      <button key={v} onClick={() => setComp(v)}
                        className={cn('flex-1 rounded-xl border px-2 py-2 text-[0.72rem] cursor-pointer transition-all',
                          comp===v ? 'border-ink bg-ink text-canvas' : 'text-ink-soft hover:text-ink')}
                        style={{ borderColor: comp===v ? undefined : '#e6ded0', background: comp===v ? undefined : '#fff' }}>
                        {v==='centered'?'Midt':v==='top'?'Top':'Spredt'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Tekst ───────────────────────────────────────────────── */}
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

              {[
                { label:'Overlinje',  val:eyebrow, set:setEyebrow, ph:'Vi skal giftes…' },
                { label:'Navne',      val:names,   set:setNames,   ph:`${couple.a} & ${couple.b}` },
                { label:'Dato',       val:date,    set:setDate,    ph:'12. september 2026' },
                { label:'Venue',      val:venue,   set:setVenue,   ph:'Sonnerupgaard Gods' },
                { label:'Undertekst', val:closing, set:setClosing, ph:'og vi ville elske at fejre dagen med jer…' },
              ].map(({ label, val, set, ph }) => (
                <label key={label} className="block">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted mb-2">{label}</p>
                  <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full rule-b border-0 bg-transparent pb-2.5 text-[0.95rem] text-ink focus:outline-none" />
                </label>
              ))}
            </motion.div>
          )}

          {/* ── Afsend ──────────────────────────────────────────────── */}
          {tab==='afsend' && (
            <motion.div key="afsend"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.2 }} className="mt-7 space-y-7">

              <div>
                <PanelLabel>Format</PanelLabel>
                <div className="space-y-2">
                  {PAPERS.map(p => (
                    <button key={p.id} onClick={() => setPaper(p.id)}
                      className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left cursor-pointer rule transition-all',
                        paperId===p.id ? 'bg-card ring-1 ring-ink/20' : 'bg-transparent hover:bg-card/50')}>
                      <div>
                        <span className="block text-[0.88rem] text-ink">{p.name}</span>
                        <span className="block text-[0.72rem] text-muted mt-0.5">{p.desc}</span>
                      </div>
                      <div className="shrink-0 ml-4 text-right">
                        <span className="block text-[0.76rem] text-ink-soft">{p.price}</span>
                        {paperId===p.id && <Check size={12} className="ml-auto mt-1 text-sage" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {paperId!=='digital' && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  className="rule rounded-2xl bg-card px-5 py-4">
                  <Eyebrow>Om {paper.name}</Eyebrow>
                  <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-soft">{paper.desc} · Levering 10–14 dage</p>
                  <p className="mt-2 font-serif text-[1.05rem] text-ink">
                    {paper.price} · {couple.guests} stk ≈ {paperId==='cotton' ? couple.guests*8 : couple.guests*25}.– kr
                  </p>
                </motion.div>
              )}

              <div>
                <PanelLabel>Del invitationen</PanelLabel>
                <div className="grid grid-cols-2 gap-2">
                  {([[Mail,'Via email'],[Share2,'Del link']] as const).map(([Icon,label]) => (
                    <button key={label} className="flex items-center gap-2 rounded-xl rule bg-card px-4 py-3 text-[0.8rem] text-ink hover:bg-shell transition-colors cursor-pointer">
                      <Icon size={13} className="text-muted" />{label}
                    </button>
                  ))}
                  <button className="col-span-2 flex items-center gap-2 rounded-xl rule bg-card px-4 py-3 text-[0.8rem] text-ink hover:bg-shell transition-colors cursor-pointer">
                    <Download size={13} className="text-muted" /> Download som PDF
                  </button>
                </div>
              </div>

              <div className="rule-t pt-6">
                <Pill arrow onClick={() => { if (!busy && !sent) void submitOrder(); }} className="w-full">
                  {sent
                    ? <><Check size={15}/> {paperId==='digital' ? `Klar til ${couple.guests} gæster` : 'Bestilling registreret'}</>
                    : busy
                      ? <>Behandler…</>
                      : <><Send size={15}/> {paperId==='digital' ? 'Godkend' : 'Godkend & bestil tryk'}</>}
                </Pill>
                <p className="mt-3 text-center text-[0.74rem] text-muted">
                  {paperId==='digital'
                    ? 'Digital deling — RSVP kommer snart'
                    : `${paper.name} trykkes og afsendes af Kalas Atelier`}
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Mobile card preview */}
        <div className="lg:hidden mt-12 pb-8">
          <p className="eyebrow mb-5 text-center">Forhåndsvisning</p>
          <AnimatePresence mode="wait">
            <motion.div key={cardKey}
              initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.97 }}
              transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
              className="mx-auto max-w-[300px]">
              <FlipCard side={side}
                front={<InviteCard {...{ paletteId, fontId, alignment, composition:comp, eyebrow, names, date, venue, closing }} />}
                back={<InviteBack paletteId={paletteId} fontId={fontId} domain={domain} />}
              />
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

      {/* ── Right: sticky stage ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden"
        style={{ background:'#E9E4DB' }}>

        {/* "Invitation Studio" label above card */}
        <p style={{
          position:'absolute', top:30,
          fontSize:11, letterSpacing:'0.32em', textTransform:'uppercase',
          color:'#9a9082', fontFamily:"'Montserrat',sans-serif",
        }}>
          Invitation Studio
        </p>

        {/* Card — front/back flip */}
        <AnimatePresence mode="wait">
          <motion.div key={cardKey}
            initial={{ opacity:0, scale:0.96, y:14 }} animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.96 }}
            transition={{ duration:0.42, ease:[0.22,1,0.36,1] }}
            style={{ width:'100%', maxWidth:300, padding:'0 20px' }}>
            <FlipCard side={side}
              front={<InviteCard {...{ paletteId, fontId, alignment, composition:comp, eyebrow, names, date, venue, closing }} />}
              back={<InviteBack paletteId={paletteId} fontId={fontId} domain={domain} />}
            />
          </motion.div>
        </AnimatePresence>

        {/* Hint below */}
        <p style={{
          position:'absolute', bottom:30,
          fontSize:11, letterSpacing:'0.04em', color:'#a79e90',
          fontStyle:'italic', fontFamily:"'EB Garamond',serif",
        }}>
          {pal.name} · {font.name}
        </p>

        {/* Quick-action chips */}
        <div className="absolute bottom-12 flex items-center gap-2.5">
          <button onClick={() => setSide(s => s === 'front' ? 'back' : 'front')}
            className="rounded-full bg-ink px-4 py-1.5 text-[0.7rem] text-canvas hover:opacity-85 transition-opacity cursor-pointer">
            {side === 'front' ? 'Vend kortet' : 'Se forsiden'}
          </button>
          <button onClick={() => setTab('tekst')}
            className="rounded-full rule bg-card/80 px-4 py-1.5 text-[0.7rem] text-ink-soft hover:text-ink transition-colors cursor-pointer backdrop-blur-sm">
            Rediger tekst
          </button>
          <button onClick={() => setTab('afsend')}
            className="rounded-full rule bg-card/80 px-4 py-1.5 text-[0.7rem] text-ink-soft hover:text-ink transition-colors cursor-pointer backdrop-blur-sm">
            Send
          </button>
        </div>
      </div>

    </div>
  );
}
