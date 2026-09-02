/* Where an opened venue's panel goes in the results grid.
 *
 * The grid is `sm:grid-cols-2 xl:grid-cols-3`, and the panel spans every
 * column, so it has to be rendered after the LAST card of the row the opened
 * card sits in — otherwise it splits that row in half. The last row is usually
 * short, hence the clamp. */

/** Index of the card the panel follows, or -1 when nothing is open. */
export function panelSlot(openIndex: number, cols: number, total: number): number {
  if (openIndex < 0 || total === 0) return -1;
  const perRow = Math.max(1, cols);
  const endOfRow = (Math.floor(openIndex / perRow) + 1) * perRow - 1;
  return Math.min(endOfRow, total - 1);
}
