import type { LucideIcon } from 'lucide-react';
import {
  Building2, Church, UtensilsCrossed, Shirt, Mail, Scale, PartyPopper,
  HeartHandshake, CircleDashed, Wallet, Camera, Users, CalendarClock,
} from 'lucide-react';
import { TODAY } from '../../data';
import type { TaskKind, TimelineTaskRow } from '@/lib/db/types';

/* ── Tabs ─────────────────────────────────────────────────────────────── */

export type PlanTab = 'tidslinje' | 'tjekliste';

const PLAN_TAB_KEY = 'kalas_planning_tab';

export function readPlanTab(): PlanTab {
  if (typeof window === 'undefined') return 'tidslinje';
  return sessionStorage.getItem(PLAN_TAB_KEY) === 'tjekliste' ? 'tjekliste' : 'tidslinje';
}

export function writePlanTab(tab: PlanTab) {
  if (typeof window !== 'undefined') sessionStorage.setItem(PLAN_TAB_KEY, tab);
}

/** Marks that one event has been topped up with the newest default items.
 *  Kept client-side on purpose: it must not resurrect items the couple has
 *  deliberately deleted, and it is not worth a column. */
export function topUpKey(eventId: string): string {
  return `kalas_checklist_topup_${eventId}`;
}

/* ── Kind ─────────────────────────────────────────────────────────────── */

/** Never trust the column: a client running ahead of migration 0020 sees
 *  `undefined` here, and everything degrading to 'milestone' is the safe
 *  fallback — it keeps the Tidslinje tab working instead of blanking it. */
export function kindOf(row: Pick<TimelineTaskRow, 'kind'>): TaskKind {
  return row.kind === 'check' ? 'check' : 'milestone';
}

export const isMilestone = (row: Pick<TimelineTaskRow, 'kind'>) => kindOf(row) === 'milestone';
export const isCheck = (row: Pick<TimelineTaskRow, 'kind'>) => kindOf(row) === 'check';

/* ── Checklist areas ──────────────────────────────────────────────────── */

export type ChecklistArea =
  | 'okonomi' | 'venue' | 'ceremoni' | 'mad' | 'stil' | 'foto' | 'papir'
  | 'gaester' | 'jura' | 'optil' | 'dagen' | 'efter' | 'ovrigt';

/** Ids are stable ASCII — they are stored in the DB, so they must never be
 *  Danish labels with æ/ø/å. The label lives here so it stays translatable.
 *  Order is the render order on the Tjekliste tab: roughly the order a couple
 *  meets the work, ending with what happens after the wedding. */
export const CHECKLIST_AREAS: { id: ChecklistArea; label: string; Icon: LucideIcon }[] = [
  { id: 'okonomi', label: 'Økonomi & budget', Icon: Wallet },
  { id: 'venue', label: 'Sted & overnatning', Icon: Building2 },
  { id: 'ceremoni', label: 'Ceremoni & vielse', Icon: Church },
  { id: 'mad', label: 'Mad & drikke', Icon: UtensilsCrossed },
  { id: 'stil', label: 'Tøj & styling', Icon: Shirt },
  { id: 'foto', label: 'Foto & film', Icon: Camera },
  { id: 'papir', label: 'Papir & invitationer', Icon: Mail },
  { id: 'gaester', label: 'Gæster & bordplan', Icon: Users },
  { id: 'jura', label: 'Jura & praktik', Icon: Scale },
  { id: 'optil', label: 'Op til dagen', Icon: CalendarClock },
  { id: 'dagen', label: 'Dagen selv', Icon: PartyPopper },
  { id: 'efter', label: 'Efter brylluppet', Icon: HeartHandshake },
  { id: 'ovrigt', label: 'Øvrigt', Icon: CircleDashed },
];

const AREA_IDS = new Set<string>(CHECKLIST_AREAS.map((a) => a.id));

export function areaOf(row: Pick<TimelineTaskRow, 'category'>): ChecklistArea {
  return row.category && AREA_IDS.has(row.category) ? (row.category as ChecklistArea) : 'ovrigt';
}

export function areaLabel(id: ChecklistArea): string {
  return CHECKLIST_AREAS.find((a) => a.id === id)?.label ?? 'Øvrigt';
}

/* ── Which areas are unfolded ─────────────────────────────────────────── */

const OPEN_AREAS_KEY = 'kalas_checklist_open';

/** Split out from `readOpenAreas` so the parsing is testable without a DOM.
 *  Unknown ids are dropped: a value stored before an area was renamed must
 *  not resurrect a group that no longer exists. */
export function parseOpenAreas(raw: string | null): Set<ChecklistArea> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((id): id is ChecklistArea => typeof id === 'string' && AREA_IDS.has(id)),
    );
  } catch {
    return new Set();
  }
}

export function serializeOpenAreas(open: Set<ChecklistArea>): string {
  return JSON.stringify([...open]);
}

/** Empty means every area is folded away — the deliberate starting point, so
 *  all 12 groups fit on one screen instead of 205 rows. sessionStorage, like
 *  the tab choice: view state, not a preference worth keeping for good. */
export function readOpenAreas(): Set<ChecklistArea> {
  if (typeof window === 'undefined') return new Set();
  try {
    return parseOpenAreas(sessionStorage.getItem(OPEN_AREAS_KEY));
  } catch {
    return new Set();
  }
}

export function writeOpenAreas(open: Set<ChecklistArea>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(OPEN_AREAS_KEY, serializeOpenAreas(open));
  } catch {
    /* private mode or quota — folding just stops being remembered */
  }
}

/** Groups check rows by area, preserving CHECKLIST_AREAS order. Areas with no
 *  rows are dropped, so an untouched 'ovrigt' bucket never renders. */
export function groupByArea<T extends Pick<TimelineTaskRow, 'category' | 'sort' | 'created_at'>>(
  rows: T[],
): { area: ChecklistArea; items: T[] }[] {
  const buckets = new Map<ChecklistArea, T[]>();
  for (const row of rows) {
    const area = areaOf(row);
    const bucket = buckets.get(area);
    if (bucket) bucket.push(row);
    else buckets.set(area, [row]);
  }
  return CHECKLIST_AREAS.flatMap(({ id }) => {
    const items = buckets.get(id);
    if (!items || items.length === 0) return [];
    items.sort((a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at));
    return [{ area: id, items }];
  });
}

/* ── Dates & status ───────────────────────────────────────────────────── */

export function daysDiff(dateISO: string): number {
  return Math.round((new Date(dateISO).getTime() - TODAY.getTime()) / 86400000);
}

export function formatDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-');
  return `${d}.${m}.${y}`;
}

export type Status = 'done' | 'overdue' | 'planned' | 'wedding' | 'undated';

export function statusOf(task: { done: boolean; dateISO: string | null; weddingDay: boolean }): Status {
  if (task.done) return 'done';
  if (task.weddingDay) return 'wedding';
  if (!task.dateISO) return 'undated';
  return daysDiff(task.dateISO) < 0 ? 'overdue' : 'planned';
}

export function statusLabel(
  task: { done: boolean; dateISO: string | null; weddingDay: boolean },
  t: (s: string, params?: Record<string, string | number>) => string,
): string {
  const status = statusOf(task);
  if (status === 'done') return t('Færdig');
  if (status === 'wedding') return t('Dagen');
  if (status === 'overdue') return t('Forsinket');
  if (status === 'undated') return t('Ingen dato');
  const diff = daysDiff(task.dateISO as string);
  if (diff === 0) return t('I dag');
  if (diff > 0 && diff <= 14) return t('Snart');
  return t('Planlagt');
}

/* ── Filters (shared by both tabs) ────────────────────────────────────── */

export type Filter = 'alle' | 'kommende' | 'færdige';

export const FILTER_LABELS: Record<Filter, string> = {
  alle: 'Alle',
  kommende: 'Kommende',
  færdige: 'Færdige',
};

/** Next `sort` value for an append into a given bucket. `sort` is an int, so
 *  there is no fractional insert — the checklist is append-only by design. */
export function nextSort(rows: Pick<TimelineTaskRow, 'sort'>[]): number {
  return rows.reduce((max, r) => Math.max(max, r.sort), -1) + 1;
}
