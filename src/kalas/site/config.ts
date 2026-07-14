/* Shared wedding-site config: the types, design constants and defaults used by
   both the builder (src/kalas/screens/Website.tsx) and the public renderer
   (src/kalas/site/SiteRenderer.tsx + /w/[slug]). The couple's choices persist
   in wedding_sites.config (JSONB); parseConfig() reads that blob into a typed,
   defaulted SiteConfig. `sitePassword` is deliberately NOT part of SiteConfig —
   it never reaches the client. */

import type { CSSProperties } from 'react';
import type { IMAGES } from '../data';

export type ImageKey = keyof typeof IMAGES;

export type ProgramEvent = { id: string; time: string; label: string; sublabel: string };
export type FAQItem = { id: string; q: string; a: string };
export type HotelItem = {
  id: string; name: string; dist: string; price: string;
  url?: string;      // booking link
  code?: string;     // rabatkode ved gruppebooking
  mapQuery?: string; // Google Maps search query
};
export type RsvpSubEvent = { id: string; label: string; sublabel: string };
export type RsvpQuestion = { id: string; label: string };
export type SectionId =
  | 'hero' | 'story' | 'program' | 'rsvp' | 'gallery'
  | 'transport' | 'dresscode' | 'gifts' | 'hotel' | 'faq' | 'photos';
export type SectionMeta = { id: SectionId; label: string; desc: string; enabled: boolean; locked?: boolean };

export type WebColor = { id: string; name: string; bg: string; text: string; accent: string; detail: string };
export type WebFont = { id: string; name: string; pairs: string; style: CSSProperties };

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'os';

export const LENSES = [
  { id: 'editorial',  name: 'The Editorial',  tagline: 'Magasin-grid, store overskrifter, sat i serif.', image: 'invitation' as ImageKey, dark: false },
  { id: 'minimalist', name: 'The Minimalist', tagline: 'Luft, ro og næsten ingenting.',                   image: 'rings'      as ImageKey, dark: false },
  { id: 'organic',    name: 'The Organic',    tagline: 'Jordnær, botanisk og varm fornemmelse.',          image: 'olive'      as ImageKey, dark: false },
  { id: 'garden',     name: 'The Garden',     tagline: 'Lyst orangeri, grønt overalt.',                  image: 'orangeri'   as ImageKey, dark: false },
  { id: 'waterside',  name: 'The Waterside',  tagline: 'Skumring ved vandet, varmt lys.',                image: 'lavender'   as ImageKey, dark: false },
  { id: 'noir',       name: 'Noir',           tagline: 'Mørk, dramatisk og luksuriøs.',                  image: 'candles'    as ImageKey, dark: true  },
  { id: 'botanical',  name: 'Botanical',      tagline: 'Blomster overalt, sommerhave-stemning.',         image: 'florals'    as ImageKey, dark: false },
  { id: 'ceremony',   name: 'The Ceremony',   tagline: 'Højtideligt, naturelt og klassisk.',             image: 'ceremony'   as ImageKey, dark: false },
] as const;

export const WEBSITE_COLORS: WebColor[] = [
  { id: 'oat-forest',  name: 'OAT &\nFOREST',   bg: '#F2EDE4', text: '#2C3826', accent: '#AEB080', detail: '#4A4E3C' },
  { id: 'paper-noir',  name: 'PAPER &\nNOIR',    bg: '#FAFAF8', text: '#1A1A16', accent: '#C8C4B8', detail: '#3D3D38' },
  { id: 'clay-sand',   name: 'CLAY &\nSAND',     bg: '#F0E8DC', text: '#4A2E1A', accent: '#C17B5C', detail: '#6B3E2A' },
  { id: 'garden',      name: 'GARDEN',            bg: '#ECF2E6', text: '#2A3D1E', accent: '#7DAA5A', detail: '#3D5C2A' },
  { id: 'waterside',   name: 'WATERSIDE',         bg: '#E8EFF5', text: '#1E3042', accent: '#7AA4C2', detail: '#2E5C82' },
  { id: 'blush',       name: 'BLUSH',             bg: '#F7EDEB', text: '#3D1E24', accent: '#C28A90', detail: '#6B3A42' },
];

export const FONTS: WebFont[] = [
  { id: 'editorial-serif',  name: 'Editorial Serif',  pairs: 'Cormorant Garamond · Inter',     style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.35rem' } },
  { id: 'klassisk-magasin', name: 'Klassisk Magasin', pairs: 'Playfair Display · Inter',       style: { fontFamily: 'Georgia, serif', fontWeight: '700', fontSize: '1.25rem', letterSpacing: '-0.02em' } },
  { id: 'moderne-kontrast', name: 'Moderne Kontrast', pairs: 'DM Serif Display · Work Sans',  style: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', letterSpacing: '0.01em' } },
  { id: 'stille-og-varm',   name: 'Stille og Varm',   pairs: 'Instrument Serif · Plus Jakarta',style: { fontFamily: 'Georgia, serif', fontWeight: '300', fontSize: '1.3rem', letterSpacing: '0.03em' } },
  { id: 'ren-sans-serif',   name: 'Ren Sans-Serif',   pairs: 'IBM Plex Sans · Inter',          style: { fontFamily: 'system-ui, sans-serif', fontWeight: '300', fontSize: '1.15rem', letterSpacing: '0.06em' } },
];

export const LAYOUTS = [
  { id: 'centered', name: 'Centered', desc: 'Navne midt på, dato over, RSVP under.' },
  { id: 'split',    name: 'Split',    desc: 'Billede på den ene halvdel, tekst på den anden.' },
  { id: 'magazine', name: 'Magazine', desc: 'Stor headline øverst, billede-grid nedenunder.' },
];

export const INIT_SECTIONS: SectionMeta[] = [
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

export const INIT_PROGRAM: ProgramEvent[] = [
  { id: 'e1', time: '14:00', label: 'Vielse',                sublabel: 'Sonnerupgaard Kapel' },
  { id: 'e2', time: '15:30', label: 'Velkomst & champagne',  sublabel: 'Terrassen'           },
  { id: 'e3', time: '18:00', label: 'Middag',                sublabel: 'Den store sal'       },
  { id: 'e4', time: '22:00', label: 'Fest, musik & dans',    sublabel: ''                    },
];

export const INIT_FAQ: FAQItem[] = [
  { id: 'f1', q: 'Hvad er dresscode?',          a: 'Festligt og elegant. Kvinder bedes undgå hvid eller cremefarvet.' },
  { id: 'f2', q: 'Er der parkering på stedet?', a: 'Ja, gratis parkering. Følg skilte fra indkørslen.'               },
  { id: 'f3', q: 'Hvornår er RSVP-deadline?',   a: '1. august 2026.'                                                  },
];

export const INIT_HOTELS: HotelItem[] = [
  { id: 'h1', name: 'Hotel Comwell Roskilde', dist: '8 km fra stedet', price: 'fra 1.200 kr/nat' },
  { id: 'h2', name: 'Airbnb i området',       dist: '2–5 km',          price: 'fra 800 kr/nat'  },
];

export const GALLERY_KEYS: ImageKey[] = ['florals', 'olive', 'candles', 'arch', 'ceremony', 'rings'];

export const findLens = (id: string) => LENSES.find((l) => l.id === id) ?? LENSES[0];
export const findColors = (id: string) => WEBSITE_COLORS.find((c) => c.id === id) ?? WEBSITE_COLORS[0];
export const findFont = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0];

export const MONOGRAM_STYLES = ['initials-dot', 'initials-amp', 'stacked', 'ring'] as const;
export type MonogramStyle = (typeof MONOGRAM_STYLES)[number];

/** Public-safe, fully-defaulted view of wedding_sites.config (no password). */
export interface SiteConfig {
  lensId: string; colorId: string; fontId: string; layoutId: string;
  sections: SectionMeta[];
  heroTagline: string; storyText: string; countdown: boolean;
  program: ProgramEvent[];
  rsvpDeadline: string; rsvpPlusOne: boolean; rsvpMeal: boolean; rsvpDietary: boolean;
  rsvpEvents: RsvpSubEvent[]; rsvpQuestions: RsvpQuestion[]; rsvpChildren: boolean;
  galleryKeys: ImageKey[];
  transport: string; dresscode: string; giftsText: string; giftsUrl: string;
  mapQuery: string; showMap: boolean;
  photoWallOpen: boolean;
  monogram: boolean; monogramStyle: MonogramStyle; monogramImagePath: string;
  faq: FAQItem[]; hotels: HotelItem[];
  pwProtected: boolean; hideBranding: boolean;
}

const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const arr = <T,>(v: unknown, d: T[]) => (Array.isArray(v) ? (v as T[]) : d);

/** Parse a stored config blob into a typed, defaulted SiteConfig. */
export function parseConfig(raw: Record<string, unknown> | null | undefined): SiteConfig {
  const c = raw ?? {};
  return {
    lensId: str(c.lensId, 'editorial'),
    colorId: str(c.colorId, 'oat-forest'),
    fontId: str(c.fontId, 'editorial-serif'),
    layoutId: str(c.layoutId, 'centered'),
    sections: arr<SectionMeta>(c.sections, INIT_SECTIONS),
    heroTagline: str(c.heroTagline, 'Kom og fejr dagen med os'),
    storyText: str(c.storyText, ''),
    countdown: bool(c.countdown, true),
    program: arr<ProgramEvent>(c.program, INIT_PROGRAM),
    rsvpDeadline: str(c.rsvpDeadline, ''),
    rsvpPlusOne: bool(c.rsvpPlusOne, true),
    rsvpMeal: bool(c.rsvpMeal, true),
    rsvpDietary: bool(c.rsvpDietary, true),
    rsvpEvents: arr<RsvpSubEvent>(c.rsvpEvents, []),
    rsvpQuestions: arr<RsvpQuestion>(c.rsvpQuestions, []),
    rsvpChildren: bool(c.rsvpChildren, false),
    galleryKeys: arr<ImageKey>(c.galleryKeys, GALLERY_KEYS.slice(0, 4)),
    transport: str(c.transport, ''),
    dresscode: str(c.dresscode, ''),
    giftsText: str(c.giftsText, ''),
    giftsUrl: str(c.giftsUrl, ''),
    mapQuery: str(c.mapQuery, ''),
    showMap: bool(c.showMap, true),
    photoWallOpen: bool(c.photoWallOpen, false),
    monogram: bool(c.monogram, true),
    monogramStyle: (MONOGRAM_STYLES as readonly string[]).includes(str(c.monogramStyle, ''))
      ? (c.monogramStyle as MonogramStyle) : 'initials-amp',
    monogramImagePath: str(c.monogramImagePath, ''),
    faq: arr<FAQItem>(c.faq, INIT_FAQ),
    hotels: arr<HotelItem>(c.hotels, INIT_HOTELS),
    pwProtected: bool(c.pwProtected, false),
    hideBranding: bool(c.hideBranding, false),
  };
}
