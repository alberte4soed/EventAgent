/* Ava's conversational walkthrough — the script.
 *
 * Replaces the old spotlight tour: instead of coach-marks with Next/Back, Ava
 * narrates each page in the chat, pulls it up on the stage, and offers real
 * prompts the couple can try. The prompts are sent to the agent verbatim, so
 * they genuinely execute — a venue search really lands venues on the board.
 *
 * Copy is Danish source with {named} placeholders, resolved through the same
 * t(source, params) i18n as the rest of the app (see i18n.tsx / strings.ts).
 */

import type { ScreenId } from './Shell';

/** localStorage key holding the current step index — also the "armed" marker. */
export const WALKTHROUGH_KEY = 'kalas_walkthrough';

export type WalkthroughStep = {
  id: string;
  /** Stage navigates here when the step opens. */
  page: ScreenId | null;
  /** Ava's line. */
  message: string;
  /** "Try asking me…" prompts — sent to the agent for real. */
  tries?: string[];
  /** Prompts that only make sense once every placeholder resolved. */
  needs?: ReadonlyArray<keyof WalkthroughParams>;
  /** Renders the chat-vs-classic choice instead of chips. */
  final?: boolean;
};

export type WalkthroughParams = {
  city: string;
  guests: number;
  foodBudget: string;
  dateHint: string;
};

export const WALKTHROUGH_STEPS: readonly WalkthroughStep[] = [
  {
    id: 'intro',
    page: 'home',
    message:
      'Så er I inde — velkommen! Lad mig vise jer rundt. Det korte af det lange: I behøver ikke lede efter knapper. Skriv til mig her, så åbner jeg den rigtige side og laver arbejdet.',
  },
  {
    id: 'vendors',
    page: 'team',
    message:
      'Det her er leverandører. Her udforsker I steder og folk, gemmer favoritter på jeres shortlist, og ser hvem I har booket. Prøv at bede mig om noget — jeg søger på nettet og lægger rigtige steder på tavlen.',
    tries: ['Find et bryllupssted i {city} til {guests} gæster'],
    needs: ['city', 'guests'],
  },
  {
    id: 'budget',
    page: 'budget',
    message:
      'Budgettet. Jeg fordeler det på kategorier og siger til, før I rammer loftet. I kan trække i det selv — eller bare bede mig om at ændre det.',
    tries: ['Sæt budgettet for mad og drikke til {foodBudget} kr'],
    needs: ['foodBudget'],
  },
  {
    id: 'guests',
    page: 'guests',
    message:
      'Gæstelisten. Importér fra CSV eller tilføj dem enkeltvis — jeg holder styr på svar, plus-ens og kostbehov undervejs. I kan også bare spørge mig om status.',
    tries: ['Hvem mangler at svare på invitationen?'],
  },
  {
    id: 'planning',
    page: 'planning',
    message:
      'Tidslinjen lægger jeg baglæns fra jeres dato, så I altid ved hvad der haster. Spørg mig endelig.',
    tries: ['Hvad bør vi have på plads inden {dateHint}?'],
    needs: ['dateHint'],
  },
  {
    id: 'inbox',
    page: 'inbox',
    message:
      'Og her lander svarene. Når jeg har skrevet til et sted, samler jeg tråden, trækker prisen ud af mailen og lægger et forslag til svar klar — I skal bare godkende.',
  },
  {
    id: 'rest',
    page: 'home',
    message:
      'Der er mere når I når dertil: jeres bryllupsside, invitationer, ønskeliste, bordplan og bryllupsrejse. Bed mig om at åbne en af dem, når I er klar.',
  },
  {
    id: 'choose',
    page: null,
    message:
      'Det var rundturen. Hvordan vil I helst arbejde? I kan altid skifte oppe i hjørnet.',
    final: true,
  },
] as const;

/** Fills {placeholders} that resolved; a step whose needs are unmet drops its tries. */
export function stepTries(
  step: WalkthroughStep,
  params: Partial<WalkthroughParams>,
): string[] {
  if (!step.tries) return [];
  const unmet = (step.needs ?? []).some((k) => params[k] === undefined || params[k] === '');
  return unmet ? [] : step.tries;
}
