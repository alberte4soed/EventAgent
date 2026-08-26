import { describe, it, expect } from 'vitest';
import { budgetLines } from '../../data';
import { estimatedTotal, estimatedLines, DK_AVG_PER_GUEST } from './estimate';

describe('estimatedTotal', () => {
  it('uses the couple’s own number when they gave one', () => {
    expect(estimatedTotal(250000, 80)).toBe(250000);
  });

  it('falls back to the headcount, rounded to the nearest 10.000', () => {
    // 80 × 1850 = 148.000 → 150.000
    expect(estimatedTotal(0, 80)).toBe(150000);
    expect(estimatedTotal(0, 1)).toBe(0); // 1850 rounds down to nothing
    expect(estimatedTotal(0, 50)).toBe(90000); // 92.500 → 90.000
  });

  it('is zero when we know neither, so nothing gets seeded', () => {
    expect(estimatedTotal(0, 0)).toBe(0);
  });

  it('keeps the per-guest average in one place', () => {
    expect(estimatedTotal(0, 100)).toBe(Math.round((100 * DK_AVG_PER_GUEST) / 10000) * 10000);
  });
});

describe('estimatedLines', () => {
  it('returns one row per benchmark line, in order', () => {
    const lines = estimatedLines(200000);
    expect(lines).toHaveLength(budgetLines.length);
    expect(lines.map((l) => l.category)).toEqual(budgetLines.map((b) => b.id));
    expect(lines.map((l) => l.sort)).toEqual(budgetLines.map((_, i) => i));
  });

  it('splits the whole total, give or take rounding', () => {
    const total = 250000;
    const sum = estimatedLines(total).reduce((n, l) => n + l.planned_amount, 0);
    expect(Math.abs(sum - total)).toBeLessThanOrEqual(budgetLines.length);
  });

  it('carries the styling, so a seeded line does not look like Ava added it', () => {
    // Rows saved without icon/color fall back to a generic sparkle in Budget.tsx.
    for (const line of estimatedLines(100000)) {
      expect(line.icon).toBeTruthy();
      expect(line.color).toMatch(/^#/);
    }
  });

  it('is all zeroes at a zero total rather than throwing', () => {
    expect(estimatedLines(0).every((l) => l.planned_amount === 0)).toBe(true);
  });
});

describe('budgetLines', () => {
  it('adds up to a whole budget', () => {
    expect(budgetLines.reduce((n, b) => n + b.pct, 0)).toBe(100);
  });
});
