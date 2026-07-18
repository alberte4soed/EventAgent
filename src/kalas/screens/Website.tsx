import { useState, useId, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, Globe, Smartphone, Plus, Trash2, Sparkles, Loader2, Upload,
  Lock, Copy, Eye, MapPin, Gift, HelpCircle, Bed, History, Star,
  Camera, Clock, BookOpen, Image, QrCode, ChevronDown,
} from 'lucide-react';
import { IMAGES as IMG, guests } from '../data';
import { Eyebrow, cn } from '../ui';
import OnboardingHint from '../OnboardingHint';
import { useWedding, type Couple } from '../useWedding';
import { SiteRenderer } from '../site/SiteRenderer';
import {
  parseConfig, slugify, INIT_SECTIONS, INIT_PROGRAM, INIT_FAQ, INIT_HOTELS, GALLERY_KEYS,
  type SiteConfig, type ProgramEvent, type FAQItem, type HotelItem, type SectionId, type SectionMeta,
} from '../site/config';
import { parseSiteDesign, DEFAULT_DESIGN, type SiteDesign } from '../site/design';
import { googleFontsHref } from '../site/fonts';
import { websitePriceDkk } from '@/lib/website/pricing';
import type { SitePhotoRow, WebsiteDesignRow } from '@/lib/db/types';

type WTab = 'design' | 'indhold' | 'indstillinger';

/** Style keywords the couple can hand Ava alongside free text. */
const VIBE_CHIPS = [
  'Romantisk', 'Minimalistisk', 'Boheme', 'Klassisk',
  'Moderne', 'Dramatisk', 'Farverigt', 'Nordisk',
];

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */
export default function Website() {
  const {
    couple, loading, event, weddingSite, saveSite,
    websiteDesign, websiteDesigns, sitePhotos, websitePaid, refresh,
  } = useWedding();
  const [tab,      setTab]      = useState<WTab>('design');

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
      if (Array.isArray(c.sections)) setSections(c.sections as SectionMeta[]);
      if (typeof c.heroTagline === 'string') setHeroTagline(c.heroTagline);
      if (typeof c.storyText === 'string') setStoryText(c.storyText);
      if (typeof c.countdown === 'boolean') setCountdown(c.countdown);
      if (Array.isArray(c.program)) setProgram(c.program as ProgramEvent[]);
      if (typeof c.rsvpDeadline === 'string') setRsvpDeadline(c.rsvpDeadline);
      if (typeof c.rsvpPlusOne === 'boolean') setRsvpPlusOne(c.rsvpPlusOne);
      if (typeof c.rsvpMeal === 'boolean') setRsvpMeal(c.rsvpMeal);
      if (typeof c.rsvpDietary === 'boolean') setRsvpDietary(c.rsvpDietary);
      if (Array.isArray(c.galleryKeys)) setGalleryKeys(new Set(c.galleryKeys as (keyof typeof IMG)[]));
      if (typeof c.transport === 'string') setTransport(c.transport);
      if (typeof c.dresscode === 'string') setDresscode(c.dresscode);
      if (typeof c.giftsText === 'string') setGiftsText(c.giftsText);
      if (typeof c.giftsUrl === 'string') setGiftsUrl(c.giftsUrl);
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
      sections, heroTagline, storyText, countdown,
      program, rsvpDeadline, rsvpPlusOne, rsvpMeal, rsvpDietary, galleryKeys: [...galleryKeys],
      transport, dresscode, giftsText, giftsUrl, faq, hotels, pwProtected, sitePassword, hideBranding,
    }),
    [sections, heroTagline, storyText, countdown, program,
     rsvpDeadline, rsvpPlusOne, rsvpMeal, rsvpDietary, galleryKeys, transport, dresscode,
     giftsText, giftsUrl, faq, hotels, pwProtected, sitePassword, hideBranding]
  );

  useEffect(() => {
    if (!readyRef.current) return;
    const t = setTimeout(() => { void saveSite({ config, domain, published }); }, 800);
    return () => clearTimeout(t);
  }, [config, domain, published, saveSite]);

  const toggleSection = (id: SectionId) =>
    setSections((prev) => prev.map((s) => s.id === id && !s.locked ? { ...s, enabled: !s.enabled } : s));

  const publicPath = `/w/${domain}`;
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}${publicPath}` : publicPath;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── AI design state ──────────────────────────────────────────────────
  const design: SiteDesign = useMemo(
    () => (websiteDesign ? parseSiteDesign(websiteDesign.design) : DEFAULT_DESIGN),
    [websiteDesign]
  );

  // Signed preview URLs for the couple's photos (bucket is private).
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const photoIdsKey = sitePhotos.map((p) => p.id).join(',');
  useEffect(() => {
    if (!event) return;
    let alive = true;
    fetch(`/api/website/photos?eventId=${event.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { photos?: (SitePhotoRow & { url: string | null })[] } | null) => {
        if (!alive || !d?.photos) return;
        setPhotoUrls(Object.fromEntries(d.photos.filter((p) => p.url).map((p) => [p.id, p.url as string])));
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, photoIdsKey]);

  const [working, setWorking] = useState<null | 'generate' | 'refine'>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [needsPayment, setNeedsPayment] = useState(false);

  const callDesignApi = async (path: string, body: Record<string, unknown>, kind: 'generate' | 'refine') => {
    if (!event) return;
    setWorking(kind);
    setGenError(null);
    try {
      const res = await fetch(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, ...body }),
      });
      if (res.status === 402) { setNeedsPayment(true); return; }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        setGenError(data.message ?? data.error ?? 'Noget gik galt — prøv igen.');
        return;
      }
      await refresh();
    } catch {
      setGenError('Noget gik galt — prøv igen.');
    } finally {
      setWorking(null);
    }
  };

  const generateDesign = (styleDirection: string, vibes: string[]) =>
    callDesignApi('/api/website/design', { styleDirection, vibes }, 'generate');
  const refineDesign = (instruction: string) =>
    callDesignApi('/api/website/design/refine', { instruction }, 'refine');

  const activateDesign = async (designId: string) => {
    await fetch('/api/website/design/activate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId }),
    }).catch(() => {});
    await refresh();
  };

  const startCheckout = async () => {
    if (!event) return;
    const res = await fetch('/api/website/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id }),
    }).catch(() => null);
    if (!res) return;
    if (res.status === 503) { setNeedsPayment(false); return; } // Stripe not configured → unlocked
    const data = (await res.json().catch(() => ({}))) as { url?: string };
    if (data.url) window.location.href = data.url;
  };

  // Back from Stripe: land on this screen and poll until the webhook lands.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('website_checkout')) return;
    const success = params.get('website_checkout') === 'success';
    params.delete('website_checkout');
    const qs = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    if (!success) return;
    let tries = 0;
    const t = setInterval(() => {
      tries += 1;
      void refresh();
      if (tries >= 8) clearInterval(t);
    }, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadPhotos = async (files: FileList | File[]) => {
    if (!event) return;
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      form.append('eventId', event.id);
      await fetch('/api/website/photos', { method: 'POST', body: form }).catch(() => {});
    }
    await refresh();
  };

  const deletePhoto = async (photoId: string) => {
    await fetch(`/api/website/photos/${photoId}`, { method: 'DELETE' }).catch(() => {});
    await refresh();
  };

  const setHeroPhoto = async (photoId: string) => {
    await fetch(`/api/website/photos/${photoId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'hero' }),
    }).catch(() => {});
    await refresh();
  };

  const previewConfig = useMemo(() => parseConfig(config), [config]);

  const preview = (
    <ScaledPreview
      domain={domain}
      couple={couple}
      config={previewConfig}
      design={design}
      photoUrls={photoUrls}
      onRsvp={() => setShowRsvp(true)}
    />
  );

  return (
    <div className="min-h-screen">

      {/* ── Sticky tab header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur-md rule-b">
        <div className="flex items-center justify-between px-6 pt-5 sm:px-9 lg:px-12">
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
              'mb-3 h-8 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer',
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
            <div className="px-6 py-10 sm:px-9 lg:px-12 lg:py-12 lg:rule-r">
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

            {/* Right: Ava design studio */}
            <div className="rule-t lg:rule-t-0 px-6 py-10 sm:px-9 lg:py-12 overflow-y-auto">
              <DesignStudio
                hasDesign={Boolean(websiteDesign)}
                design={design}
                designs={websiteDesigns}
                activeId={websiteDesign?.id ?? null}
                photos={sitePhotos}
                photoUrls={photoUrls}
                working={working}
                genError={genError}
                needsPayment={needsPayment}
                websitePaid={websitePaid}
                onGenerate={generateDesign}
                onRefine={refineDesign}
                onActivate={activateDesign}
                onCheckout={startCheckout}
                onUpload={uploadPhotos}
                onDeletePhoto={deletePhoto}
                onSetHero={setHeroPhoto}
              />
            </div>
          </motion.div>
        )}

        {tab === 'indhold' && (
          <motion.div key="indhold"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid lg:grid-cols-[1fr_380px] lg:min-h-[calc(100vh-76px)]">

            {/* Left: section editors */}
            <div className="px-6 py-10 sm:px-9 lg:px-12 lg:py-12 space-y-3 lg:rule-r">
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
            className="px-6 py-10 sm:px-9 lg:px-12 max-w-2xl">

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
                <p className="text-[0.8rem] text-muted mb-4">Send linket i invitationen eller print QR-koden.</p>
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="rule rounded-xl bg-shell px-4 py-2.5 text-[0.82rem] font-mono text-ink truncate">
                      {publicUrl.replace(/^https?:\/\//, '')}
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
                  {websitePaid
                    ? <Toggle value={!hideBranding} onChange={(v) => setHideBranding(!v)} />
                    : <span className="shrink-0 rounded-full bg-sage-tint px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink">Inkluderet i køb</span>
                  }
                </div>
                {!websitePaid && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rule rounded-xl bg-shell px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-[0.78rem] text-muted">Branding fjernes når I låser Ava-designeren op</p>
                    <button onClick={() => void startCheckout()}
                      className="shrink-0 rounded-full bg-ink px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                      Lås op · {websitePriceDkk()} kr
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
                  style={{ background: 'var(--color-ink)' }}
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
                style={{ background: 'var(--color-ink)' }}
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

/* ── Live preview — the real public renderer, scaled down ─────────────── */
function ScaledPreview({ domain, couple, config, design, photoUrls, onRsvp }: {
  domain: string;
  couple: Couple;
  config: SiteConfig;
  design: SiteDesign;
  photoUrls: Record<string, string>;
  onRsvp: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.35);
  const FULL_W = 1180; // desktop viewport the site is designed at

  useEffect(() => {
    const measure = () => {
      const w = wrapRef.current?.clientWidth ?? 420;
      setScale(w / FULL_W);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl rule bg-card shadow-[0_16px_48px_-20px_rgba(0,0,0,0.25)]">
      {/* Fonts the current design uses — loaded app-side for the preview */}
      <link rel="stylesheet" href={googleFontsHref([design.typography.displayFont, design.typography.bodyFont])} />
      {/* Browser chrome */}
      <div className="flex items-center gap-2 rule-b bg-shell px-4 py-2.5">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-[var(--color-line-strong)]" />)}
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-[0.68rem] text-muted">
          <Lock size={9} /> {domain}.kalas.dk
        </div>
      </div>
      {/* Scaled real site */}
      <div ref={wrapRef} className="relative h-[520px] overflow-hidden">
        <div
          className="absolute left-0 top-0 origin-top-left overflow-y-auto"
          style={{ width: FULL_W, height: 520 / scale, transform: `scale(${scale})` }}
        >
          <SiteRenderer
            couple={{ a: couple.a, b: couple.b, dateLabel: couple.dateLabel, dateISO: couple.dateISO }}
            config={config}
            design={design}
            photoUrls={photoUrls}
            onRsvp={onRsvp}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Ava design studio — intake, generation, refinement, versions ─────── */
function DesignStudio({
  hasDesign, design, designs, activeId, photos, photoUrls, working, genError,
  needsPayment, websitePaid, onGenerate, onRefine, onActivate, onCheckout,
  onUpload, onDeletePhoto, onSetHero,
}: {
  hasDesign: boolean;
  design: SiteDesign;
  designs: WebsiteDesignRow[];
  activeId: string | null;
  photos: SitePhotoRow[];
  photoUrls: Record<string, string>;
  working: null | 'generate' | 'refine';
  genError: string | null;
  needsPayment: boolean;
  websitePaid: boolean;
  onGenerate: (styleDirection: string, vibes: string[]) => void;
  onRefine: (instruction: string) => void;
  onActivate: (designId: string) => void;
  onCheckout: () => void;
  onUpload: (files: FileList) => void;
  onDeletePhoto: (id: string) => void;
  onSetHero: (id: string) => void;
}) {
  const [styleDirection, setStyleDirection] = useState('');
  const [vibes, setVibes] = useState<Set<string>>(new Set());
  const [instruction, setInstruction] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  const toggleVibe = (v: string) =>
    setVibes((prev) => {
      const n = new Set(prev);
      if (n.has(v)) n.delete(v); else n.add(v);
      return n;
    });

  const submitRefine = () => {
    const text = instruction.trim();
    if (!text || working) return;
    setInstruction('');
    onRefine(text);
  };

  /* Paywall card takes over the studio until unlocked. */
  if (needsPayment && !websitePaid) {
    return (
      <div className="rule rounded-2xl bg-card p-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink">
          <Sparkles size={20} className="text-canvas" />
        </div>
        <p className="font-serif text-[1.4rem] text-ink leading-tight">Lås Ava-designeren op</p>
        <p className="mx-auto mt-2 max-w-xs text-[0.85rem] text-muted leading-relaxed">
          Ava designer jeres personlige hjemmeside ud fra jeres billeder og stil — og I kan bede hende justere, indtil den er helt rigtig. Engangsbeløb, inkl. fjernelse af Kalas-branding.
        </p>
        <button onClick={onCheckout}
          className="mt-6 rounded-full bg-ink px-7 py-3 text-[0.75rem] font-bold uppercase tracking-[0.16em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
          Lås op · {websitePriceDkk()} kr
        </button>
        <p className="mt-3 text-[0.7rem] text-muted">Betaling via Stripe · gælder hele jeres bryllup</p>
      </div>
    );
  }

  /* Working state. */
  if (working) {
    return (
      <div className="rule rounded-2xl bg-card p-8 text-center">
        <Loader2 size={26} className="mx-auto animate-spin text-ink" />
        <p className="mt-4 font-serif text-[1.25rem] text-ink">
          {working === 'generate' ? 'Ava designer jeres side…' : 'Ava justerer designet…'}
        </p>
        <p className="mx-auto mt-2 max-w-xs text-[0.82rem] text-muted leading-relaxed">
          Hun kigger på jeres billeder, vælger farver og typografi og bygger siden op. Det tager typisk under et minut.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {genError && (
        <p className="rule rounded-xl bg-[#f2e3dd] px-4 py-3 text-[0.82rem] text-[var(--color-terracotta)]">{genError}</p>
      )}

      {/* Concept / intake */}
      {hasDesign ? (
        <section className="rule rounded-2xl bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Eyebrow className="mb-2">Jeres design</Eyebrow>
              <p className="font-serif text-[1.5rem] leading-tight text-ink">{design.concept.name}</p>
            </div>
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-tint">
              <Sparkles size={15} className="text-ink" />
            </span>
          </div>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">{design.concept.rationale}</p>
          <div className="mt-4 flex items-center gap-1.5">
            {[design.palette.bg, design.palette.surface, design.palette.accent, design.palette.text].map((c, i) => (
              <span key={i} className="h-5 w-5 rounded-full rule" style={{ background: c }} />
            ))}
            <span className="ml-2 text-[0.7rem] text-muted">{design.typography.displayFont} · {design.typography.bodyFont}</span>
          </div>

          {/* Refine */}
          <div className="mt-5 rule-t pt-5">
            <Label>Fortæl Ava hvad der skal ændres</Label>
            <div className="mt-2 flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitRefine(); }}
                placeholder="f.eks. gør den mørkere, større billeder…"
                className="min-w-0 flex-1 rule rounded-xl bg-shell px-4 py-2.5 text-[0.85rem] text-ink placeholder:text-muted focus:outline-none"
              />
              <button onClick={submitRefine} disabled={!instruction.trim()}
                className="shrink-0 rounded-full bg-ink px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-canvas hover:bg-ink/80 disabled:opacity-40 transition-colors cursor-pointer">
                Justér
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button onClick={() => onGenerate(styleDirection, [...vibes])}
                className="flex items-center gap-1.5 text-[0.75rem] text-muted hover:text-ink transition-colors cursor-pointer">
                <Sparkles size={12} /> Helt nyt design
              </button>
              {designs.length > 1 && (
                <button onClick={() => setShowVersions((v) => !v)}
                  className="flex items-center gap-1.5 text-[0.75rem] text-muted hover:text-ink transition-colors cursor-pointer">
                  <History size={12} /> Versioner ({designs.length})
                </button>
              )}
            </div>
          </div>

          {/* Version history */}
          <AnimatePresence>
            {showVersions && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 space-y-2">
                  {designs.map((d) => {
                    const pd = parseSiteDesign(d.design);
                    const isActive = d.id === activeId;
                    return (
                      <button key={d.id} onClick={() => { if (!isActive) void onActivate(d.id); }}
                        className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer',
                          isActive ? 'bg-sage-tint' : 'bg-shell hover:bg-card')}>
                        <span className="flex gap-1">
                          {[pd.palette.bg, pd.palette.accent, pd.palette.text].map((c, i) => (
                            <span key={i} className="h-3.5 w-3.5 rounded-full rule" style={{ background: c }} />
                          ))}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[0.82rem] text-ink">{pd.concept.name}</span>
                        <span className="shrink-0 text-[0.65rem] text-muted">
                          {new Date(d.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                        </span>
                        {isActive && <Check size={13} className="shrink-0 text-ink" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      ) : (
        <section className="rule rounded-2xl bg-card p-6">
          <Eyebrow className="mb-2">Ava designer jeres side</Eyebrow>
          <p className="font-serif text-[1.4rem] leading-tight text-ink">Hvordan skal den føles?</p>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
            Vælg stemninger, beskriv jeres stil med egne ord, og upload et par billeder — så designer Ava en side, der er helt jeres.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {VIBE_CHIPS.map((v) => {
              const on = vibes.has(v);
              return (
                <button key={v} onClick={() => toggleVibe(v)}
                  className={cn('rounded-full px-3.5 py-1.5 text-[0.75rem] font-medium transition-colors cursor-pointer',
                    on ? 'bg-ink text-canvas' : 'rule bg-shell text-ink-soft hover:text-ink')}>
                  {v}
                </button>
              );
            })}
          </div>
          <textarea
            value={styleDirection}
            onChange={(e) => setStyleDirection(e.target.value)}
            rows={3}
            placeholder="f.eks. Vi drømmer om noget let og botanisk med varme toner — ikke for stift…"
            className="mt-3 w-full resize-none rule rounded-xl bg-shell px-4 py-3 text-[0.85rem] text-ink placeholder:text-muted focus:outline-none"
          />
          <button onClick={() => onGenerate(styleDirection, [...vibes])}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[0.75rem] font-bold uppercase tracking-[0.16em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
            <Sparkles size={14} /> Lad Ava designe jeres side
          </button>
        </section>
      )}

      {/* Photos */}
      <PhotoManager
        photos={photos}
        photoUrls={photoUrls}
        onUpload={onUpload}
        onDelete={onDeletePhoto}
        onSetHero={onSetHero}
      />
    </div>
  );
}

/* ── Photo manager — the couple's own photos feed the design ──────────── */
function PhotoManager({ photos, photoUrls, onUpload, onDelete, onSetHero }: {
  photos: SitePhotoRow[];
  photoUrls: Record<string, string>;
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  onSetHero: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try { await onUpload(files); } finally { setBusy(false); }
  };

  return (
    <section className="rule rounded-2xl bg-card p-6">
      <div className="flex items-center justify-between">
        <Eyebrow>Jeres billeder</Eyebrow>
        <span className="text-[0.7rem] text-muted">{photos.length} / 24</span>
      </div>
      <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">
        Ava designer ud fra jeres egne billeder — forlovelsesbilleder, stedet, jer to. Markér ét som forsidebillede.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {photos.map((p) => {
          const url = photoUrls[p.id];
          return (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-shell">
              {url
                ? <img src={url} alt="" className="h-full w-full object-cover" />
                : <span className="flex h-full items-center justify-center"><Image size={16} className="text-muted" /></span>}
              {p.role === 'hero' && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-canvas">
                  <Star size={8} /> Forside
                </span>
              )}
              {p.kind === 'generated' && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-canvas/85">
                  <Sparkles size={10} className="text-ink" />
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {p.role !== 'hero' ? (
                  <button onClick={() => onSetHero(p.id)} title="Brug som forsidebillede"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas/90 text-ink hover:bg-canvas cursor-pointer">
                    <Star size={11} />
                  </button>
                ) : <span />}
                <button onClick={() => onDelete(p.id)} title="Slet billede"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas/90 text-ink hover:bg-canvas cursor-pointer">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy || photos.length >= 24}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--color-line-strong)] text-muted transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-40 cursor-pointer"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.1em]">Upload</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { void handleFiles(e.target.files); e.target.value = ''; }}
      />
      <p className="mt-3 text-[0.68rem] text-muted">JPEG, PNG eller WebP · max 8 MB pr. billede</p>
    </section>
  );
}
