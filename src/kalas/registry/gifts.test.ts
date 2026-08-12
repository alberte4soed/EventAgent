import { describe, it, expect } from 'vitest';
import { sortGifts, claimedCount, formatPrice } from './gifts';

const gift = (sort: number, favourite?: boolean | null, created_at = '2026-01-01') =>
  ({ sort, favourite, created_at, id: `${sort}-${favourite}-${created_at}` });

describe('sortGifts', () => {
  it('puts favourites first, then the couple’s own order', () => {
    const sorted = sortGifts([gift(0), gift(1, true), gift(2), gift(3, true)]);
    expect(sorted.map((g) => g.sort)).toEqual([1, 3, 0, 2]);
  });

  it('breaks a tie on created_at so the order never flickers', () => {
    const sorted = sortGifts([gift(0, false, '2026-03-01'), gift(0, false, '2026-02-01')]);
    expect(sorted.map((g) => g.created_at)).toEqual(['2026-02-01', '2026-03-01']);
  });

  it('treats a missing favourite as not starred', () => {
    // A client running ahead of migration 0022 sees undefined here.
    const sorted = sortGifts([gift(1, undefined), gift(2, true), gift(0, null)]);
    expect(sorted.map((g) => g.sort)).toEqual([2, 0, 1]);
  });

  it('does not mutate the input', () => {
    const input = [gift(2), gift(1, true)];
    const before = input.map((g) => g.sort);
    sortGifts(input);
    expect(input.map((g) => g.sort)).toEqual(before);
  });
});

describe('claimedCount', () => {
  it('sums quantity rather than counting rows', () => {
    expect(claimedCount([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
  });

  it('treats a missing quantity as one', () => {
    expect(claimedCount([{ quantity: null }, {}, { quantity: 2 }])).toBe(4);
  });

  it('is zero for no claims', () => {
    expect(claimedCount([])).toBe(0);
  });
});

describe('formatPrice', () => {
  it('formats whole kroner with a Danish thousands separator', () => {
    expect(formatPrice(129900, 'DKK')).toBe('1.299 DKK');
    expect(formatPrice(69900, 'DKK')).toBe('699 DKK');
  });

  it('keeps the currency it is given', () => {
    expect(formatPrice(2500, 'EUR')).toBe('25 EUR');
  });

  it('returns null when there is no price, so the caller can omit it', () => {
    expect(formatPrice(null, 'DKK')).toBeNull();
    expect(formatPrice(undefined, 'DKK')).toBeNull();
    expect(formatPrice(Number.NaN, 'DKK')).toBeNull();
  });

  it('keeps øre when the price actually has them', () => {
    expect(formatPrice(69950, 'DKK')).toBe('699,5 DKK');
  });
});
