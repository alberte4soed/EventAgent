/* Shared registry maths. Three surfaces render the same gifts — the couple's
   screen, the token site renderer and the AI site's portal grid, and they
   used to each sort and count their own way. Pure, so it can be imported from
   both src/kalas and src/app without dragging any client state along. */

export type SortableGift = {
  favourite?: boolean | null;
  sort: number;
  created_at: string;
};

/** Favourites ("ønskes mest") first, then the couple's own order, then oldest
 *  first so a tie never reshuffles between renders. `favourite` is optional:
 *  a client running ahead of migration 0022 sees undefined, which reads as
 *  "not starred" — the safe fallback. */
export function sortGifts<T extends SortableGift>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const fav = Number(Boolean(b.favourite)) - Number(Boolean(a.favourite));
    if (fav !== 0) return fav;
    if (a.sort !== b.sort) return a.sort - b.sort;
    return a.created_at.localeCompare(b.created_at);
  });
}

/** How many of an item guests have taken. Sums `quantity` rather than counting
 *  rows: a claim may cover more than one, and the two disagree the moment it
 *  does. */
export function claimedCount(claims: { quantity?: number | null }[]): number {
  return claims.reduce((n, c) => n + (c.quantity ?? 1), 0);
}

/** Danish thousands separator, no decimals — gift prices are whole kroner in
 *  practice, and "1.299 DKK" reads better than "1299,00". Null in, null out,
 *  so the caller can leave the price out entirely. */
export function formatPrice(priceCents: number | null | undefined, currency: string): string | null {
  if (priceCents == null || !Number.isFinite(priceCents)) return null;
  const amount = priceCents / 100;
  const rounded = Number.isInteger(amount) ? amount : Math.round(amount * 100) / 100;
  return `${rounded.toLocaleString('da-DK')} ${currency}`;
}
