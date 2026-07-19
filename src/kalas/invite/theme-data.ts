/* Pure invitation LOOK data — no React/motion imports, so it is safe to use
   from server routes and the config trust boundary as well as client screens.
   The card components + font loader live in ./theme (client). */

/* ─── Palettes ─────────────────────────────────────────────────────────── */
export const PALETTES = [
  { id: 'champagne',      name: 'Champagne',     bg: '#faf6ef', soft: '#ede5d4', accent: '#b89650', ink: '#1c1814' },
  { id: 'ivory-gold',     name: 'Ivory & Gold',  bg: '#fdfaf5', soft: '#f4e8cc', accent: '#c9a227', ink: '#1a1814' },
  { id: 'black-tie',      name: 'Black Tie',     bg: '#fafafa', soft: '#e8e6e0', accent: '#c9a227', ink: '#0e0e0c' },
  { id: 'greige',         name: 'Greige',        bg: '#f2ece4', soft: '#ddd5c8', accent: '#8a7a68', ink: '#2c2820' },
  { id: 'mono',           name: 'Mono',          bg: '#fafaf8', soft: '#e0e0dc', accent: '#6e6e68', ink: '#141414' },
  { id: 'slate',          name: 'Slate',         bg: '#eef2f6', soft: '#c8d4e4', accent: '#4a6480', ink: '#1a2434' },
  { id: 'blush',          name: 'Blush',         bg: '#fdf2f0', soft: '#f4cecc', accent: '#c06058', ink: '#280a08' },
  { id: 'lavender',       name: 'Lavender',      bg: '#f6f2fc', soft: '#e0d4f4', accent: '#7040b0', ink: '#28103e' },
  /* Inspiration-matched editorial palettes */
  { id: 'olive-burgundy', name: 'Oliven & Burgundy', bg: '#f3f0e4', soft: '#dfe0c8', accent: '#6b2d38', ink: '#3a4128' },
  { id: 'ivory-brown',    name: 'Ivory & Brun',  bg: '#f6f1e7', soft: '#e8dfce', accent: '#8a6a4a', ink: '#3f2f24' },
  /* Kalas-brand extras */
  { id: 'botanisk',       name: 'Botanisk',      bg: '#e8edd8', soft: '#d4e0c0', accent: '#6a7e5a', ink: '#2e3325' },
  { id: 'forest',         name: 'Dyb Skov',      bg: '#3a4f37', soft: '#2e3d2c', accent: '#d4c89a', ink: '#f3f1e6' },
  { id: 'rose',           name: 'Rose & Skov',   bg: '#faf3ee', soft: '#f0e0d4', accent: '#a87e72', ink: '#3a4f37' },
  { id: 'midnight',       name: 'Midnight',      bg: '#1a1a2e', soft: '#252540', accent: '#c9a227', ink: '#f2f2f0' },
] as const;
export type PaletteId = typeof PALETTES[number]['id'];
export const PALETTE_IDS = PALETTES.map((p) => p.id) as readonly PaletteId[];

/* ─── Font pairings ────────────────────────────────────────────────────── */
/* `cq` = headline size in cqw (percent of card width) so text always fits. */
export const FONTS = [
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
export type FontId = typeof FONTS[number]['id'];
export const FONT_IDS = FONTS.map((f) => f.id) as readonly FontId[];

export type Alignment = 'center' | 'left';
export type Composition = 'centered' | 'top' | 'spread';
export const ALIGNMENTS: readonly Alignment[] = ['center', 'left'];
export const COMPOSITIONS: readonly Composition[] = ['centered', 'top', 'spread'];

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];
export const fontById = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0];
/** Wax-seal colour for a palette — its accent reads as sealing wax. */
export const sealColor = (id: string) => paletteById(id).accent;

/* ─── Curated templates — one tap applies the whole look ───────────────── */
export interface InvitePreset {
  id: string; name: string; desc: string;
  pal: PaletteId; font: FontId;
  align: Alignment; comp: Composition;
}

export const PRESETS: InvitePreset[] = [
  { id: 'olivenlund', name: 'Olivenlund', desc: 'Oliven & burgundy, editorial',  pal: 'olive-burgundy', font: 'marcellus',  align: 'center', comp: 'centered' },
  { id: 'ivory-brun', name: 'Ivory & Brun', desc: 'Elfenben & varm brun',        pal: 'ivory-brown',    font: 'eb-garamond', align: 'center', comp: 'centered' },
  { id: 'botanisk',   name: 'Botanisk',   desc: 'Grønt, roligt, jeres stil',     pal: 'botanisk',       font: 'cormorant',  align: 'center', comp: 'centered' },
  { id: 'editorial',  name: 'Editorial',  desc: 'Sort/hvid, skarpt, moderne',    pal: 'black-tie',      font: 'italiana',   align: 'center', comp: 'centered' },
  { id: 'romantisk',  name: 'Romantisk',  desc: 'Blush, script, blødt',          pal: 'blush',          font: 'pinyon',     align: 'center', comp: 'centered' },
  { id: 'klassisk',   name: 'Klassisk',   desc: 'Champagne og guld',             pal: 'ivory-gold',     font: 'playfair',   align: 'left',   comp: 'top' },
  { id: 'noir',       name: 'Noir',       desc: 'Mørk, festlig, dramatisk',      pal: 'midnight',       font: 'bodoni',     align: 'center', comp: 'spread' },
];
export const presetById = (id: string | null) => PRESETS.find((p) => p.id === id) ?? null;

/* ─── Program rows shown on the card back / public invite ──────────────── */
export interface ProgramRow { time: string; label: string }
export const DEFAULT_PROGRAM: ProgramRow[] = [
  { time: '14:00', label: 'Vielse' },
  { time: '15:30', label: 'Velkomst' },
  { time: '18:00', label: 'Middag' },
  { time: '22:00', label: 'Fest & dans' },
];
