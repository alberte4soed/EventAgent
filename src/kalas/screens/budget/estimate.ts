/* The opening budget. A couple should not have to fill in a form before the
   screen shows them anything, everything needed is already in the event row,
   so the seven benchmark lines are worked out and saved on arrival, and the
   couple pushes them up and down from there. */

import { budgetLines } from '../../data';

/** kr per guest, Danish average — the fallback when only a headcount is known. */
export const DK_AVG_PER_GUEST = 1850;

/**
 * What we can responsibly guess the wedding costs, from what the couple has
 * already told us. Their own number wins; a headcount is the fallback, rounded
 * to the nearest 10.000 because it is an estimate and shouldn't pretend to be
 * exact. Zero when we know neither — a number with nothing behind it is worse
 * than no number, so the caller shows a prompt instead of seeding.
 */
export function estimatedTotal(budgetTotal: number, guests: number): number {
  if (budgetTotal > 0) return budgetTotal;
  if (guests > 0) return Math.round((guests * DK_AVG_PER_GUEST) / 10000) * 10000;
  return 0;
}

export type EstimatedLine = {
  category: string;
  label: string;
  planned_amount: number;
  icon: string;
  color: string;
  sort: number;
};

/**
 * The benchmark split as rows ready for `saveBudgetItem`. `budgetLines` in
 * data.ts is the single source of the percentages, labels and styling — the
 * old estimator kept a second copy of the same seven lines that had already
 * drifted in ordering.
 */
export function estimatedLines(total: number): EstimatedLine[] {
  return budgetLines.map((line, i) => ({
    category: line.id,
    label: line.label,
    planned_amount: Math.round((total * line.pct) / 100),
    icon: line.icon,
    color: line.color,
    sort: i,
  }));
}

/**
 * What the couple has set aside for the venue itself.
 *
 * The venue search used to seed its budget filter from the WHOLE wedding
 * budget, which is meaningless: a venue costing all 275.000 kr leaves nothing
 * for food, photographer or flowers. What matters is the line they allocated
 * to it — 72.500 kr of that 275.000.
 *
 * Falls back to the benchmark share (`budgetLines`, venue = 33%) when they
 * have not split their budget yet, and to null when there is no budget at
 * all. Never to the total.
 */
export function venueBudget(
  items: { category: string; planned_amount: number }[],
  total: number
): number | null {
  const line = items.find((b) => b.category === "venue");
  if (line && line.planned_amount > 0) return line.planned_amount;
  const pct = budgetLines.find((l) => l.id === "venue")?.pct ?? 0;
  if (total > 0 && pct > 0) return Math.round((total * pct) / 100);
  return null;
}
