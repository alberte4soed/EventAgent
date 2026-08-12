import type { VenueRow, VendorCategory } from '@/lib/db/types';

/* "Booked" is expressed two ways in this codebase — a booked_at timestamp, or
   being the event's chosen venue — and the OR is currently repeated inline in
   several screens. Encapsulated here so the review list cannot drift from what
   the vendor hub calls booked. */

type VenueLike = Pick<VenueRow, 'id' | 'booked_at'>;

export function isBooked(venue: VenueLike, chosenVenueId: string | null): boolean {
  return venue.booked_at != null || venue.id === chosenVenueId;
}

/** Every vendor the couple actually engaged, deduplicated. */
export function bookedVendors<T extends VenueLike>(venues: T[], chosenVenueId: string | null): T[] {
  return venues.filter((v) => isBooked(v, chosenVenueId));
}

type Reviewed = Pick<VenueRow, 'own_rating'>;

export function reviewProgress(vendors: Reviewed[]): { done: number; total: number } {
  return { done: vendors.filter((v) => v.own_rating != null).length, total: vendors.length };
}

/** Danish labels for the vendor categories, in the order they read naturally. */
export const CATEGORY_LABELS: Record<VendorCategory, string> = {
  venue: 'Sted',
  caterer: 'Mad & drikke',
  photographer: 'Fotograf',
  florist: 'Blomster',
  musician: 'Musik',
  planner: 'Planlægger',
  accommodation: 'Overnatning',
  other: 'Andet',
};

const ORDER: VendorCategory[] = [
  'venue', 'caterer', 'photographer', 'florist', 'musician', 'planner', 'accommodation', 'other',
];

/** Groups booked vendors by category, in ORDER, dropping empty groups. */
export function groupByCategory<T extends { category: VendorCategory }>(
  vendors: T[]
): { category: VendorCategory; vendors: T[] }[] {
  return ORDER.flatMap((category) => {
    const group = vendors.filter((v) => v.category === category);
    return group.length ? [{ category, vendors: group }] : [];
  });
}
