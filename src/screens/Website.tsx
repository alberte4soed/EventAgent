import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, Globe, Smartphone, Plus, X, ChevronDown, Trash2,
  Lock, Copy, Eye, EyeOff, MapPin, Gift, HelpCircle, Bed,
  Camera, Clock, BookOpen, Image, QrCode,
} from 'lucide-react';
import { IMAGES as IMG, couple, moodboard, guests, TODAY } from '../data';
import { Eyebrow, cn } from '../ui';
import OnboardingHint from '../OnboardingHint';

/* ── Types ───────────────────────────────────────────────────────────── */
type ProgramEvent = { id: string; time: string; label: string; sublabel: string };
type FAQItem      = { id: string; q: string; a: string };
type HotelItem    = { id: string; name: string; dist: string; price: string };
type SectionId    = 'hero' | 'story' | 'program' | 'rsvp' | 'gallery' | 'transport' | 'dresscode' | 'gifts' | 'hotel' | 'faq' | 'photos';
type SectionMeta  = { id: SectionId; label: string; desc: string; enabled: boolean; locked?: boolean };
type WTab         = 'design' | 'indhold' | 'indstillinger';

/* ── Lenses ──────────────────────────────────────────────────────────── */
const LENSES = [
  { id: 'editorial',  name: 'The Editorial',  tagline: 'Magasin-grid, store overskrifter, sat i serif.', image: 'invitation' as const, dark: false },
  { id: 'minimalist', name: 'The Minimalist', tagline: 'Luft, ro og næsten ingenting.',                   image: 'rings'      as const, dark: false },
  { id: 'organic',    name: 'The Organic',    tagline: 'Jordnær, botanisk og varm fornemmelse.',          image: 'olive'      as const, dark: false },
  { id: 'garden',     name: 'The Garden',     tagline: 'Lyst orangeri, grønt overalt.',                  image: 'orangeri'   as const, dark: false },
  { id: 'waterside',  name: 'The Waterside',  tagline: 'Skumring ved vandet, varmt lys.',                image: 'lavender'   as const, dark: false },
  { id: 'noir',       name: 'Noir',           tagline: 'Mørk, dramatisk og luksuriøs.',                  image: 'candles'    as const, dark: true  },
  { id: 'botanical',  name: 'Botanical',      tagline: 'Blomster overalt, sommerhave-stemning.',         image: 'florals'    as const, dark: false },
  { id: 'ceremony',   name: 'The Ceremony',   tagline: 'Højtideligt, naturelt og klassisk.',             image: 'ceremony'   as const, dark: false },
];

/* ── Colors ──────────────────────────────────────────────────────────── */
type WebColor = { id: string; name: string; bg: string; text: string; accent: string; detail: string };
const WEBSITE_COLORS: WebColor[] = [
  { id: 'oat-forest',  name: 'OAT &\nFOREST',   bg: '#F2EDE4', text: '#2C3826', accent: '#AEB080', detail: '#4A4E3C' },
  { id: 'paper-noir',  name: 'PAPER &\nNOIR',    bg: '#FAFAF8', text: '#1A1A16', accent: '#C8C4B8', detail: '#3D3D38' },
  { id: 'clay-sand',   name: 'CLAY &\nSAND',     bg: '#F0E8DC', text: '#4A2E1A', accent: '#C17B5C', detail: '#6B3E2A' },
  { id: 'garden',      name: 'GARDEN',            bg: '#ECF2E6', text: '#2A3D1E', accent: '#7DAA5A', detail: '#3D5C2A' },
  { id: 'waterside',   name: 'WATERSIDE',         bg: '#E8EFF5', text: '#1E3042', accent: '#7AA4C2', detail: '#2E5C82' },
  { id: 'blush',       name: 'BLUSH',             bg: '#F7EDEB', text: '#3D1E24', accent: '#C28A90', detail: '#6B3A42' },
];

/* ── Fonts ───────────────────────────────────────────────────────────── */
type WebFont = { id: string; name: string; pairs: string; style: React.CSSProperties };
const FONTS: WebFont[] = [
  { id: 'editorial-serif',  name: 'Editorial Serif',  pairs: 'Cormorant Garamond · Inter',     style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.35rem' } },
  { id: 'klassisk-magasin', name: 'Klassisk Magasin', pairs: 'Playfair Display · Inter',       style: { fontFamily: 'Georgia, serif', fontWeight: '700', fontSize: '1.25rem', letterSpacing: '-0.02em' } },
  { id: 'moderne-kontrast', name: 'Moderne Kontrast', pairs: 'DM Serif Display · Work Sans',  style: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', letterSpacing: '0.01em' } },
  { id: 'stille-og-varm',   name: 'Stille og Varm',   pairs: 'Instrument Serif · Plus Jakarta',style: { fontFamily: 'Georgia, serif', fontWeight: '300', fontSize: '1.3rem', letterSpacing: '0.03em' } },
  { id: 'ren-sans-serif',   name: 'Ren Sans-Serif',   pairs: 'IBM Plex Sans · Inter',          style: { fontFamily: 'system-ui, sans-serif', fontWeight: '300', fontSize: '1.15rem', letterSpacing: '0.06em' } },
];

/* ── Layouts ─────────────────────────────────────────────────────────── */
const LAYOUTS = [
  { id: 'centered', name: 'Centered', desc: 'Navne midt på, dato over, RSVP under.' },
  { id: 'split',    name: 'Split',    desc: 'Billede på den ene halvdel, tekst på den anden.' },
  { id: 'magazine', name: 'Magazine', desc: 'Stor headline øverst, billede-grid nedenunder.' },
];

/* ── Sections ────────────────────────────────────────────────────────── */
const INIT_SECTIONS: SectionMeta[] = [
  { id: 'hero',      label: 'Forside',           desc: 'Navne, dato & velkomstbesked',       enabled: true, locked: true },
  { id: 'story',     label: 'Vores historie',    desc: 'Fortæl jeres kærlighedshistorie',    enabled: true  },
  { id: 'program',   label: 'Program for dagen', desc: 'Tidslinje med programpunkter',       enabled: true  },
  { id: 'rsvp',      label: 'RSVP',              desc: 'Tilmeldingsformular til gæsterne',   enabled: true  },
  { id: 'gallery',   label: 'Galleri',           desc: 'Billeder fra jeres moodboard',       enabled: true  },
  { id: 'transport', label: 'Transport',          desc: 'Adresse og vejledning til stedet',   enabled: false },
  { id: 'dresscode', label: 'Dresscode',          desc: 'Hvad gæsterne skal have på',        enabled: false },
  { id: 'gifts',     label: 'Gaveønsker',         desc: 'Ønskeliste eller bidrag til rejse', enabled: false },
  { id: 'hotel',     label: 'Overnatning',        desc: 'Anbefalede hoteller tæt på stedet', enabled: false },
  { id: 'faq',       label: 'FAQ for gæster',    desc: 'Svar på de hyppige spørgsmål',      enabled: false },
  { id: 'photos',    label: 'Del billeder',       desc: 'Gæsterne uploader deres fotos',     enabled: true  },
];

const INIT_PROGRAM: ProgramEvent[] = [
  { id: 'e1', time: '14:00', label: 'Vielse',                sublabel: 'Sonnerupgaard Kapel' },
  { id: 'e2', time: '15:30', label: 'Velkomst & champagne',  sublabel: 'Terrassen'           },
  { id: 'e3', time: '18:00', label: 'Middag',                sublabel: 'Den store sal'       },
  { id: 'e4', time: '22:00', label: 'Fest, musik & dans',    sublabel: ''                    },
];

const INIT_FAQ: FAQItem[] = [
  { id: 'f1', q: 'Hvad er dresscode?',          a: 'Festligt og elegant. Kvinder bedes undgå hvid eller cremefarvet.' },
  { id: 'f2', q: 'Er der parkering på stedet?', a: 'Ja, gratis parkering. Følg skilte fra indkørslen.'               },
  { id: 'f3', q: 'Hvornår er RSVP-deadline?',   a: `1. august 2026.`                                                  },
];

const INIT_HOTELS: HotelItem[] = [
  { id: 'h1', name: 'Hotel Comwell Roskilde', dist: '8 km fra stedet', price: 'fra 1.200 kr/nat' },
  { id: 'h2', name: 'Airbnb i området',       dist: '2–5 km',          price: 'fra 800 kr/nat'  },
];

const GALLERY_KEYS: (keyof typeof IMG)[] = ['florals', 'olive', 'candles', 'arch', 'ceremony', 'rings'];

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */
export default function Website() {
  const [tab,      setTab]      = useState<WTab>('design');

  /* Design */
  const [lensId,   setLensId]   = useState('editorial');
  const [colorId,  setColorId]  = useState('oat-forest');
  const [fontId,   setFontId]   = useState('editorial-serif');
  const [layoutId, setLayoutId] = useState('centered');

  /* Sections */
  const [sections, setSections] = useState<SectionMeta[]>(INIT_SECTIONS);

  /* Content */
  const [heroTagline,  setHeroTagline]  = useState(`Kom og fejr dagen med os`);
  const [storyText,    setStoryText]    = useState(`Vi mødte hinanden på en tilfældig tirsdag og har ikke kunnet slippe hinanden siden. Den ${couple.dateLabel} siger vi ja foran alle dem, vi holder af.`);
  const [countdown,    setCountdown]    = useState(true);
  const [program,      setProgram]      = useState<ProgramEvent[]>(INIT_PROGRAM);
  const [rsvpDeadline, setRsvpDeadline] = useState('2026-08-01');
  const [rsvpPlusOne,  setRsvpPlusOne]  = useState(true);
  const [rsvpMeal,     setRsvpMeal]     = useState(true);
  const [rsvpDietary,  setRsvpDietary]  = useState(true);
  const [galleryKeys,  setGalleryKeys]  = useState<Set<keyof typeof IMG>>(new Set(['florals', 'olive', 'candles', 'arch']));
  const [transport,    setTransport]    = useState('Sonnerupgaard Gods, Sonnerupvej 8, 4060 Kirke Såby');
  const [dresscode,    setDresscode]    = useState('Festligt og elegant. Vi elsker at se jer klædt på til fejring. Kvinder bedes venligst undgå hvid eller cremefarvet.');
  const [giftsText,    setGiftsText]    = useState('Din tilstedeværelse er vores største gave. Har du lyst til at give noget, sætter vi stor pris på bidrag til vores bryllupsrejse.');
  const [giftsUrl,     setGiftsUrl]     = useState('');
  const [faq,          setFaq]          = useState<FAQItem[]>(INIT_FAQ);
  const [hotels,       setHotels]       = useState<HotelItem[]>(INIT_HOTELS);

  /* Publish */
  const [domain,      setDomain]      = useState('emma-frederik');
  const [published,   setPublished]   = useState(false);
  const [pwProtected, setPwProtected] = useState(false);
  const [sitePassword,setSitePassword]= useState('');
  const [copied,      setCopied]      = useState(false);
  const [hideBranding,setHideBranding]= useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [mobileView,  setMobileView]  = useState(false);
  const [showRsvp,    setShowRsvp]    = useState(false);

  const lens   = LENSES.find((l) => l.id === lensId)    ?? LENSES[0];
  const colors = WEBSITE_COLORS.find((c) => c.id === colorId) ?? WEBSITE_COLORS[0];
  const font   = FONTS.find((f) => f.id === fontId)     ?? FONTS[0];

  const toggleSection = (id: SectionId) =>
    setSections((prev) => prev.map((s) => s.id === id && !s.locked ? { ...s, enabled: !s.enabled } : s));

  const enabledSections = sections.filter((s) => s.enabled);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${domain}.kalas.dk`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = (
    <SitePreview
      lens={lens} colors={colors} font={font} layoutId={layoutId}
      sections={enabledSections} heroTagline={heroTagline}
      storyText={storyText} program={program} domain={domain}
      countdown={countdown} galleryKeys={galleryKeys}
      showBranding={!hideBranding}
      onBrandingClick={() => setShowLanding(true)}
      onRsvpClick={() => setShowRsvp(true)}
    />
  );

  return (
    <div className="min-h-screen">

      {/* ── Sticky tab header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur-md rule-b">
        <div className="flex items-center justify-between px-6 pt-5 sm:px-10 lg:px-16">
          <div className="flex items-end gap-8 pb-0">
            {([
              { id: 'design',         label: 'Design'         },
              { id: 'indhold',        label: 'Indhold'        },
              { id: 'indstillinger',  label: 'Indstillinger'  },
            ] as const).map(({ id, label }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)} className="relative pb-4 cursor-pointer group">
                  <span className={cn('font-serif text-[clamp(1.2rem,2vw,1.6rem)] leading-none transition-colors',
                    active ? 'text-ink' : 'text-muted/50 group-hover:text-ink/60')}>
                    {label}
                  </span>
                  {active && (
                    <motion.span layoutId="website-underline"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-ink rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={() => setPublished((v) => !v)}
            className={cn(
              'mb-3 rounded-full px-5 py-2.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer',
              published ? 'bg-sage text-ink' : 'bg-ink text-canvas hover:bg-ink/80',
            )}>
            {published ? '● Live' : 'Publicér'}
          </button>
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === 'design' && (
          <motion.div key="design"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid lg:grid-cols-[1fr_400px] lg:min-h-[calc(100vh-76px)]">

            {/* Left: live preview */}
            <div className="px-6 py-10 sm:px-10 lg:px-16 lg:py-12 lg:rule-r">
              <div className="sticky top-20">
                <div className="flex items-center justify-between mb-5">
                  <p className="eyebrow">Live forhåndsvisning</p>
                  <button onClick={() => setMobileView((v) => !v)}
                    className={cn('flex items-center gap-1.5 text-[0.72rem] transition-colors cursor-pointer',
                      mobileView ? 'text-ink font-medium' : 'text-muted hover:text-ink')}>
                    <Smartphone size={12} /> {mobileView ? 'Desktop' : 'Mobil'}
                  </button>
                </div>
                <div className={cn('transition-all duration-300', mobileView && 'mx-auto max-w-[375px]')}>
                  {preview}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 rule rounded-xl bg-shell overflow-hidden">
                    <input value={domain}
                      onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="bg-transparent pl-4 pr-1 py-2 text-[0.82rem] text-ink focus:outline-none w-28"
                    />
                    <span className="pr-4 text-[0.78rem] text-muted">.kalas.dk</span>
                  </div>
                  {published && (
                    <p className="text-[0.72rem] text-sage">● Siden er live</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: design pickers */}
            <div className="rule-t lg:rule-t-0 px-6 py-10 sm:px-8 lg:py-12 space-y-10 overflow-y-auto">

              {/* Linse */}
              <section>
                <Eyebrow className="mb-4">01 — Linse</Eyebrow>
                <div className="divide-y divide-[var(--color-line)]">
                  {LENSES.map((l) => {
                    const sel = l.id === lensId;
                    return (
                      <button key={l.id} onClick={() => setLensId(l.id)}
                        className="flex w-full items-center gap-4 py-3.5 text-left cursor-pointer group">
                        <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl">
                          <img src={IMG[l.image]} alt={l.name}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className={cn('absolute inset-0', l.dark ? 'bg-black/50' : 'bg-[#1a2215]/30')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('font-serif text-[1rem] leading-tight transition-colors',
                            sel ? 'text-ink' : 'text-ink-soft group-hover:text-ink')}>
                            {l.name}
                          </p>
                          <p className="mt-0.5 text-[0.72rem] text-muted leading-snug">{l.tagline}</p>
                        </div>
                        <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all',
                          sel ? 'bg-sage' : 'bg-shell group-hover:bg-sage-tint')}>
                          {sel && <Check size={11} className="text-ink" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Farver */}
              <section>
                <Eyebrow className="mb-4">02 — Farver</Eyebrow>
                <div className="grid grid-cols-3 gap-2.5">
                  {WEBSITE_COLORS.map((c) => {
                    const sel = c.id === colorId;
                    return (
                      <button key={c.id} onClick={() => setColorId(c.id)}
                        className={cn('relative aspect-square rounded-xl flex items-end p-3 cursor-pointer transition-all',
                          sel ? 'ring-2 ring-ink ring-offset-2 ring-offset-canvas' : 'hover:scale-[1.02]')}
                        style={{ background: c.bg }}>
                        <span className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] whitespace-pre-line leading-tight"
                          style={{ color: c.text }}>{c.name}</span>
                        {sel && (
                          <div className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink">
                            <Check size={9} className="text-canvas" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Typografi */}
              <section>
                <Eyebrow className="mb-4">03 — Typografi</Eyebrow>
                <div className="rule rounded-2xl overflow-hidden divide-y divide-[var(--color-line)]">
                  {FONTS.map((f) => {
                    const sel = f.id === fontId;
                    return (
                      <button key={f.id} onClick={() => setFontId(f.id)}
                        className={cn('flex w-full items-center gap-5 px-5 py-3.5 text-left cursor-pointer transition-colors',
                          sel ? 'bg-shell/60' : 'bg-canvas hover:bg-card/50')}>
                        <div className="flex-1 min-w-0">
                          <span style={f.style} className="block text-ink">{couple.a} & {couple.b}</span>
                          <span className="mt-0.5 block text-[0.65rem] text-muted">{f.pairs}</span>
                        </div>
                        <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all',
                          sel ? 'bg-sage' : 'bg-shell')}>
                          {sel && <Check size={10} className="text-ink" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Opsætning */}
              <section>
                <Eyebrow className="mb-4">04 — Opsætning</Eyebrow>
                <div className="grid grid-cols-3 gap-2.5">
                  {LAYOUTS.map((l) => {
                    const sel = l.id === layoutId;
                    return (
                      <button key={l.id} onClick={() => setLayoutId(l.id)}
                        className={cn('relative flex flex-col overflow-hidden rounded-xl rule bg-card text-left cursor-pointer transition-all',
                          sel ? 'ring-2 ring-ink ring-offset-2 ring-offset-canvas' : 'hover:bg-shell/40')}>
                        <div className="w-full p-2.5 pb-0">
                          {l.id === 'centered' && (
                            <svg viewBox="0 0 120 80" className="w-full rounded overflow-hidden">
                              <rect width="120" height="80" fill="var(--color-shell)" />
                              <rect x="35" y="18" width="50" height="5" rx="2" fill="var(--color-ink)" opacity="0.2" />
                              <rect x="40" y="27" width="40" height="7" rx="2" fill="var(--color-ink)" opacity="0.35" />
                              <rect x="42" y="39" width="36" height="3" rx="1.5" fill="var(--color-muted)" opacity="0.3" />
                              <rect x="44" y="56" width="32" height="10" rx="5" fill="var(--color-sage)" opacity="0.55" />
                            </svg>
                          )}
                          {l.id === 'split' && (
                            <svg viewBox="0 0 120 80" className="w-full rounded overflow-hidden">
                              <rect width="120" height="80" fill="var(--color-shell)" />
                              <rect width="54" height="80" fill="var(--color-line-strong)" opacity="0.35" />
                              <rect x="62" y="22" width="48" height="6" rx="2" fill="var(--color-ink)" opacity="0.2" />
                              <rect x="62" y="33" width="40" height="5" rx="2" fill="var(--color-muted)" opacity="0.3" />
                              <rect x="62" y="56" width="36" height="10" rx="5" fill="var(--color-sage)" opacity="0.55" />
                            </svg>
                          )}
                          {l.id === 'magazine' && (
                            <svg viewBox="0 0 120 80" className="w-full rounded overflow-hidden">
                              <rect width="120" height="80" fill="var(--color-shell)" />
                              <rect x="6" y="10" width="80" height="7" rx="2" fill="var(--color-ink)" opacity="0.2" />
                              <rect x="6" y="22" width="55" height="3.5" rx="2" fill="var(--color-muted)" opacity="0.3" />
                              <rect x="6"  y="34" width="33" height="36" rx="3" fill="var(--color-line-strong)" opacity="0.35" />
                              <rect x="43" y="34" width="33" height="36" rx="3" fill="var(--color-line-strong)" opacity="0.28" />
                              <rect x="80" y="34" width="33" height="36" rx="3" fill="var(--color-line-strong)" opacity="0.22" />
                            </svg>
                          )}
                        </div>
                        <div className="p-2.5 pt-2">
                          <p className="font-serif text-[0.92rem] text-ink">{l.name}</p>
                          <p className="mt-0.5 text-[0.68rem] text-muted leading-snug">{l.desc}</p>
                        </div>
                        {sel && (
                          <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-ink">
                            <Check size={9} className="text-canvas" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {tab === 'indhold' && (
          <motion.div key="indhold"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid lg:grid-cols-[1fr_380px] lg:min-h-[calc(100vh-76px)]">

            {/* Left: section editors */}
            <div className="px-6 py-10 sm:px-10 lg:px-16 lg:py-12 space-y-3 lg:rule-r">
              <div className="mb-8">
                <Eyebrow>Sektioner</Eyebrow>
                <p className="mt-2 text-[0.88rem] text-muted">Tænd/sluk sektioner og rediger indholdet. Siden opdateres til højre.</p>
              </div>

              {/* HERO */}
              <SectionCard id="hero" section={sections.find((s) => s.id === 'hero')!} onToggle={toggleSection}
                icon={<Image size={15} />}>
                <Label>Navne</Label>
                <p className="rule rounded-xl bg-shell px-4 py-3 text-[0.88rem] text-ink">{couple.a} & {couple.b}</p>
                <p className="mt-1 text-[0.7rem] text-muted">Fra jeres profil · redigér under Indstillinger</p>
                <div className="mt-4">
                  <Label>Velkomstbesked</Label>
                  <Textarea value={heroTagline} onChange={setHeroTagline} rows={2} placeholder="Kom og fejr dagen med os" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Label>Nedtælling til brylluppet</Label>
                  <Toggle value={countdown} onChange={setCountdown} />
                </div>
              </SectionCard>

              {/* VORES HISTORIE */}
              <SectionCard id="story" section={sections.find((s) => s.id === 'story')!} onToggle={toggleSection}
                icon={<BookOpen size={15} />}>
                <Label>Jeres historie</Label>
                <Textarea value={storyText} onChange={setStoryText} rows={5}
                  placeholder="Fortæl gæsterne jeres historie…" />
                <p className="mt-2 text-[0.7rem] text-muted">Ava har skrevet et udkast — tilpas det som I ønsker.</p>
              </SectionCard>

              {/* PROGRAM */}
              <SectionCard id="program" section={sections.find((s) => s.id === 'program')!} onToggle={toggleSection}
                icon={<Clock size={15} />}>
                <Label>Programpunkter</Label>
                <div className="mt-1 space-y-2">
                  {program.map((ev) => (
                    <div key={ev.id} className="flex gap-2 items-start">
                      <input value={ev.time} onChange={(e) => setProgram((p) => p.map((x) => x.id === ev.id ? { ...x, time: e.target.value } : x))}
                        className="w-16 shrink-0 rounded-lg rule bg-card px-2 py-1.5 text-[0.82rem] text-ink text-center focus:outline-none focus:ring-1 focus:ring-ink/20"
                        placeholder="00:00" />
                      <div className="flex-1 space-y-1.5">
                        <input value={ev.label} onChange={(e) => setProgram((p) => p.map((x) => x.id === ev.id ? { ...x, label: e.target.value } : x))}
                          className="w-full rounded-lg rule bg-card px-3 py-1.5 text-[0.82rem] text-ink focus:outline-none focus:ring-1 focus:ring-ink/20"
                          placeholder="Programpunkt" />
                        <input value={ev.sublabel} onChange={(e) => setProgram((p) => p.map((x) => x.id === ev.id ? { ...x, sublabel: e.target.value } : x))}
                          className="w-full rounded-lg bg-transparent px-3 py-1 text-[0.74rem] text-muted focus:outline-none"
                          placeholder="Sted / detalje (valgfrit)" />
                      </div>
                      <button onClick={() => setProgram((p) => p.filter((x) => x.id !== ev.id))}
                        className="mt-1.5 shrink-0 text-muted hover:text-ink transition-colors cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setProgram((p) => [...p, { id: `e${Date.now()}`, time: '', label: '', sublabel: '' }])}
                    className="flex items-center gap-2 text-[0.78rem] text-muted hover:text-ink transition-colors cursor-pointer mt-2">
                    <Plus size={14} /> Tilføj programpunkt
                  </button>
                </div>
              </SectionCard>

              {/* RSVP */}
              <SectionCard id="rsvp" section={sections.find((s) => s.id === 'rsvp')!} onToggle={toggleSection}
                icon={<Check size={15} />}>
                <div className="space-y-4">
                  <div>
                    <Label>RSVP-deadline</Label>
                    <input type="date" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)}
                      className="mt-1 rounded-lg rule bg-card px-3 py-2 text-[0.85rem] text-ink focus:outline-none w-full" />
                  </div>
                  <ToggleRow label="+1 tilladet" value={rsvpPlusOne} onChange={setRsvpPlusOne} />
                  <ToggleRow label="Måltidsvalg (vegetar/standard)" value={rsvpMeal} onChange={setRsvpMeal} />
                  <ToggleRow label="Allergier & kostbehov" value={rsvpDietary} onChange={setRsvpDietary} />
                </div>
                <p className="mt-4 text-[0.72rem] text-muted">Svar synkroniseres automatisk med jeres gæsteliste.</p>
              </SectionCard>

              {/* GALLERI */}
              <SectionCard id="gallery" section={sections.find((s) => s.id === 'gallery')!} onToggle={toggleSection}
                icon={<Camera size={15} />}>
                <Label>Vælg billeder til galleriet</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {GALLERY_KEYS.map((key) => {
                    const on = galleryKeys.has(key);
                    return (
                      <button key={key} onClick={() => setGalleryKeys((prev) => {
                        const n = new Set(prev);
                        on ? n.delete(key) : n.add(key);
                        return n;
                      })}
                        className={cn('relative aspect-square overflow-hidden rounded-xl cursor-pointer transition-all',
                          on ? 'ring-2 ring-ink ring-offset-1 ring-offset-canvas' : 'opacity-50 hover:opacity-75')}>
                        <img src={IMG[key]} alt="" className="h-full w-full object-cover" />
                        {on && (
                          <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
                            <Check size={14} className="text-canvas" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[0.7rem] text-muted">{galleryKeys.size} billeder valgt · Fra jeres moodboard</p>
              </SectionCard>

              {/* TRANSPORT */}
              <SectionCard id="transport" section={sections.find((s) => s.id === 'transport')!} onToggle={toggleSection}
                icon={<MapPin size={15} />}>
                <Label>Adresse</Label>
                <Textarea value={transport} onChange={setTransport} rows={2} placeholder="Venue-navn, adresse, postnummer" />
                <p className="mt-2 text-[0.7rem] text-muted">Ava tilføjer automatisk et kort-link til gæsterne.</p>
              </SectionCard>

              {/* DRESSCODE */}
              <SectionCard id="dresscode" section={sections.find((s) => s.id === 'dresscode')!} onToggle={toggleSection}
                icon={<Eye size={15} />}>
                <Label>Dresscode-tekst</Label>
                <Textarea value={dresscode} onChange={setDresscode} rows={3} placeholder="Beskriv dresscode og ønsker…" />
              </SectionCard>

              {/* GAVEØNSKER */}
              <SectionCard id="gifts" section={sections.find((s) => s.id === 'gifts')!} onToggle={toggleSection}
                icon={<Gift size={15} />}>
                <div className="space-y-4">
                  <div>
                    <Label>Tekst til gæsterne</Label>
                    <Textarea value={giftsText} onChange={setGiftsText} rows={3} placeholder="Ingen ønskeliste, bryllupsrejse, eller link til registrering…" />
                  </div>
                  <div>
                    <Label>Ønskeliste-link (valgfrit)</Label>
                    <input value={giftsUrl} onChange={(e) => setGiftsUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-lg rule bg-card px-3 py-2 text-[0.82rem] text-ink placeholder:text-muted focus:outline-none" />
                  </div>
                </div>
              </SectionCard>

              {/* OVERNATNING */}
              <SectionCard id="hotel" section={sections.find((s) => s.id === 'hotel')!} onToggle={toggleSection}
                icon={<Bed size={15} />}>
                <Label>Anbefalede hoteller</Label>
                <div className="mt-1 space-y-2">
                  {hotels.map((h) => (
                    <div key={h.id} className="rule rounded-xl bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1.5">
                          <input value={h.name} onChange={(e) => setHotels((prev) => prev.map((x) => x.id === h.id ? { ...x, name: e.target.value } : x))}
                            className="w-full text-[0.85rem] font-medium text-ink bg-transparent focus:outline-none border-b border-[var(--color-line)] pb-0.5"
                            placeholder="Hotelnavn" />
                          <div className="flex gap-3">
                            <input value={h.dist} onChange={(e) => setHotels((prev) => prev.map((x) => x.id === h.id ? { ...x, dist: e.target.value } : x))}
                              className="flex-1 text-[0.75rem] text-muted bg-transparent focus:outline-none" placeholder="Afstand" />
                            <input value={h.price} onChange={(e) => setHotels((prev) => prev.map((x) => x.id === h.id ? { ...x, price: e.target.value } : x))}
                              className="flex-1 text-[0.75rem] text-muted bg-transparent focus:outline-none" placeholder="Pris" />
                          </div>
                        </div>
                        <button onClick={() => setHotels((prev) => prev.filter((x) => x.id !== h.id))}
                          className="shrink-0 text-muted hover:text-ink transition-colors cursor-pointer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setHotels((prev) => [...prev, { id: `h${Date.now()}`, name: '', dist: '', price: '' }])}
                    className="flex items-center gap-2 text-[0.78rem] text-muted hover:text-ink transition-colors cursor-pointer">
                    <Plus size={14} /> Tilføj hotel
                  </button>
                </div>
              </SectionCard>

              {/* FAQ */}
              <SectionCard id="faq" section={sections.find((s) => s.id === 'faq')!} onToggle={toggleSection}
                icon={<HelpCircle size={15} />}>
                <Label>Spørgsmål & svar</Label>
                <div className="mt-1 space-y-3">
                  {faq.map((item) => (
                    <div key={item.id} className="rule rounded-xl bg-card p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <input value={item.q}
                            onChange={(e) => setFaq((f) => f.map((x) => x.id === item.id ? { ...x, q: e.target.value } : x))}
                            className="w-full text-[0.82rem] font-medium text-ink bg-transparent border-b border-[var(--color-line)] pb-0.5 focus:outline-none"
                            placeholder="Spørgsmål…" />
                          <textarea value={item.a} rows={2}
                            onChange={(e) => setFaq((f) => f.map((x) => x.id === item.id ? { ...x, a: e.target.value } : x))}
                            className="w-full resize-none text-[0.78rem] text-muted bg-transparent focus:outline-none leading-relaxed"
                            placeholder="Svar…" />
                        </div>
                        <button onClick={() => setFaq((f) => f.filter((x) => x.id !== item.id))}
                          className="mt-0.5 shrink-0 text-muted hover:text-ink transition-colors cursor-pointer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setFaq((f) => [...f, { id: `f${Date.now()}`, q: '', a: '' }])}
                    className="flex items-center gap-2 text-[0.78rem] text-muted hover:text-ink transition-colors cursor-pointer">
                    <Plus size={14} /> Tilføj spørgsmål
                  </button>
                </div>
              </SectionCard>

              {/* DEL BILLEDER */}
              <SectionCard id="photos" section={sections.find((s) => s.id === 'photos')!} onToggle={toggleSection}
                icon={<Camera size={15} />}>
                <p className="text-[0.84rem] text-muted leading-relaxed">
                  Gæsterne får en knap til at uploade egne billeder. Alle billeder samles i jeres private galleri.
                </p>
                <div className="mt-3 rule rounded-xl bg-shell px-4 py-3 text-[0.78rem] text-muted">
                  Upload-link: <span className="font-mono text-ink">{domain}.kalas.dk/del</span>
                </div>
              </SectionCard>
            </div>

            {/* Right: mini preview (desktop only) */}
            <div className="hidden lg:block px-8 py-12 rule-t lg:rule-t-0">
              <div className="sticky top-20">
                <p className="eyebrow mb-5">Live forhåndsvisning</p>
                {preview}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'indstillinger' && (
          <motion.div key="indstillinger"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="px-6 py-10 sm:px-10 lg:px-16 max-w-2xl">

            <Eyebrow className="mb-8">Publicering & indstillinger</Eyebrow>

            <div className="space-y-8">

              {/* Domæne */}
              <section className="rule rounded-2xl bg-card p-6">
                <p className="font-serif text-[1.15rem] text-ink mb-1">Domæne</p>
                <p className="text-[0.8rem] text-muted mb-4">Jeres side er tilgængelig på denne adresse.</p>
                <div className="flex items-center gap-2 rule rounded-xl bg-shell overflow-hidden">
                  <input value={domain}
                    onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 bg-transparent pl-4 py-2.5 text-[0.88rem] text-ink focus:outline-none"
                  />
                  <span className="pr-4 text-[0.82rem] text-muted">.kalas.dk</span>
                </div>
                <p className="mt-2 text-[0.7rem] text-muted">Kun bogstaver, tal og bindestreger.</p>
              </section>

              {/* Publicer */}
              <section className="rule rounded-2xl bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-[1.15rem] text-ink">Publicering</p>
                    <p className="mt-1 text-[0.8rem] text-muted">
                      {published ? 'Jeres side er live og tilgængelig for gæster.' : 'Siden er ikke offentlig endnu.'}
                    </p>
                  </div>
                  <button onClick={() => setPublished((v) => !v)}
                    className={cn('shrink-0 rounded-full px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] transition-all cursor-pointer',
                      published ? 'bg-sage text-ink' : 'bg-ink text-canvas hover:bg-ink/80')}>
                    {published ? '● Live' : 'Publicér'}
                  </button>
                </div>
                {published && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 rule rounded-xl bg-shell overflow-hidden">
                    <Globe size={13} className="ml-3 shrink-0 text-muted" />
                    <span className="flex-1 py-2.5 text-[0.82rem] text-ink font-mono">{domain}.kalas.dk</span>
                    <button onClick={copyLink}
                      className="flex items-center gap-1.5 mr-3 text-[0.72rem] text-muted hover:text-ink transition-colors cursor-pointer">
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Kopieret' : 'Kopiér'}
                    </button>
                  </motion.div>
                )}
              </section>

              {/* Adgangskode */}
              <section className="rule rounded-2xl bg-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lock size={15} className="text-muted" />
                    <p className="font-serif text-[1.15rem] text-ink">Adgangskode</p>
                  </div>
                  <Toggle value={pwProtected} onChange={setPwProtected} />
                </div>
                <p className="text-[0.8rem] text-muted mb-4">Gæsterne skal indtaste en kode for at se siden.</p>
                <AnimatePresence>
                  {pwProtected && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                      className="overflow-hidden">
                      <input type="text" value={sitePassword}
                        onChange={(e) => setSitePassword(e.target.value)}
                        placeholder="Vælg en kode til gæsterne"
                        className="w-full rule rounded-xl bg-shell px-4 py-2.5 text-[0.85rem] text-ink placeholder:text-muted focus:outline-none" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Del link */}
              <section className="rule rounded-2xl bg-card p-6">
                <p className="font-serif text-[1.15rem] text-ink mb-1">Del med gæsterne</p>
                <p className="text-[0.8rem] text-muted mb-4">Send linket i invitationen eller print QR-koden.</p>
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="rule rounded-xl bg-shell px-4 py-2.5 text-[0.82rem] font-mono text-ink">
                      {domain}.kalas.dk
                    </div>
                    <button onClick={copyLink}
                      className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Kopieret!' : 'Kopiér link'}
                    </button>
                  </div>
                  <div className="shrink-0 rule rounded-xl bg-shell p-3 flex flex-col items-center gap-1.5">
                    <QrCode size={40} className="text-ink" />
                    <span className="text-[0.6rem] uppercase tracking-[0.12em] text-muted">QR-kode</span>
                  </div>
                </div>
              </section>

              {/* Kalas branding */}
              <section className="rule rounded-2xl bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-[1.15rem] text-ink">Kalas-branding</p>
                    <p className="mt-1 text-[0.8rem] text-muted">
                      Et diskret "Lavet med Kalas" vises i bunden af jeres side — og hjælper andre par finde Kalas.
                    </p>
                  </div>
                  {hideBranding
                    ? <span className="shrink-0 rounded-full bg-sage-tint px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink">Pro</span>
                    : <Toggle value={!hideBranding} onChange={(v) => { if (!v) setHideBranding(true); }} />
                  }
                </div>
                {hideBranding && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rule rounded-xl bg-shell px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-[0.78rem] text-muted">Skjul branding med Kalas Pro</p>
                    <button onClick={() => setHideBranding(false)}
                      className="shrink-0 rounded-full bg-ink px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                      Opgrader · 1.199 kr
                    </button>
                  </motion.div>
                )}
              </section>

              {/* Statistik */}
              <section className="rule rounded-2xl bg-card p-6">
                <p className="font-serif text-[1.15rem] text-ink mb-4">Statistik</p>
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl rule bg-[var(--color-line)]">
                  {[
                    { label: 'Sidevisninger',   value: published ? '34' : '—' },
                    { label: 'RSVP modtaget',   value: published ? String(guests.filter((g) => g.rsvp !== 'afventer').length) : '—' },
                    { label: 'Billeder delt',   value: published ? '7'  : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-card px-4 py-5 text-center">
                      <div className="font-serif text-[1.6rem] text-ink">{value}</div>
                      <div className="mt-1 text-[0.62rem] uppercase tracking-[0.14em] text-muted">{label}</div>
                    </div>
                  ))}
                </div>
                {!published && <p className="mt-3 text-[0.72rem] text-muted text-center">Publicér siden for at se statistik</p>}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RSVP confirmation overlay (simulates what guest sees) ──────── */}
      <AnimatePresence>
        {showRsvp && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm px-5"
            onClick={() => setShowRsvp(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rule rounded-3xl bg-canvas overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.28)]"
            >
              {/* Confirmation */}
              <div className="px-8 py-9 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-tint mb-5">
                  <Check size={24} className="text-ink" />
                </div>
                <p className="font-serif text-[1.7rem] text-ink leading-tight">Tak for dit svar!</p>
                <p className="mt-2 text-[0.88rem] text-muted">{couple.a} & {couple.b} glæder sig til at se dig den {couple.dateLabel}.</p>
              </div>

              {/* Viral CTA */}
              <div className="rule-t px-8 py-7 bg-shell/60">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted mb-2">
                  {couple.a} & {couple.b} bruger
                </p>
                <p className="font-serif text-[1.2rem] text-ink leading-snug">
                  Planlægger I selv bryllup?<br />
                  <span className="italic">Ava gør arbejdet for jer.</span>
                </p>
                <p className="mt-2 text-[0.8rem] text-muted">Tidslinje, venues, budget og bryllupsside på én platform.</p>
                <button
                  onClick={() => { setShowRsvp(false); setShowLanding(true); }}
                  className="mt-5 w-full rounded-2xl py-3.5 text-[0.75rem] font-bold uppercase tracking-[0.16em] text-canvas hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ background: 'var(--color-terracotta)' }}
                >
                  Prøv Kalas gratis →
                </button>
                <button onClick={() => setShowRsvp(false)}
                  className="mt-3 w-full text-center text-[0.72rem] text-muted hover:text-ink transition-colors cursor-pointer">
                  Nej tak
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Kalas landing overlay (simulates guest click) ─────────────── */}
      <AnimatePresence>
        {showLanding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm px-5"
            onClick={() => setShowLanding(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rule rounded-3xl bg-canvas px-8 py-10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.28)]"
            >
              <p className="font-serif text-[2rem] leading-tight text-ink">
                Planlæg jeres bryllup.<br /><span className="italic">Ava gør arbejdet.</span>
              </p>
              <p className="mt-3 text-[0.88rem] text-muted leading-relaxed">
                {couple.a} & {couple.b} bruger Kalas til at planlægge deres store dag. Kom i gang på 2 minutter.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  { n: 'Tidslinje på 2 minutter', d: '14 milepæle planlagt baglæns fra bryllupsdagen' },
                  { n: '3 venues fundet',          d: 'Ava matchede til budget og stil — ingen Google' },
                  { n: 'Invitationer klar',         d: 'Udkast skrevet og klar til godkendelse på dag 1' },
                ].map(({ n, d }) => (
                  <div key={n} className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-sage-tint flex items-center justify-center">
                      <Check size={11} className="text-ink" />
                    </div>
                    <div>
                      <p className="text-[0.88rem] font-medium text-ink">{n}</p>
                      <p className="text-[0.75rem] text-muted">{d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="mt-8 w-full rounded-2xl py-4 text-[0.8rem] font-bold uppercase tracking-[0.18em] text-canvas hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: 'var(--color-terracotta)' }}
                onClick={() => setShowLanding(false)}
              >
                Start gratis — ingen kreditkort
              </button>
              <p className="mt-3 text-center text-[0.7rem] text-muted">
                Én gang · 499 kr ved launch · normalt 799 kr
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OnboardingHint id="website" />
    </div>
  );
}

/* ── Section card (collapsible) ──────────────────────────────────────── */
function SectionCard({
  id, section, onToggle, icon, children,
}: {
  id: SectionId;
  section: SectionMeta;
  onToggle: (id: SectionId) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(section.enabled && !section.locked);
  const fieldId = useId();

  return (
    <div className={cn('rule rounded-2xl overflow-hidden transition-all',
      section.enabled ? 'bg-card' : 'bg-card/50 opacity-70')}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <span className={cn('shrink-0 transition-colors', section.enabled ? 'text-ink' : 'text-muted')}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[1rem] text-ink leading-tight">{section.label}</p>
          <p className="text-[0.7rem] text-muted mt-0.5">{section.desc}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {section.locked ? (
            <span className="text-[0.6rem] uppercase tracking-[0.1em] text-muted">Altid</span>
          ) : (
            <button onClick={() => onToggle(id)} aria-label={section.enabled ? 'Sluk' : 'Tænd'}
              aria-checked={section.enabled} role="switch" id={fieldId}
              className={cn('relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer shrink-0',
                section.enabled ? 'bg-ink' : 'bg-shell')}>
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-canvas shadow-sm transition-all duration-200',
                section.enabled ? 'translate-x-[18px]' : 'translate-x-0.5')} />
            </button>
          )}
          <button onClick={() => setOpen((v) => !v)}
            className="text-muted hover:text-ink transition-colors cursor-pointer"
            aria-label={open ? 'Luk' : 'Åbn'}>
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="block">
              <ChevronDown size={16} />
            </motion.span>
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden">
            <div className="rule-t px-5 pb-5 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Small helpers ───────────────────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted mb-1.5">{children}</p>;
}

function Textarea({ value, onChange, rows, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <textarea value={value} rows={rows ?? 3} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-none rounded-xl rule bg-card px-4 py-3 text-[0.88rem] text-ink placeholder:text-muted leading-relaxed focus:outline-none focus:ring-1 focus:ring-ink/20"
    />
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} role="switch" aria-checked={value}
      className={cn('relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer shrink-0',
        value ? 'bg-ink' : 'bg-shell')}>
      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-canvas shadow-sm transition-all duration-200',
        value ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </button>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.85rem] text-ink">{label}</span>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

/* ── Live preview ─────────────────────────────────────────────────────── */
function SitePreview({
  lens, colors, font, layoutId, sections, heroTagline, storyText, program, domain, countdown, galleryKeys,
  showBranding, onBrandingClick, onRsvpClick,
}: {
  lens: typeof LENSES[number];
  colors: WebColor;
  font: WebFont;
  layoutId: string;
  sections: SectionMeta[];
  heroTagline: string;
  storyText: string;
  program: ProgramEvent[];
  domain: string;
  countdown: boolean;
  galleryKeys: Set<keyof typeof IMG>;
  showBranding?: boolean;
  onBrandingClick?: () => void;
  onRsvpClick?: () => void;
}) {
  const daysLeft = Math.ceil((new Date(couple.dateISO).getTime() - TODAY.getTime()) / 86400000);

  return (
    <motion.div layout
      className="overflow-hidden rounded-2xl rule bg-card shadow-[0_20px_60px_-20px_rgba(58,79,55,0.12)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 rule-b bg-card px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-[var(--color-line-strong)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--color-line-strong)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--color-line-strong)]" />
        <div className="ml-3 flex flex-1 items-center gap-1.5 rounded-full bg-shell px-3 py-1">
          <Globe size={9} className="text-muted" />
          <span className="text-[0.65rem] text-muted">{domain}.kalas.dk</span>
        </div>
      </div>

      {/* Mock site */}
      <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: 520 }}>

        {/* Nav */}
        <div className="flex items-center justify-between px-5 py-2.5 rule-b" style={{ background: colors.bg }}>
          <span style={{ ...font.style, fontSize: '0.72rem', fontStyle: 'normal', letterSpacing: '0.05em', color: colors.text }}>
            {couple.a} & {couple.b}
          </span>
          <div className="flex items-center gap-3">
            {sections.slice(0, 3).map((s) => (
              <span key={s.id} className="text-[0.52rem] uppercase tracking-[0.14em]"
                style={{ color: colors.text, opacity: 0.5 }}>{s.label}</span>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div className="relative" style={{ height: layoutId === 'split' ? 180 : 200 }}>
          {layoutId === 'split' ? (
            <div className="flex h-full">
              <div className="w-1/2 relative overflow-hidden">
                <img src={IMG[lens.image]} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="w-1/2 flex flex-col items-start justify-center px-5"
                style={{ background: colors.bg }}>
                <p className="text-[0.45rem] uppercase tracking-[0.28em] mb-2" style={{ color: colors.accent }}>{couple.dateLabel.toUpperCase()}</p>
                <p style={{ ...font.style, fontSize: 'clamp(1.1rem,3vw,1.8rem)', lineHeight: 1.1, color: colors.text }}>{couple.a} & {couple.b}</p>
                <p className="mt-1.5 text-[0.52rem] leading-relaxed" style={{ color: colors.text, opacity: 0.6 }}>{heroTagline}</p>
              </div>
            </div>
          ) : (
            <>
              <img src={IMG[lens.image]} alt="" className="absolute inset-0 h-full w-full object-cover transition-all duration-700" />
              <div className={cn('absolute inset-0', lens.dark ? 'bg-black/60' : 'bg-[#3a4f3780]')} />
              {/* palette stripe */}
              <div className="absolute top-0 left-0 right-0 h-0.5 flex">
                {[colors.bg, colors.accent, colors.text, colors.detail, colors.bg].map((c, i) => (
                  <div key={i} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <p className="text-[0.44rem] uppercase tracking-[0.32em] text-canvas/70 mb-1">{couple.dateLabel.toUpperCase()}</p>
                <p className="text-canvas" style={{ ...font.style, fontSize: 'clamp(1.4rem,4vw,2.2rem)', lineHeight: 1.1 }}>
                  {couple.a} & {couple.b}
                </p>
                <p className="mt-1.5 text-[0.5rem] text-canvas/70">{heroTagline}</p>
                {countdown && daysLeft > 0 && (
                  <div className="mt-3 flex items-center gap-1 rounded-full px-3 py-1"
                    style={{ background: `${colors.accent}CC`, color: colors.bg }}>
                    <span className="text-[0.52rem] font-bold">{daysLeft}</span>
                    <span className="text-[0.44rem] uppercase tracking-[0.1em]"> dage</span>
                  </div>
                )}
                <button onClick={onRsvpClick}
                  className="mt-3 rounded-full px-3 py-1 text-[0.48rem] font-semibold uppercase tracking-[0.14em] cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: colors.accent, color: colors.bg }}>RSVP</button>
              </div>
            </>
          )}
        </div>

        {/* Program */}
        {sections.some((s) => s.id === 'program') && program.length > 0 && (
          <div className="px-5 py-4" style={{ background: colors.bg }}>
            <p className="mb-2.5 text-[0.46rem] font-semibold uppercase tracking-[0.22em]"
              style={{ color: colors.accent }}>Program</p>
            {program.slice(0, 4).map((ev) => (
              <div key={ev.id} className="flex items-start gap-2.5 py-1.5 border-b last:border-b-0"
                style={{ borderColor: `${colors.text}12` }}>
                <span className="w-7 shrink-0 tabular-nums text-[0.44rem]"
                  style={{ color: colors.text, opacity: 0.4 }}>{ev.time}</span>
                <div className="h-1 w-1 rounded-full mt-[3px] shrink-0" style={{ background: colors.accent }} />
                <div>
                  <span className="text-[0.54rem]" style={{ color: colors.text }}>{ev.label}</span>
                  {ev.sublabel && <span className="block text-[0.46rem]" style={{ color: colors.text, opacity: 0.45 }}>{ev.sublabel}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vores historie */}
        {sections.some((s) => s.id === 'story') && (
          <div className="px-5 py-4" style={{ background: colors.bg, opacity: 0.9 }}>
            <p className="mb-2 text-[0.46rem] font-semibold uppercase tracking-[0.22em]"
              style={{ color: colors.accent }}>Vores historie</p>
            <p className="font-serif leading-relaxed line-clamp-3"
              style={{ fontSize: '0.62rem', color: colors.text, opacity: 0.75 }}>{storyText}</p>
          </div>
        )}

        {/* Gallery */}
        {sections.some((s) => s.id === 'gallery') && galleryKeys.size > 0 && (
          <div className="px-5 py-4" style={{ background: colors.bg }}>
            <p className="mb-2 text-[0.46rem] font-semibold uppercase tracking-[0.22em]"
              style={{ color: colors.accent }}>Galleri</p>
            <div className="grid grid-cols-3 gap-1">
              {[...galleryKeys].slice(0, 3).map((key) => (
                <div key={key} className="aspect-square overflow-hidden rounded-md">
                  <img src={IMG[key]} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remaining sections as tags */}
        {sections.filter((s) => !['hero', 'program', 'story', 'gallery', 'rsvp'].includes(s.id)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 py-3" style={{ background: colors.bg }}>
            {sections.filter((s) => !['hero', 'program', 'story', 'gallery'].includes(s.id)).map((s) => (
              <span key={s.id} className="rounded-full px-2.5 py-0.5 text-[0.52rem] uppercase tracking-[0.1em]"
                style={{ border: `1px solid ${colors.text}20`, color: colors.text, opacity: 0.6 }}>
                {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Kalas branding footer */}
        {showBranding && (
          <button
            onClick={onBrandingClick}
            className="w-full py-3 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: colors.bg, borderTop: `1px solid ${colors.text}10` }}
          >
            <span className="text-[0.48rem] uppercase tracking-[0.18em]" style={{ color: colors.text, opacity: 0.35 }}>
              Lavet med
            </span>
            <span className="font-serif text-[0.6rem] tracking-[0.12em]" style={{ color: colors.text, opacity: 0.5 }}>
              Kalas
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
