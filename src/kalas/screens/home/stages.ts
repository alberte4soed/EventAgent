import type { JourneyStage, JourneyStageKey } from '@/lib/journey';
import type { ScreenId } from '../../Shell';

/** Where each journey stage's CTA lands inside the SPA. */
export const STAGE_SCREEN: Record<JourneyStageKey, ScreenId> = {
  basics: 'ava',
  venue: 'venues',
  vendors: 'vendors',
  invites: 'invites',
};

/* Danish stage copy for the dashboard. journey.ts stays English — the agent's
   system prompt and its tests read those labels — so the UI translates here. */
export const DA_STAGES: Record<JourneyStageKey, { label: string; hint: string; lockedHint: string }> = {
  basics: {
    label: 'Det grundlæggende',
    hint: 'Sted og cirka antal gæster låser venue-jagten op',
    lockedHint: '',
  },
  venue: {
    label: 'Find jeres venue',
    hint: 'Alt det lokale udspringer af, hvor I siger ja',
    lockedHint: 'Låses op, når det grundlæggende er på plads',
  },
  vendors: {
    label: 'Book leverandørerne',
    hint: 'Blomster, foto, musik og mad — tæt på jeres venue',
    lockedHint: 'Låses op, når I har valgt venue',
  },
  invites: {
    label: 'Send invitationerne',
    hint: 'Design, formulér og bestil jeres invitationer',
    lockedHint: 'Låses op, når venue og dato er på plads',
  },
};

type Translate = (s: string, params?: Record<string, string | number>) => string;

/** Stage hint with live progress facts where we have them. */
export function daStageHint(
  stage: JourneyStage,
  counts: { liked: number; quotes: number },
  t: Translate
): string {
  if (stage.status === 'locked') return t(DA_STAGES[stage.key].lockedHint);
  if (stage.key === 'venue') {
    if (counts.quotes > 0) return t('{n} tilbud er inde — sammenlign og vælg', { n: counts.quotes });
    if (counts.liked > 0) return t('{n} venues på jeres shortliste', { n: counts.liked });
  }
  return t(DA_STAGES[stage.key].hint);
}

export const kr = (n: number) => new Intl.NumberFormat('da-DK').format(Math.round(n));
