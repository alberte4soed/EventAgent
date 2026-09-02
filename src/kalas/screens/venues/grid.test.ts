import { describe, expect, it } from 'vitest';
import { panelSlot } from './grid';

describe('panelSlot', () => {
  it('is closed when nothing is open', () => {
    expect(panelSlot(-1, 3, 9)).toBe(-1);
  });

  it('follows the last card of the opened card\'s row', () => {
    // Three columns: 0,1,2 | 3,4,5 | 6,7,8
    expect(panelSlot(0, 3, 9)).toBe(2);
    expect(panelSlot(1, 3, 9)).toBe(2);
    expect(panelSlot(2, 3, 9)).toBe(2);
    expect(panelSlot(3, 3, 9)).toBe(5);
    expect(panelSlot(8, 3, 9)).toBe(8);
  });

  it('follows each card in one column', () => {
    expect(panelSlot(0, 1, 4)).toBe(0);
    expect(panelSlot(3, 1, 4)).toBe(3);
  });

  it('pairs cards in two columns', () => {
    expect(panelSlot(0, 2, 5)).toBe(1);
    expect(panelSlot(2, 2, 5)).toBe(3);
  });

  /* A row that is not full would otherwise point past the end of the list and
     the panel would never render. */
  it('clamps to the last card when the final row is short', () => {
    expect(panelSlot(6, 3, 7)).toBe(6);
    expect(panelSlot(4, 2, 5)).toBe(4);
  });

  it('survives a nonsense column count', () => {
    expect(panelSlot(2, 0, 5)).toBe(2);
  });

  it('is closed when there is nothing to show', () => {
    expect(panelSlot(0, 3, 0)).toBe(-1);
  });
});
