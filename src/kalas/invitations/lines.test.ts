import { describe, it, expect } from 'vitest';
import { bindTail, venueText, joinTight, fitNameSize } from './lines';

const NBSP = ' ';

describe('bindTail', () => {
  it('glues the last word on, so a year cannot be stranded alone', () => {
    expect(bindTail('12. september 2026')).toBe(`12. september${NBSP}2026`);
  });

  it('leaves a single word untouched', () => {
    expect(bindTail('Hvalsø')).toBe('Hvalsø');
    expect(bindTail('')).toBe('');
  });

  it('only binds the final gap, not every space', () => {
    const out = bindTail('Den gamle appelsingård');
    expect(out.split(NBSP)).toHaveLength(2);
    expect(out).toBe(`Den gamle${NBSP}appelsingård`);
  });
});

describe('venueText', () => {
  it('binds the separator to the venue so it cannot start a line', () => {
    expect(venueText('Sonnerupgaard Gods', 'Hvalsø')).toBe(`Sonnerupgaard Gods${NBSP}· Hvalsø`);
  });

  it('drops the separator when there is no detail', () => {
    expect(venueText('Sonnerupgaard Gods')).toBe('Sonnerupgaard Gods');
    expect(venueText('Sonnerupgaard Gods', '')).toBe('Sonnerupgaard Gods');
  });
});

describe('joinTight', () => {
  it('skips empty fragments rather than emitting a lone separator', () => {
    expect(joinTight(['Klokken sytten', undefined])).toBe('Klokken sytten');
    expect(joinTight([undefined, 'Hvalsø'])).toBe('Hvalsø');
    expect(joinTight([])).toBe('');
  });
});

describe('fitNameSize', () => {
  // 50px holds a 7-character name inside the 280px card; longer names must
  // come down or they run off the edge (which Noir Éditorial used to do).
  it('keeps the base size for names that already fit', () => {
    expect(fitNameSize(50, 'Anna', 'Bo', 7)).toBe(50);
    expect(fitNameSize(50, 'Alberte', 'Emil', 7)).toBe(50);
  });

  it('shrinks in proportion to the longest name', () => {
    expect(fitNameSize(50, 'Christoffer', 'Emil', 7)).toBe(32);
    expect(fitNameSize(50, 'Bo', 'Emilie-Katrine', 7)).toBe(25); // 14 chars → half
  });

  it('measures the longer of the two, not the first', () => {
    expect(fitNameSize(50, 'Bo', 'Christoffer', 7)).toBe(fitNameSize(50, 'Christoffer', 'Bo', 7));
  });

  it('ignores surrounding whitespace', () => {
    expect(fitNameSize(50, '  Anna  ', 'Bo', 7)).toBe(50);
  });

  it('never returns a size below 1px', () => {
    expect(fitNameSize(4, 'x'.repeat(200), 'Bo', 7)).toBeGreaterThanOrEqual(1);
  });

  it('handles empty names without dividing by zero', () => {
    expect(fitNameSize(50, '', '', 7)).toBe(50);
  });
});
