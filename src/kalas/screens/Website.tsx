import { useState, useId, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, Globe, Smartphone, Plus, X, ChevronDown, Trash2,
  Lock, Copy, Eye, EyeOff, MapPin, Gift, HelpCircle, Bed,
  Camera, Clock, BookOpen, Image, Download,
} from 'lucide-react';
import { IMAGES as IMG, TODAY } from '../data';
import { Eyebrow, cn } from '../ui';
import OnboardingHint from '../OnboardingHint';
import { useWedding } from '../useWedding';
import type { Couple } from '../useWedding';
import { roomAvailability } from '@/lib/accommodation';
import { qrSvg, qrPngDataUrl } from '@/lib/qr';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import type { AccommodationRoomRow, AccommodationReservationRow, SitePhotoRow } from '@/lib/db/types';

import {
  slugify, LENSES, WEBSITE_COLORS, FONTS, LAYOUTS,
  INIT_SECTIONS, INIT_PROGRAM, INIT_FAQ, INIT_HOTELS, GALLERY_KEYS,
  MONOGRAM_STYLES,
} from '../site/config';
import type {
  ProgramEvent, FAQItem, HotelItem, RsvpSubEvent, RsvpQuestion,
  SectionId, SectionMeta, WebColor, WebFont, MonogramStyle,
} from '../site/config';
import { Monogram } from '../site/Monogram';

type WTab = 'design' | 'indhold' | 'indstillinger';

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */
export default function Website() {
  const {
    couple, loading, weddingSite, saveSite, guests: guestRows,
    accommodationRooms, accommodationReservations, addRoom, updateRoom, deleteRoom,
    updateReservation, deleteReservation,
    sitePhotos, updateSitePhoto, removeSitePhoto,
  } = useWedding();
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
  const [rsvpEvents,   setRsvpEvents]   = useState<RsvpSubEvent[]>([]);
  const [rsvpQuestions,setRsvpQuestions]= useState<RsvpQuestion[]>([]);
  const [rsvpChildren, setRsvpChildren] = useState(false);
  const [galleryKeys,  setGalleryKeys]  = useState<Set<keyof typeof IMG>>(new Set(['florals', 'olive', 'candles', 'arch']));
  const [transport,    setTransport]    = useState('Sonnerupgaard Gods, Sonnerupvej 8, 4060 Kirke Såby');
  const [dresscode,    setDresscode]    = useState('Festligt og elegant. Vi elsker at se jer klædt på til fejring. Kvinder bedes venligst undgå hvid eller cremefarvet.');
  const [giftsText,    setGiftsText]    = useState('Din tilstedeværelse er vores største gave. Har du lyst til at give noget, sætter vi stor pris på bidrag til vores bryllupsrejse.');
  const [giftsUrl,     setGiftsUrl]     = useState('');
  const [mapQuery,     setMapQuery]     = useState('');
  const [showMap,      setShowMap]      = useState(true);
  const [photoWallOpen,setPhotoWallOpen]= useState(false);
  const [monogram,     setMonogram]     = useState(true);
  const [monogramStyle,setMonogramStyle]= useState<MonogramStyle>('initials-amp');
  const [monogramImagePath, setMonogramImagePath] = useState('');
  const [faq,          setFaq]          = useState<FAQItem[]>(INIT_FAQ);
  const [hotels,       setHotels]       = useState<HotelItem[]>(INIT_HOTELS);

  /* Publish */
  const [domain,      setDomain]      = useState(`${slugify(couple.a)}-${slugify(couple.b)}`);
  const [published,   setPublished]   = useState(false);
  const [pwProtected, setPwProtected] = useState(false);
  const [sitePassword,setSitePassword]= useState('');
  const [copied,      setCopied]      = useState(false);
  const [hideBranding,setHideBranding]= useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [mobileView,  setMobileView]  = useState(false);
  const [showRsvp,    setShowRsvp]    = useState(false);

  // ── Persistence ──────────────────────────────────────────────────────
  // Hydrate the whole builder from the saved config once the wedding loads,
  // then autosave the config (debounced) as the couple edits.
  const readyRef = useRef(false);
  useEffect(() => {
    if (readyRef.current || loading) return;
    readyRef.current = true;
    const c = (weddingSite?.config ?? {}) as Record<string, unknown>;
    if (weddingSite && Object.keys(c).length > 0) {
      if (typeof c.lensId === 'string') setLensId(c.lensId);
      if (typeof c.colorId === 'string') setColorId(c.colorId);
      if (typeof c.fontId === 'string') setFontId(c.fontId);
      if (typeof c.layoutId === 'string') setLayoutId(c.layoutId);
      if (Array.isArray(c.sections)) setSections(c.sections as SectionMeta[]);
      if (typeof c.heroTagline === 'string') setHeroTagline(c.heroTagline);
      if (typeof c.storyText === 'string') setStoryText(c.storyText);
      if (typeof c.countdown === 'boolean') setCountdown(c.countdown);
      if (Array.isArray(c.program)) setProgram(c.program as ProgramEvent[]);
      if (typeof c.rsvpDeadline === 'string') setRsvpDeadline(c.rsvpDeadline);
      if (typeof c.rsvpPlusOne === 'boolean') setRsvpPlusOne(c.rsvpPlusOne);
      if (typeof c.rsvpMeal === 'boolean') setRsvpMeal(c.rsvpMeal);
      if (typeof c.rsvpDietary === 'boolean') setRsvpDietary(c.rsvpDietary);
      if (Array.isArray(c.rsvpEvents)) setRsvpEvents(c.rsvpEvents as RsvpSubEvent[]);
      if (Array.isArray(c.rsvpQuestions)) setRsvpQuestions(c.rsvpQuestions as RsvpQuestion[]);
      if (typeof c.rsvpChildren === 'boolean') setRsvpChildren(c.rsvpChildren);
      if (Array.isArray(c.galleryKeys)) setGalleryKeys(new Set(c.galleryKeys as (keyof typeof IMG)[]));
      if (typeof c.transport === 'string') setTransport(c.transport);
      if (typeof c.dresscode === 'string') setDresscode(c.dresscode);
      if (typeof c.giftsText === 'string') setGiftsText(c.giftsText);
      if (typeof c.giftsUrl === 'string') setGiftsUrl(c.giftsUrl);
      if (typeof c.mapQuery === 'string') setMapQuery(c.mapQuery);
      if (typeof c.showMap === 'boolean') setShowMap(c.showMap);
      if (typeof c.photoWallOpen === 'boolean') setPhotoWallOpen(c.photoWallOpen);
      if (typeof c.monogram === 'boolean') setMonogram(c.monogram);
      if (typeof c.monogramStyle === 'string' && (MONOGRAM_STYLES as readonly string[]).includes(c.monogramStyle))
        setMonogramStyle(c.monogramStyle as MonogramStyle);
      if (typeof c.monogramImagePath === 'string') setMonogramImagePath(c.monogramImagePath);
      if (Array.isArray(c.faq)) setFaq(c.faq as FAQItem[]);
      if (Array.isArray(c.hotels)) setHotels(c.hotels as HotelItem[]);
      if (typeof c.pwProtected === 'boolean') setPwProtected(c.pwProtected);
      if (typeof c.sitePassword === 'string') setSitePassword(c.sitePassword);
      if (typeof c.hideBranding === 'boolean') setHideBranding(c.hideBranding);
    }
    if (weddingSite?.domain) setDomain(weddingSite.domain);
    if (weddingSite) setPublished(weddingSite.published);
  }, [loading, weddingSite]);

  const config = useMemo(
    () => ({
      lensId, colorId, fontId, layoutId, sections, heroTagline, storyText, countdown,
      program, rsvpDeadline, rsvpPlusOne, rsvpMeal, rsvpDietary, galleryKeys: [...galleryKeys],
      rsvpEvents, rsvpQuestions, rsvpChildren, mapQuery, showMap, photoWallOpen,
      monogram, monogramStyle, monogramImagePath,
      transport, dresscode, giftsText, giftsUrl, faq, hotels, pwProtected, sitePassword, hideBranding,
    }),
    [lensId, colorId, fontId, layoutId, sections, heroTagline, storyText, countdown, program,
     rsvpDeadline, rsvpPlusOne, rsvpMeal, rsvpDietary, galleryKeys, transport, dresscode,
     rsvpEvents, rsvpQuestions, rsvpChildren, mapQuery, showMap, photoWallOpen,
     monogram, monogramStyle, monogramImagePath,
     giftsText, giftsUrl, faq, hotels, pwProtected, sitePassword, hideBranding]
  );

  useEffect(() => {
    if (!readyRef.current) return;
    const t = setTimeout(() => { void saveSite({ config, domain, published }); }, 800);
    return () => clearTimeout(t);
  }, [config, domain, published, saveSite]);

  const lens   = LENSES.find((l) => l.id === lensId)    ?? LENSES[0];
  const colors = WEBSITE_COLORS.find((c) => c.id === colorId) ?? WEBSITE_COLORS[0];
  const font   = FONTS.find((f) => f.id === fontId)     ?? FONTS[0];

  const toggleSection = (id: SectionId) =>
    setSections((prev) => prev.map((s) => s.id === id && !s.locked ? { ...s, enabled: !s.enabled } : s));

  const enabledSections = sections.filter((s) => s.enabled);

  const publicPath = `/w/${domain}`;
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}${publicPath}` : publicPath;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = (
    <SitePreview
      couple={couple}
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

              {/* Monogram */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <Eyebrow>05 — Monogram</Eyebrow>
                  <Toggle value={monogram} onChange={setMonogram} />
                </div>
                {monogram && (
                  <>
                    <div className="grid grid-cols-4 gap-2.5">
                      {MONOGRAM_STYLES.map((style) => {
                        const sel = style === monogramStyle && !monogramImagePath;
                        return (
                          <button key={style} onClick={() => { setMonogramStyle(style); setMonogramImagePath(''); }}
                            className={cn('relative flex aspect-square items-center justify-center rounded-xl rule bg-card cursor-pointer transition-all',
                              sel ? 'ring-2 ring-ink ring-offset-2 ring-offset-canvas' : 'hover:bg-shell/40')}>
                            <Monogram a={couple.a || 'A'} b={couple.b || 'B'} style={style}
                              color="var(--color-ink)" fontFamily={font.style.fontFamily} size={44} />
                            {sel && (
                              <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-ink">
                                <Check size={9} className="text-canvas" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <MonogramUpload imagePath={monogramImagePath} onUploaded={setMonogramImagePath} />
                    <p className="mt-2 text-[0.7rem] text-muted">Vises i toppen af siden, i hero-sektionen og i bunden.</p>
                  </>
                )}
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
                  <ToggleRow label="Antal børn" value={rsvpChildren} onChange={setRsvpChildren} />

                  {/* Svar pr. delarrangement */}
                  <div>
                    <Label>Delarrangementer (svar pr. event)</Label>
                    <p className="mb-2 text-[0.7rem] text-muted">Gæsterne svarer ja/nej til hvert punkt — fx fredagshygge, vielse og brunch. Tomt = ét samlet ja/nej.</p>
                    <div className="space-y-2">
                      {rsvpEvents.map((ev) => (
                        <div key={ev.id} className="flex items-start gap-2">
                          <div className="flex-1 space-y-1.5">
                            <input value={ev.label}
                              onChange={(e) => setRsvpEvents((p) => p.map((x) => x.id === ev.id ? { ...x, label: e.target.value } : x))}
                              className="w-full rounded-lg rule bg-card px-3 py-1.5 text-[0.82rem] text-ink focus:outline-none focus:ring-1 focus:ring-ink/20"
                              placeholder="Fx Vielse & fest" />
                            <input value={ev.sublabel}
                              onChange={(e) => setRsvpEvents((p) => p.map((x) => x.id === ev.id ? { ...x, sublabel: e.target.value } : x))}
                              className="w-full rounded-lg bg-transparent px-3 py-1 text-[0.74rem] text-muted focus:outline-none"
                              placeholder="Fx lørdag kl. 14 (valgfrit)" />
                          </div>
                          <button onClick={() => setRsvpEvents((p) => p.filter((x) => x.id !== ev.id))}
                            className="mt-1.5 shrink-0 text-muted hover:text-ink transition-colors cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-4">
                        <button onClick={() => setRsvpEvents((p) => [...p, { id: `re${Date.now()}`, label: '', sublabel: '' }])}
                          className="flex items-center gap-2 text-[0.78rem] text-muted hover:text-ink transition-colors cursor-pointer">
                          <Plus size={14} /> Tilføj delarrangement
                        </button>
                        {rsvpEvents.length === 0 && program.length > 0 && (
                          <button onClick={() => setRsvpEvents(program.map((ev) => ({ id: `re-${ev.id}`, label: ev.label, sublabel: ev.sublabel })))}
                            className="text-[0.78rem] text-muted hover:text-ink transition-colors cursor-pointer underline underline-offset-2">
                            Forudfyld fra program
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Egne spørgsmål */}
                  <div>
                    <Label>Egne spørgsmål</Label>
                    <p className="mb-2 text-[0.7rem] text-muted">{'Fx "Hvilken sang får jer på dansegulvet?"'}</p>
                    <div className="space-y-2">
                      {rsvpQuestions.map((q) => (
                        <div key={q.id} className="flex items-center gap-2">
                          <input value={q.label}
                            onChange={(e) => setRsvpQuestions((p) => p.map((x) => x.id === q.id ? { ...x, label: e.target.value } : x))}
                            className="flex-1 rounded-lg rule bg-card px-3 py-1.5 text-[0.82rem] text-ink focus:outline-none focus:ring-1 focus:ring-ink/20"
                            placeholder="Spørgsmål til gæsterne" />
                          <button onClick={() => setRsvpQuestions((p) => p.filter((x) => x.id !== q.id))}
                            className="shrink-0 text-muted hover:text-ink transition-colors cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setRsvpQuestions((p) => [...p, { id: `rq${Date.now()}`, label: '' }])}
                        className="flex items-center gap-2 text-[0.78rem] text-muted hover:text-ink transition-colors cursor-pointer">
                        <Plus size={14} /> Tilføj spørgsmål
                      </button>
                    </div>
                  </div>
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
                <div className="mt-4 flex items-center justify-between">
                  <Label>Vis kort på siden</Label>
                  <Toggle value={showMap} onChange={setShowMap} />
                </div>
                {showMap && (
                  <div className="mt-2">
                    <input value={mapQuery} onChange={(e) => setMapQuery(e.target.value)}
                      placeholder="Kort-søgning (valgfrit — ellers bruges adressen)"
                      className="w-full rounded-lg rule bg-card px-3 py-2 text-[0.82rem] text-ink placeholder:text-muted focus:outline-none" />
                    <p className="mt-1 text-[0.7rem] text-muted">Google Maps indlejres automatisk med denne søgning.</p>
                  </div>
                )}
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
                          <div className="flex gap-3">
                            <input value={h.url ?? ''} onChange={(e) => setHotels((prev) => prev.map((x) => x.id === h.id ? { ...x, url: e.target.value } : x))}
                              className="flex-1 text-[0.75rem] text-muted bg-transparent focus:outline-none" placeholder="Booking-link (https://…)" />
                            <input value={h.code ?? ''} onChange={(e) => setHotels((prev) => prev.map((x) => x.id === h.id ? { ...x, code: e.target.value } : x))}
                              className="w-28 text-[0.75rem] text-muted bg-transparent focus:outline-none" placeholder="Rabatkode" />
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

                {/* Soveplads på stedet */}
                <div className="mt-6">
                  <Label>Soveplads på stedet</Label>
                  <p className="mb-2 text-[0.7rem] text-muted">
                    Opret værelser/senge — gæsterne reserverer direkte i RSVP-flowet. Først til mølle med automatisk venteliste.
                  </p>
                  <RoomManager
                    rooms={accommodationRooms}
                    reservations={accommodationReservations}
                    onAdd={addRoom}
                    onUpdate={updateRoom}
                    onDelete={deleteRoom}
                    onUpdateReservation={updateReservation}
                    onDeleteReservation={deleteReservation}
                  />
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
                  Gæsterne uploader billeder uden login via linket eller QR-koden. Alt samles her, hvor I kan skjule, slette og downloade.
                </p>
                <div className="mt-3 rule rounded-xl bg-shell px-4 py-3 text-[0.78rem] text-muted">
                  Upload-link: <span className="font-mono text-ink">{publicUrl.replace(/^https?:\/\//, '')}/photos</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <Label>Vis gæsternes billeder før dagen</Label>
                    <p className="text-[0.7rem] text-muted -mt-1">Ellers vises de først efter brylluppet.</p>
                  </div>
                  <Toggle value={photoWallOpen} onChange={setPhotoWallOpen} />
                </div>
                <div className="mt-4">
                  <PhotosManager photos={sitePhotos} onToggleHidden={(id, hidden) => void updateSitePhoto(id, { hidden })}
                    onDelete={(id) => void removeSitePhoto(id)} />
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
                    <a href={publicPath} target="_blank" rel="noopener noreferrer"
                      className="flex-1 truncate py-2.5 text-[0.82rem] text-ink font-mono hover:underline">{publicUrl.replace(/^https?:\/\//, '')}</a>
                    <a href={publicPath} target="_blank" rel="noopener noreferrer"
                      className="mr-1 shrink-0 text-[0.72rem] text-muted hover:text-ink transition-colors">Se live ↗</a>
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
                <p className="text-[0.8rem] text-muted mb-4">Send linket i invitationen eller print QR-koderne — én til siden og én direkte til billeddeling.</p>
                <div className="mb-5 flex items-center gap-2">
                  <div className="flex-1 rule rounded-xl bg-shell px-4 py-2.5 text-[0.82rem] font-mono text-ink truncate">
                    {publicUrl.replace(/^https?:\/\//, '')}
                  </div>
                  <button onClick={copyLink}
                    className="shrink-0 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Kopieret!' : 'Kopiér'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <QrCard label="Bryllupssiden" url={publicUrl} filename={`${domain}-qr`} />
                  <QrCard label="Billeddeling" url={`${publicUrl}/photos`} filename={`${domain}-billeder-qr`} />
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
                    { label: 'RSVP modtaget',   value: published ? String(guestRows.filter((g) => g.rsvp !== 'afventer').length) : '—' },
                    { label: 'Billeder delt',   value: published ? String(sitePhotos.length) : '—' },
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

/* ── Room manager (soveplads på stedet) ──────────────────────────────── */
function RoomManager({ rooms, reservations, onAdd, onUpdate, onDelete, onUpdateReservation, onDeleteReservation }: {
  rooms: AccommodationRoomRow[];
  reservations: AccommodationReservationRow[];
  onAdd: (room: { name: string; capacity: number; description?: string | null; price_per_spot_cents?: number | null }) => Promise<AccommodationRoomRow | null>;
  onUpdate: (id: string, patch: Partial<AccommodationRoomRow>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateReservation: (id: string, patch: Partial<AccommodationReservationRow>) => Promise<{ error: string | null }>;
  onDeleteReservation: (id: string) => Promise<void>;
}) {
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState(2);
  const [newPrice, setNewPrice] = useState('');
  const [moveError, setMoveError] = useState<string | null>(null);
  const availability = roomAvailability(rooms, reservations);

  const add = () => {
    const name = newName.trim();
    if (!name || newCapacity < 1) return;
    const kr = Number.parseInt(newPrice.replace(/[^\d]/g, ''), 10);
    void onAdd({ name, capacity: newCapacity, price_per_spot_cents: Number.isFinite(kr) && kr > 0 ? kr * 100 : null });
    setNewName(''); setNewCapacity(2); setNewPrice('');
  };

  const move = async (res: AccommodationReservationRow, roomId: string) => {
    setMoveError(null);
    // Moving a waitlisted guest into a room confirms them; the DB capacity
    // trigger rejects the move with room_full if it no longer fits.
    const { error } = await onUpdateReservation(res.id, { room_id: roomId, status: 'confirmed' });
    if (error) setMoveError(error.includes('room_full') ? 'Ikke plads nok i det værelse.' : error);
  };

  return (
    <div className="space-y-3">
      {rooms.map((room) => {
        const avail = availability[room.id];
        const roomRes = reservations.filter((r) => r.room_id === room.id);
        return (
          <div key={room.id} className="rule rounded-xl bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1.5">
                <input value={room.name}
                  onChange={(e) => void onUpdate(room.id, { name: e.target.value })}
                  className="w-full text-[0.85rem] font-medium text-ink bg-transparent focus:outline-none border-b border-[var(--color-line)] pb-0.5"
                  placeholder="Fx Værelse 1: dobbeltseng" />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[0.75rem] text-muted">
                    Pladser:
                    <input type="number" min={1} value={room.capacity}
                      onChange={(e) => { const v = Number.parseInt(e.target.value, 10); if (v >= 1) void onUpdate(room.id, { capacity: v }); }}
                      className="w-14 rounded-lg rule bg-shell px-2 py-0.5 text-[0.78rem] text-ink text-center focus:outline-none" />
                  </label>
                  <label className="flex items-center gap-1.5 text-[0.75rem] text-muted">
                    Pris/plads (kr):
                    <input value={room.price_per_spot_cents != null ? String(room.price_per_spot_cents / 100) : ''}
                      onChange={(e) => {
                        const kr = Number.parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
                        void onUpdate(room.id, { price_per_spot_cents: Number.isFinite(kr) && kr > 0 ? kr * 100 : null });
                      }}
                      className="w-16 rounded-lg rule bg-shell px-2 py-0.5 text-[0.78rem] text-ink text-center focus:outline-none"
                      placeholder="—" />
                  </label>
                  <span className={cn('ml-auto rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium',
                    (avail?.free ?? 0) > 0 ? 'bg-sage-tint text-ink' : 'bg-shell text-muted')}>
                    {avail?.taken ?? 0}/{room.capacity} optaget
                  </span>
                </div>
              </div>
              <button onClick={() => { if (roomRes.length === 0 || window.confirm('Slet værelset og alle reservationer?')) void onDelete(room.id); }}
                className="shrink-0 text-muted hover:text-ink transition-colors cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>

            {roomRes.length > 0 && (
              <div className="mt-2.5 space-y-1.5 border-t border-[var(--color-line)] pt-2.5">
                {roomRes.map((res) => (
                  <div key={res.id} className="flex items-center gap-2 text-[0.78rem]">
                    <span className="flex-1 truncate text-ink">{res.guest_name} · {res.spots} {res.spots === 1 ? 'plads' : 'pladser'}</span>
                    {res.status === 'waitlist' && (
                      <span className="rounded-full bg-shell px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.08em] text-muted">Venteliste</span>
                    )}
                    <select value={res.status === 'waitlist' ? '' : res.room_id}
                      onChange={(e) => { if (e.target.value) void move(res, e.target.value); }}
                      className="rounded-lg rule bg-shell px-1.5 py-0.5 text-[0.7rem] text-ink focus:outline-none cursor-pointer">
                      {res.status === 'waitlist' && <option value="">Flyt til…</option>}
                      {rooms.map((r) => <option key={r.id} value={r.id}>{r.name || 'Uden navn'}</option>)}
                    </select>
                    <button onClick={() => void onDeleteReservation(res.id)}
                      className="shrink-0 text-muted/60 hover:text-ink transition-colors cursor-pointer">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {moveError && <p className="text-[0.74rem] text-[var(--color-terracotta)]">{moveError}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          className="flex-1 min-w-[140px] rounded-lg rule bg-card px-3 py-1.5 text-[0.82rem] text-ink focus:outline-none focus:ring-1 focus:ring-ink/20"
          placeholder="Fx Sovesal: 8 pladser" />
        <input type="number" min={1} value={newCapacity}
          onChange={(e) => setNewCapacity(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
          className="w-16 rounded-lg rule bg-card px-2 py-1.5 text-[0.82rem] text-ink text-center focus:outline-none"
          aria-label="Antal pladser" />
        <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
          className="w-20 rounded-lg rule bg-card px-2 py-1.5 text-[0.82rem] text-ink text-center focus:outline-none"
          placeholder="kr/plads" />
        <button onClick={add} disabled={!newName.trim()}
          className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[0.72rem] font-medium text-canvas disabled:opacity-40 cursor-pointer">
          <Plus size={12} /> Tilføj
        </button>
      </div>
    </div>
  );
}

/* ── Monogram upload (eget SVG/PNG i stedet for det genererede) ──────── */
function MonogramUpload({ imagePath, onUploaded }: {
  imagePath: string;
  onUploaded: (path: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('kind', 'monogram');
      const res = await fetch('/api/site-photos/upload', { method: 'POST', body: form });
      const j = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
      if (!res.ok || !j.path) {
        setError(j.error === 'file_too_large' ? 'Filen er for stor (maks. 1 MB).' : 'Upload fejlede — prøv igen.');
        return;
      }
      onUploaded(j.path);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="mt-3 flex items-center gap-3">
      <input ref={fileRef} type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" hidden
        onChange={(e) => void upload(e.target.files)} />
      <button onClick={() => fileRef.current?.click()} disabled={busy}
        className="flex items-center gap-1.5 rounded-full rule px-3.5 py-1.5 text-[0.72rem] text-ink-soft hover:bg-shell disabled:opacity-40 cursor-pointer">
        <Plus size={12} /> {busy ? 'Uploader…' : imagePath ? 'Skift eget monogram' : 'Upload eget monogram'}
      </button>
      {imagePath && (
        <button onClick={() => onUploaded('')}
          className="text-[0.72rem] text-muted hover:text-ink transition-colors cursor-pointer">
          Brug genereret i stedet
        </button>
      )}
      {error && <span className="text-[0.72rem] text-[var(--color-terracotta)]">{error}</span>}
    </div>
  );
}

/* ── QR card (real code + download for print) ────────────────────────── */
function QrCard({ label, url, filename }: { label: string; url: string; filename: string }) {
  const svg = useMemo(() => qrSvg(url), [url]);

  const downloadPng = async () => {
    try {
      const dataUrl = await qrPngDataUrl(url, 1024);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename}.png`;
      a.click();
    } catch { /* canvas unavailable — SVG download still works */ }
  };

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="rule rounded-xl bg-shell p-4 flex flex-col items-center gap-2">
      <div className="w-24 rounded-lg bg-white p-1.5 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }} />
      <span className="text-[0.68rem] uppercase tracking-[0.12em] text-muted">{label}</span>
      <div className="flex gap-2">
        <button onClick={() => void downloadPng()}
          className="flex items-center gap-1 text-[0.68rem] text-muted hover:text-ink transition-colors cursor-pointer">
          <Download size={11} /> PNG
        </button>
        <button onClick={downloadSvg}
          className="flex items-center gap-1 text-[0.68rem] text-muted hover:text-ink transition-colors cursor-pointer">
          <Download size={11} /> SVG
        </button>
      </div>
    </div>
  );
}

/* ── Photos manager (moderation + upload + download-alt) ─────────────── */
function PhotosManager({ photos, onToggleHidden, onDelete }: {
  photos: SitePhotoRow[];
  onToggleHidden: (id: string, hidden: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  // Owner-read storage policy lets the couple sign their own paths directly.
  useEffect(() => {
    const missing = photos.filter((p) => !urls[p.id]);
    if (missing.length === 0) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.storage
        .from('site-photos')
        .createSignedUrls(missing.map((p) => p.storage_path), 3600);
      if (cancelled || !data) return;
      setUrls((prev) => {
        const next = { ...prev };
        missing.forEach((p, i) => {
          const u = data[i]?.signedUrl;
          if (u) next[p.id] = u;
        });
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [photos, supabase, urls]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set('file', file);
        form.set('kind', 'photo');
        await fetch('/api/site-photos/upload', { method: 'POST', body: form });
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
          onChange={(e) => void upload(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[0.72rem] font-medium text-canvas disabled:opacity-40 cursor-pointer">
          <Plus size={12} /> {busy ? 'Uploader…' : 'Upload egne billeder'}
        </button>
        {photos.length > 0 && (
          <a href="/api/site-photos/export" download
            className="rounded-full rule px-3.5 py-1.5 text-[0.72rem] text-ink-soft hover:bg-shell cursor-pointer">
            Download alle ({photos.length})
          </a>
        )}
      </div>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {photos.map((p) => (
            <div key={p.id} className={cn('group relative aspect-square overflow-hidden rounded-lg bg-shell', p.hidden && 'opacity-40')}>
              {urls[p.id] && <img src={urls[p.id]} alt="" className="h-full w-full object-cover" />}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-ink/60 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => onToggleHidden(p.id, !p.hidden)} title={p.hidden ? 'Vis' : 'Skjul'}
                  className="text-canvas cursor-pointer">
                  {p.hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => { if (window.confirm('Slet billedet permanent?')) onDelete(p.id); }}
                  title="Slet" className="text-canvas cursor-pointer">
                  <Trash2 size={12} />
                </button>
              </div>
              {p.uploader_name && (
                <span className="absolute left-1 top-1 rounded bg-ink/50 px-1 text-[0.55rem] text-canvas">{p.uploader_name}</span>
              )}
            </div>
          ))}
        </div>
      )}
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
  couple, lens, colors, font, layoutId, sections, heroTagline, storyText, program, domain, countdown, galleryKeys,
  showBranding, onBrandingClick, onRsvpClick,
}: {
  couple: Couple;
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
  const daysLeft = couple.dateISO
    ? Math.ceil((new Date(couple.dateISO).getTime() - TODAY.getTime()) / 86400000)
    : 0;

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
