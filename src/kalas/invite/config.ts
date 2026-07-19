/* The online-invitation content contract. The couple's invitation persists in
   invitations.config (JSONB); parseInviteConfig() is the trust boundary that
   reads that untrusted blob into a typed, fully-defaulted, public-safe
   InviteConfig. Only whitelisted enum tokens and sliced plain text ever reach
   the renderer (theme.tsx / PublicInvite.tsx) — every field is rendered
   strictly as React text, never as markup. Mirrors src/kalas/site/config.ts +
   design.ts. */

import {
  PALETTE_IDS, FONT_IDS, ALIGNMENTS, COMPOSITIONS, SHAPES, FRAMES, presetById,
  type PaletteId, type FontId, type Alignment, type Composition, type Shape, type Frame, type ProgramRow,
} from './theme-data';

export interface InviteEnvelope {
  enabled: boolean;
  /** Monogram / initials shown on the wax seal, e.g. "C & E". */
  monogram: string;
  /** Line above the names on the closed envelope, e.g. "A Love Letter From". */
  note: string;
}

export interface InviteConfig {
  // Look / template
  presetId: string | null;
  paletteId: PaletteId;
  fontId: FontId;
  alignment: Alignment;
  composition: Composition;
  shape: Shape;
  frame: Frame;
  photoOnCard: boolean;
  // Content
  eyebrow: string;
  names: string;
  dateLabel: string;
  /** ISO date (YYYY-MM-DD) that drives the live countdown. */
  dateISO: string;
  venue: string;
  message: string;
  closing: string;
  /** Storage path of the couple photo in the invite-designs bucket ('' = none). */
  photoPath: string;
  // Sections
  envelope: InviteEnvelope;
  countdown: boolean;
  program: ProgramRow[];
  showProgram: boolean;
  // RSVP
  rsvpEnabled: boolean;
  rsvpDeadline: string;
  rsvpPlusOne: boolean;
  rsvpMeal: boolean;
  rsvpDietary: boolean;
  hideBranding: boolean;
}

const str = (v: unknown, d: string, max = 400): string =>
  typeof v === 'string' ? v.slice(0, max) : d;
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], d: T): T =>
  (allowed as readonly unknown[]).includes(v) ? (v as T) : d;

/** Storage paths are `{uuid}/{uuid}/hero-{uuid}.png` — safe charset only. */
const photoRef = (v: unknown): string =>
  typeof v === 'string' && /^[a-z0-9/_.-]{1,200}$/i.test(v) ? v : '';

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = (v: unknown, d: string): string =>
  typeof v === 'string' && ISO_RE.test(v.trim()) ? v.trim() : d;

function parseProgram(v: unknown, d: ProgramRow[]): ProgramRow[] {
  if (!Array.isArray(v)) return d;
  const out: ProgramRow[] = [];
  for (const r of v) {
    if (typeof r !== 'object' || r === null) continue;
    const o = r as Record<string, unknown>;
    out.push({ time: str(o.time, '', 20), label: str(o.label, '', 80) });
    if (out.length >= 12) break;
  }
  return out.length > 0 ? out : d;
}

export const DEFAULT_INVITE: InviteConfig = {
  presetId: null,
  paletteId: 'olive-burgundy',
  fontId: 'marcellus',
  alignment: 'center',
  composition: 'centered',
  shape: 'arched',
  frame: 'line',
  photoOnCard: false,
  eyebrow: 'Vi skal giftes',
  names: '',
  dateLabel: '',
  dateISO: '',
  venue: '',
  message: '',
  closing: 'og vi ville elske at fejre dagen med jer',
  photoPath: '',
  envelope: { enabled: true, monogram: '', note: 'A Love Letter From' },
  countdown: true,
  program: [],
  showProgram: true,
  rsvpEnabled: true,
  rsvpDeadline: '',
  rsvpPlusOne: true,
  rsvpMeal: true,
  rsvpDietary: true,
  hideBranding: false,
};

/** Parse a stored config blob into a typed, defaulted, public-safe InviteConfig. */
export function parseInviteConfig(raw: Record<string, unknown> | null | undefined): InviteConfig {
  const c = raw ?? {};
  const D = DEFAULT_INVITE;
  const env = (c.envelope ?? {}) as Record<string, unknown>;

  // A valid preset seeds palette/font/etc. defaults so stored look stays coherent.
  const preset = presetById(typeof c.presetId === 'string' ? c.presetId : null);
  const look = preset
    ? { paletteId: preset.pal as PaletteId, fontId: preset.font as FontId, alignment: preset.align, composition: preset.comp, shape: preset.shape, frame: preset.frame, photoOnCard: Boolean(preset.photo) }
    : { paletteId: D.paletteId, fontId: D.fontId, alignment: D.alignment, composition: D.composition, shape: D.shape, frame: D.frame, photoOnCard: D.photoOnCard };

  return {
    presetId: preset ? preset.id : null,
    paletteId: oneOf(c.paletteId, PALETTE_IDS, look.paletteId),
    fontId: oneOf(c.fontId, FONT_IDS, look.fontId),
    alignment: oneOf(c.alignment, ALIGNMENTS, look.alignment),
    composition: oneOf(c.composition, COMPOSITIONS, look.composition),
    shape: oneOf(c.shape, SHAPES, look.shape),
    frame: oneOf(c.frame, FRAMES, look.frame),
    photoOnCard: bool(c.photoOnCard, look.photoOnCard),
    eyebrow: str(c.eyebrow, D.eyebrow, 120),
    names: str(c.names, D.names, 120),
    dateLabel: str(c.dateLabel, D.dateLabel, 120),
    dateISO: isoDate(c.dateISO, D.dateISO),
    venue: str(c.venue, D.venue, 160),
    message: str(c.message, D.message, 1200),
    closing: str(c.closing, D.closing, 400),
    photoPath: photoRef(c.photoPath),
    envelope: {
      enabled: bool(env.enabled, D.envelope.enabled),
      monogram: str(env.monogram, D.envelope.monogram, 24),
      note: str(env.note, D.envelope.note, 80),
    },
    countdown: bool(c.countdown, D.countdown),
    program: parseProgram(c.program, D.program),
    showProgram: bool(c.showProgram, D.showProgram),
    rsvpEnabled: bool(c.rsvpEnabled, D.rsvpEnabled),
    rsvpDeadline: str(c.rsvpDeadline, D.rsvpDeadline, 120),
    rsvpPlusOne: bool(c.rsvpPlusOne, D.rsvpPlusOne),
    rsvpMeal: bool(c.rsvpMeal, D.rsvpMeal),
    rsvpDietary: bool(c.rsvpDietary, D.rsvpDietary),
    hideBranding: bool(c.hideBranding, D.hideBranding),
  };
}
