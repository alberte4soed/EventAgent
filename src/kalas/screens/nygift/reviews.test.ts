import { describe, it, expect } from 'vitest';
import { isBooked, bookedVendors, reviewProgress, groupByCategory, CATEGORY_LABELS } from './reviews';
import type { VendorCategory } from '@/lib/db/types';

const v = (id: string, booked_at: string | null = null) => ({ id, booked_at });

describe('isBooked', () => {
  it('counts a booked_at timestamp', () => {
    expect(isBooked(v('a', '2026-09-12T00:00:00Z'), null)).toBe(true);
  });

  it('counts the chosen venue even with no timestamp', () => {
    expect(isBooked(v('a'), 'a')).toBe(true);
  });

  it('is false for a vendor that is neither', () => {
    expect(isBooked(v('a'), 'b')).toBe(false);
  });
});

describe('bookedVendors', () => {
  it('returns only booked vendors', () => {
    const list = [v('a', '2026-09-12T00:00:00Z'), v('b'), v('c')];
    expect(bookedVendors(list, 'c').map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('does not double-count a vendor that is both booked and the chosen venue', () => {
    const list = [v('a', '2026-09-12T00:00:00Z')];
    expect(bookedVendors(list, 'a')).toHaveLength(1);
  });

  it('handles a null chosen venue', () => {
    expect(bookedVendors([v('a'), v('b')], null)).toEqual([]);
  });
});

describe('reviewProgress', () => {
  it('counts rated vendors', () => {
    expect(reviewProgress([{ own_rating: 5 }, { own_rating: null }, { own_rating: 3 }]))
      .toEqual({ done: 2, total: 3 });
  });

  it('treats a zero rating as absent, since the scale starts at 1', () => {
    expect(reviewProgress([{ own_rating: null }])).toEqual({ done: 0, total: 1 });
  });

  it('handles an empty list', () => {
    expect(reviewProgress([])).toEqual({ done: 0, total: 0 });
  });
});

describe('groupByCategory', () => {
  const c = (id: string, category: VendorCategory) => ({ id, category });

  it('orders groups consistently and drops empty ones', () => {
    const groups = groupByCategory([c('1', 'musician'), c('2', 'venue'), c('3', 'photographer')]);
    expect(groups.map((g) => g.category)).toEqual(['venue', 'photographer', 'musician']);
  });

  it('keeps several vendors in one category together', () => {
    const groups = groupByCategory([c('1', 'florist'), c('2', 'florist')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].vendors).toHaveLength(2);
  });

  it('has a Danish label for every category it can emit', () => {
    for (const { category } of groupByCategory(
      (Object.keys(CATEGORY_LABELS) as VendorCategory[]).map((cat, i) => c(String(i), cat))
    )) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    }
  });
});
