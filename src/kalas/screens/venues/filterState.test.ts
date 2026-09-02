import { describe, it, expect } from 'vitest';
import { triOf, cycleTri, toggleRequired, activeFilters, clearAll } from './filterState';
import type { VenueFilters } from '@/lib/venue/filter';

const base: VenueFilters = { min_capacity: 70, catering: 'any', accommodation: 'any', settings: [], require: [] };
const labels = {
  budget: 'Højst', catering: 'Catering i huset', accommodation: 'Overnatning',
  ceremony: 'Vielse på stedet', outdoor: 'Have eller terrasse', wheelchair: 'Kørestolsvenlig',
  parking: 'Parkering', children: 'Børnevenligt', dogs: 'Hunde tilladt',
  'setting-castle': 'Slot',
};

describe('the three states', () => {
  it('cycles off → ønsket → krav → off', () => {
    let f = base;
    expect(triOf(f, 'ceremony')).toBe('off');
    f = cycleTri(f, 'ceremony');
    expect(triOf(f, 'ceremony')).toBe('wanted');
    expect(f.ceremony).toBe('on_site');
    expect(f.require).not.toContain('ceremony');
    f = cycleTri(f, 'ceremony');
    expect(triOf(f, 'ceremony')).toBe('required');
    expect(f.require).toContain('ceremony');
    f = cycleTri(f, 'ceremony');
    expect(triOf(f, 'ceremony')).toBe('off');
    expect(f.ceremony).toBe('any');
    // Turning it off must not leave a stale requirement behind.
    expect(f.require).not.toContain('ceremony');
  });

  it('works the same for the Google booleans', () => {
    let f = cycleTri(base, 'wheelchair');
    expect(f.wheelchair).toBe(true);
    expect(triOf(f, 'wheelchair')).toBe('wanted');
    f = cycleTri(f, 'wheelchair');
    expect(triOf(f, 'wheelchair')).toBe('required');
    f = cycleTri(f, 'wheelchair');
    expect(f.wheelchair).toBe(false);
    expect(triOf(f, 'wheelchair')).toBe('off');
  });

  it('treats either accommodation choice as on', () => {
    expect(triOf({ ...base, accommodation: 'on_site' }, 'accommodation')).toBe('wanted');
    expect(triOf({ ...base, accommodation: 'on_site_or_nearby' }, 'accommodation')).toBe('wanted');
    expect(triOf({ ...base, accommodation: 'any' }, 'accommodation')).toBe('off');
  });

  it('reads slider- and list-backed rules from their own values', () => {
    expect(triOf({ ...base, budget_max: 100_000 }, 'budget')).toBe('wanted');
    expect(triOf({ ...base, budget_max: 100_000, require: ['budget'] }, 'budget')).toBe('required');
    expect(triOf({ ...base, settings: ['castle'] }, 'setting')).toBe('wanted');
    expect(triOf({ ...base, min_rating: 4.5 }, 'rating')).toBe('wanted');
    expect(triOf(base, 'budget')).toBe('off');
  });
});

describe('toggleRequired', () => {
  it('adds and removes a single rule', () => {
    const on = toggleRequired({ ...base, budget_max: 100_000 }, 'budget');
    expect(on.require).toEqual(['budget']);
    expect(toggleRequired(on, 'budget').require).toEqual([]);
  });
});

describe('activeFilters, the row under the bar', () => {
  it('is empty when nothing narrows the list', () => {
    expect(activeFilters(base, labels)).toEqual([]);
  });

  it('lists each active filter once, marking the hard ones', () => {
    const f: VenueFilters = { ...base, catering: 'in_house', wheelchair: true, require: ['wheelchair'] };
    const list = activeFilters(f, labels);
    expect(list.map((x) => x.id).sort()).toEqual(['catering', 'wheelchair']);
    expect(list.find((x) => x.id === 'catering')!.required).toBe(false);
    expect(list.find((x) => x.id === 'wheelchair')!.required).toBe(true);
  });

  it('removes exactly one filter, leaving the others alone', () => {
    const f: VenueFilters = { ...base, catering: 'in_house', ceremony: 'on_site', require: ['ceremony'] };
    const list = activeFilters(f, labels);
    const next = list.find((x) => x.id === 'ceremony')!.remove(f);
    expect(next.ceremony).toBe('any');
    expect(next.require).not.toContain('ceremony');
    expect(next.catering).toBe('in_house');
  });

  it('gives every chosen style its own chip', () => {
    const f: VenueFilters = { ...base, settings: ['castle'] };
    const list = activeFilters(f, labels);
    expect(list.map((x) => x.label)).toContain('Slot');
    // Removing the last style drops the requirement with it.
    const next = list[0].remove({ ...f, require: ['setting'] });
    expect(next.settings).toEqual([]);
    expect(next.require).not.toContain('setting');
  });

  it('shows the budget with its amount', () => {
    const list = activeFilters({ ...base, budget_max: 150_000 }, labels);
    expect(list[0].label).toContain('150.000');
  });
});

describe('clearAll', () => {
  it('wipes the filters but keeps the guest count', () => {
    const f: VenueFilters = {
      ...base, min_capacity: 90, budget_max: 200_000, catering: 'in_house',
      ceremony: 'on_site', wheelchair: true, settings: ['castle'], min_rating: 4.5,
      require: ['ceremony', 'wheelchair'],
    };
    const c = clearAll(f);
    // The guest count belongs to the wedding, not to the filter panel.
    expect(c.min_capacity).toBe(90);
    expect(activeFilters(c, labels)).toEqual([]);
    expect(c.require).toEqual([]);
  });
});
