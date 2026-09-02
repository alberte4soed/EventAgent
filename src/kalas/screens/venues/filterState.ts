/* The vocabulary the filter drawer and the active-filter chips share.
 *
 * A chip has three states rather than two: off → ønsket → krav. That replaces
 * a separate "Skal opfyldes" group of six switches that sat at the bottom of
 * the panel controlling filters defined above it — no shopping app has such a
 * thing, and nobody could tell which switch belonged to which filter.
 *
 * Why "ønsket" exists at all, when a shop would just filter: we only know, for
 * example, whether a venue holds ceremonies for about 43% of them. Filtering
 * hard on that would hide half the good places for lacking data rather than
 * for failing the test. "Ønsket" sorts them up; "krav" hides the ones we know
 * fail — never the ones we simply do not know about.
 */

import type { SoftRule, VenueFilters } from '@/lib/venue/filter';

export type TriState = 'off' | 'wanted' | 'required';

/** The chips that cycle through three states, and how each maps onto filters. */
export type ChipRule = Extract<
  SoftRule,
  'catering' | 'accommodation' | 'ceremony' | 'outdoor' | 'wheelchair' | 'parking' | 'children' | 'dogs'
>;

/** Is this rule switched on at all, ignoring whether it is a hard requirement? */
function isOn(filters: VenueFilters, rule: ChipRule): boolean {
  switch (rule) {
    case 'catering': return filters.catering === 'in_house';
    case 'accommodation': return filters.accommodation === 'on_site' || filters.accommodation === 'on_site_or_nearby';
    case 'ceremony': return filters.ceremony === 'on_site';
    case 'outdoor': return filters.outdoor === 'required';
    default: return Boolean(filters[rule]);
  }
}

function setOn(filters: VenueFilters, rule: ChipRule, on: boolean): VenueFilters {
  switch (rule) {
    case 'catering': return { ...filters, catering: on ? 'in_house' : 'any' };
    case 'accommodation': return { ...filters, accommodation: on ? 'on_site_or_nearby' : 'any' };
    case 'ceremony': return { ...filters, ceremony: on ? 'on_site' : 'any' };
    case 'outdoor': return { ...filters, outdoor: on ? 'required' : 'any' };
    default: return { ...filters, [rule]: on };
  }
}

export function triOf(filters: VenueFilters, rule: SoftRule): TriState {
  const required = filters.require?.includes(rule) ?? false;
  const on = rule === 'budget' ? filters.budget_max != null
    : rule === 'setting' ? (filters.settings?.length ?? 0) > 0
    : rule === 'rating' ? filters.min_rating != null
    : isOn(filters, rule as ChipRule);
  if (!on) return 'off';
  return required ? 'required' : 'wanted';
}

/** Off → ønsket → krav → off. One control, three answers. */
export function cycleTri(filters: VenueFilters, rule: ChipRule): VenueFilters {
  const state = triOf(filters, rule);
  const require = (filters.require ?? []).filter((r) => r !== rule);
  if (state === 'off') return { ...setOn(filters, rule, true), require };
  if (state === 'wanted') return { ...setOn(filters, rule, true), require: [...require, rule] };
  return { ...setOn(filters, rule, false), require };
}

/** Turn a requirement on or off for rules whose "on" is a slider or a list. */
export function toggleRequired(filters: VenueFilters, rule: SoftRule): VenueFilters {
  const require = filters.require ?? [];
  return require.includes(rule)
    ? { ...filters, require: require.filter((r) => r !== rule) }
    : { ...filters, require: [...require, rule] };
}

export interface ActiveFilter {
  id: string;
  label: string;
  required: boolean;
  /** Returns the filters with just this one removed. */
  remove: (f: VenueFilters) => VenueFilters;
}

/**
 * Everything currently narrowing the list, as removable chips.
 *
 * This is what makes a closed drawer honest: without it the couple has no way
 * to see that four filters are still on, or to drop one without reopening the
 * whole panel.
 */
export function activeFilters(filters: VenueFilters, labels: Record<string, string>): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  const push = (id: string, rule: SoftRule, label: string, remove: (f: VenueFilters) => VenueFilters) => {
    const state = triOf(filters, rule);
    if (state === 'off') return;
    out.push({ id, label, required: state === 'required', remove });
  };

  const clearRule = (rule: SoftRule, apply: (f: VenueFilters) => VenueFilters) => (f: VenueFilters) => ({
    ...apply(f),
    require: (f.require ?? []).filter((r) => r !== rule),
  });

  if (filters.budget_max != null) {
    push('budget', 'budget', `${labels.budget} ${filters.budget_max.toLocaleString('da-DK')} kr.`,
      clearRule('budget', (f) => ({ ...f, budget_max: null })));
  }
  for (const rule of ['catering', 'accommodation', 'ceremony', 'outdoor', 'wheelchair', 'parking', 'children', 'dogs'] as ChipRule[]) {
    push(rule, rule, labels[rule] ?? rule, clearRule(rule, (f) => setOn(f, rule, false)));
  }
  for (const s of filters.settings ?? []) {
    out.push({
      id: `setting-${s}`,
      label: labels[`setting-${s}`] ?? s,
      required: (filters.require ?? []).includes('setting'),
      remove: (f) => {
        const settings = (f.settings ?? []).filter((x) => x !== s);
        return {
          ...f,
          settings,
          require: settings.length === 0 ? (f.require ?? []).filter((r) => r !== 'setting') : f.require,
        };
      },
    });
  }
  if (filters.min_rating != null) {
    push('rating', 'rating', `${String(filters.min_rating).replace('.', ',')}+`,
      clearRule('rating', (f) => ({ ...f, min_rating: null })));
  }
  return out;
}

/** Filters the couple set, keeping the guest count — that belongs to the wedding. */
export function clearAll(filters: VenueFilters): VenueFilters {
  return {
    min_capacity: filters.min_capacity,
    budget_max: null,
    catering: 'any',
    accommodation: 'any',
    settings: [],
    require: [],
    ceremony: 'any',
    outdoor: 'any',
    wheelchair: false,
    parking: false,
    children: false,
    dogs: false,
    min_rating: null,
    max_distance_km: null,
  };
}
