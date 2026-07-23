/* Pure, server-safe registry metadata for all 20 templates. Imported by both
   the client registry (templates.tsx) and the AI route (which must not import
   React components). Order within a group = gallery order. */

import type { TemplateMeta } from './types';

export const TEMPLATE_META: TemplateMeta[] = [
  // ── Klassisk & forseglet ────────────────────────────────────────────────
  { id: 'sceau',        name: 'Sceau',        subtitle: 'Klassisk luksus',    group: 'sealed',    voice: 'formal',   dateStyle: 'longformal', interactive: 'tap-open',  monogram: true,  fields: ['label', 'introLines', 'venueDetail', 'rsvpLabel'] },
  { id: 'ivoire',       name: 'Ivoire',       subtitle: 'Letterpress',        group: 'sealed',    voice: 'formal',   dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'bleu-poudre',  name: 'Bleu Poudré',  subtitle: 'Klassisk, rolig',    group: 'sealed',    voice: 'formal',   dateStyle: 'longformal', interactive: null,        monogram: true,  fields: ['label', 'time', 'venueDetail'] },
  { id: 'lettre',       name: 'Lettre',       subtitle: 'Oliven & burgundy',  group: 'sealed',    voice: 'romantic', dateStyle: 'numeric',    interactive: 'tap-open',  monogram: true,  fields: ['label', 'introLines', 'venueDetail', 'rsvpLabel'] },
  { id: 'cachet',       name: 'Cachet',       subtitle: 'Vokssegl',           group: 'sealed',    voice: 'formal',   dateStyle: 'longformal', interactive: null,        monogram: true,  fields: ['label', 'venueDetail'] },

  // ── Moderne & minimal ───────────────────────────────────────────────────
  { id: 'noir-editorial', name: 'Noir Éditorial', subtitle: 'Minimalisme',    group: 'modern',    voice: 'modern',   dateStyle: 'numeric',    interactive: null,        monogram: false, fields: ['label', 'venueDetail', 'rsvpLabel'] },
  { id: 'bauhaus',      name: 'Bauhaus',      subtitle: 'Moderne, grafisk',   group: 'modern',    voice: 'modern',   dateStyle: 'numeric',    interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'parisienne',   name: 'Parisienne',   subtitle: 'Chic, editorial',    group: 'modern',    voice: 'romantic', dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'introLines', 'venueDetail'] },
  { id: 'linea',        name: 'Linea',        subtitle: 'Ren linje',          group: 'modern',    voice: 'modern',   dateStyle: 'numeric',    interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'atelier',      name: 'Atelier',      subtitle: 'Editorial serif',    group: 'modern',    voice: 'modern',   dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },

  // ── Botanisk & blomster ─────────────────────────────────────────────────
  { id: 'jardin',       name: 'Jardin',       subtitle: 'Botanisk',           group: 'botanical', voice: 'romantic', dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'introLines', 'time', 'venueDetail'] },
  { id: 'prairie',      name: 'Prairie',      subtitle: 'Vilde blomster',     group: 'botanical', voice: 'romantic', dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'gravure',      name: 'Gravure',      subtitle: 'Vintage ætsning',    group: 'botanical', voice: 'formal',   dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'toile',        name: 'Toile',        subtitle: 'Fransk mønster',     group: 'botanical', voice: 'formal',   dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'eucalyptus',   name: 'Eucalyptus',   subtitle: 'Sølvgrønt',          group: 'botanical', voice: 'romantic', dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },

  // ── Farve & sol ─────────────────────────────────────────────────────────
  { id: 'terracotta',   name: 'Terracotta',   subtitle: 'Toscana, varm',      group: 'color',     voice: 'romantic', dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'aquarelle',    name: 'Aquarelle',    subtitle: 'Blush akvarel',      group: 'color',     voice: 'romantic', dateStyle: 'numeric',    interactive: null,        monogram: false, fields: ['label', 'introLines', 'venueDetail'] },
  { id: 'amalfi',       name: 'Amalfi',       subtitle: 'Riviera, citron',    group: 'color',     voice: 'playful',  dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'corail',       name: 'Corail',       subtitle: 'Koral & sol',        group: 'color',     voice: 'romantic', dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'provence',     name: 'Provence',     subtitle: 'Lavendel',           group: 'color',     voice: 'romantic', dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },

  // ── Dramatisk & metallisk ───────────────────────────────────────────────
  { id: 'minuit',       name: 'Minuit',       subtitle: 'Dramatisk',          group: 'dramatic',  voice: 'romantic', dateStyle: 'numeric',    interactive: 'countdown', monogram: true,  fields: ['label', 'time', 'rsvpLabel'] },
  { id: 'celeste',      name: 'Céleste',      subtitle: 'Stjernehimmel',      group: 'dramatic',  voice: 'romantic', dateStyle: 'numeric',    interactive: 'countdown', monogram: false, fields: ['label', 'time'] },
  { id: 'deco',         name: 'Déco',         subtitle: 'Art déco, guld',     group: 'dramatic',  voice: 'formal',   dateStyle: 'roman',      interactive: 'tap-open',  monogram: true,  fields: ['label', 'time', 'venueDetail'] },
  { id: 'emeraude',     name: 'Émeraude',     subtitle: 'Smaragd & guld',     group: 'dramatic',  voice: 'formal',   dateStyle: 'longformal', interactive: null,        monogram: false, fields: ['label', 'venueDetail'] },
  { id: 'champagne',    name: 'Champagne',    subtitle: 'Guldfolie',          group: 'dramatic',  voice: 'formal',   dateStyle: 'longformal', interactive: null,        monogram: true,  fields: ['label', 'venueDetail'] },
  { id: 'marbre',       name: 'Marbre',       subtitle: 'Marmor & guld',      group: 'dramatic',  voice: 'formal',   dateStyle: 'longformal', interactive: null,        monogram: true,  fields: ['label', 'venueDetail'] },
];

export function getTemplateMeta(id: string): TemplateMeta | undefined {
  return TEMPLATE_META.find((t) => t.id === id);
}
