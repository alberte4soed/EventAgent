'use client';

/* The typed template registry: pairs each metadata entry (templates.meta.ts)
   with its React component. Import TEMPLATES for the gallery/editor; the AI
   route imports only templates.meta.ts (no React). */

import './templates.css';
import type { Template, TemplateGroup } from './types';
import { TEMPLATE_META } from './templates.meta';
import { GROUP_LABELS, GROUP_ORDER } from './types';
import { Sceau, Ivoire, BleuPoudre, Lettre, Cachet } from './components/sealed';
import { NoirEditorial, Bauhaus, Parisienne, Linea, Atelier } from './components/modern';
import { Jardin, Prairie, Gravure, Toile, Eucalyptus } from './components/botanical';
import { Terracotta, Aquarelle, Amalfi, Corail, Provence } from './components/color';
import { Minuit, Celeste, Deco, Emeraude, Champagne, Marbre } from './components/dramatic';

const COMPONENTS: Record<string, Template['Component']> = {
  sceau: Sceau,
  ivoire: Ivoire,
  'bleu-poudre': BleuPoudre,
  lettre: Lettre,
  cachet: Cachet,
  'noir-editorial': NoirEditorial,
  bauhaus: Bauhaus,
  parisienne: Parisienne,
  linea: Linea,
  atelier: Atelier,
  jardin: Jardin,
  prairie: Prairie,
  gravure: Gravure,
  toile: Toile,
  eucalyptus: Eucalyptus,
  terracotta: Terracotta,
  aquarelle: Aquarelle,
  amalfi: Amalfi,
  corail: Corail,
  provence: Provence,
  minuit: Minuit,
  celeste: Celeste,
  deco: Deco,
  emeraude: Emeraude,
  champagne: Champagne,
  marbre: Marbre,
};

export const TEMPLATES: Template[] = TEMPLATE_META.map((meta) => {
  const Component = COMPONENTS[meta.id];
  if (!Component) throw new Error(`No component registered for template "${meta.id}"`);
  return { ...meta, Component };
});

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** Templates grouped by mood, in gallery order, with Danish section headers. */
export function templatesByGroup(): { group: TemplateGroup; label: string; templates: Template[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    templates: TEMPLATES.filter((t) => t.group === group),
  }));
}

export { GROUP_LABELS, GROUP_ORDER } from './types';
