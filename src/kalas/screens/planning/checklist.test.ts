import { describe, it, expect } from 'vitest';
import { timeline as MOCK_TIMELINE } from '../../data';
import { DEFAULT_CHECKLIST, defaultChecklist } from './checklist-data';
import { CHECKLIST_AREAS, kindOf, areaOf, groupByArea, nextSort, statusOf } from './shared';

const AREA_IDS = new Set(CHECKLIST_AREAS.map((a) => a.id));

describe('DEFAULT_CHECKLIST', () => {
  it('holds a usable number of items', () => {
    expect(DEFAULT_CHECKLIST.length).toBeGreaterThanOrEqual(100);
    expect(DEFAULT_CHECKLIST.length).toBeLessThanOrEqual(160);
  });

  it('covers every area with a meaningful block', () => {
    for (const { id } of CHECKLIST_AREAS) {
      const n = DEFAULT_CHECKLIST.filter((c) => c.area === id).length;
      // 'ovrigt' is the catch-all for user/Ava additions — seeded empty.
      if (id === 'ovrigt') expect(n).toBe(0);
      else expect(n, `area "${id}" has only ${n} items`).toBeGreaterThanOrEqual(7);
    }
  });

  it('has no duplicate titles', () => {
    const titles = DEFAULT_CHECKLIST.map((c) => c.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('never restates a milestone title', () => {
    // Duplicate Danish keys are a TS1117 build error in strings.ts, and the
    // two layers must stay conceptually disjoint.
    const milestones = new Set(MOCK_TIMELINE.map((t) => t.title));
    for (const item of DEFAULT_CHECKLIST) {
      expect(milestones.has(item.title), `"${item.title}" collides with a milestone`).toBe(false);
    }
  });

  it('only uses known areas', () => {
    for (const item of DEFAULT_CHECKLIST) expect(AREA_IDS.has(item.area)).toBe(true);
  });

  it('seeds dateless check rows with contiguous sort values', () => {
    const seeded = defaultChecklist();
    expect(seeded).toHaveLength(DEFAULT_CHECKLIST.length);
    seeded.forEach((row, i) => {
      expect(row.kind).toBe('check');
      expect(row.due_date).toBeNull();
      expect(row.done).toBe(false);
      expect(row.sort).toBe(i);
    });
  });
});

describe('kindOf', () => {
  it('treats anything that is not "check" as a milestone', () => {
    // A client running ahead of migration 0020 sees undefined here.
    expect(kindOf({ kind: 'check' })).toBe('check');
    expect(kindOf({ kind: 'milestone' })).toBe('milestone');
    expect(kindOf({ kind: null })).toBe('milestone');
    expect(kindOf({ kind: undefined })).toBe('milestone');
  });
});

describe('areaOf', () => {
  it('maps known categories and falls back to ovrigt', () => {
    expect(areaOf({ category: 'mad' })).toBe('mad');
    expect(areaOf({ category: 'wedding_day' })).toBe('ovrigt');
    expect(areaOf({ category: null })).toBe('ovrigt');
  });
});

describe('groupByArea', () => {
  const row = (category: string | null, sort: number, created_at = '2026-01-01') =>
    ({ category, sort, created_at });

  it('orders groups by CHECKLIST_AREAS and drops empty ones', () => {
    const groups = groupByArea([row('dagen', 0), row('venue', 0), row('mad', 0)]);
    expect(groups.map((g) => g.area)).toEqual(['venue', 'mad', 'dagen']);
  });

  it('sorts within a group by sort, then created_at', () => {
    const groups = groupByArea([
      row('venue', 2), row('venue', 0, '2026-02-01'), row('venue', 0, '2026-01-01'),
    ]);
    expect(groups[0].items.map((i) => [i.sort, i.created_at])).toEqual([
      [0, '2026-01-01'], [0, '2026-02-01'], [2, '2026-01-01'],
    ]);
  });

  it('collects unknown categories into ovrigt', () => {
    const groups = groupByArea([row('noget-ukendt', 0), row(null, 1)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].area).toBe('ovrigt');
    expect(groups[0].items).toHaveLength(2);
  });
});

describe('nextSort', () => {
  it('appends after the highest existing sort', () => {
    expect(nextSort([])).toBe(0);
    expect(nextSort([{ sort: 0 }, { sort: 4 }, { sort: 2 }])).toBe(5);
  });
});

describe('statusOf', () => {
  it('reports undated instead of pinning a task to the wedding day', () => {
    expect(statusOf({ done: false, dateISO: null, weddingDay: false })).toBe('undated');
    expect(statusOf({ done: true, dateISO: null, weddingDay: false })).toBe('done');
    expect(statusOf({ done: false, dateISO: '2000-01-01', weddingDay: false })).toBe('overdue');
    expect(statusOf({ done: false, dateISO: '2000-01-01', weddingDay: true })).toBe('wedding');
  });
});
