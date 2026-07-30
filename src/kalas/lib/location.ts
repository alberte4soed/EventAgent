import type { EventRow, VenueRow } from '@/lib/db/types';

/**
 * The couple's location drives all vendor discovery. It comes from one of two
 * places: what they set by hand (event.location — the top-right chip on the
 * venue explore page), or the area of the venue they chose. Vendors on every
 * non-venue page are searched near this string.
 */

/** Reduce a formatted street address to a searchable "City, Country" area. */
export function venueArea(address: string | null | undefined): string {
  if (!address) return '';
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return address.trim();
  // Drop the street line, strip leading postcodes, keep the last 1–2 segments.
  const rest = parts
    .slice(1)
    .map((p) => p.replace(/^\d[\d\s-]*/, '').trim())
    .filter(Boolean);
  if (rest.length === 0) return parts[parts.length - 1];
  return (rest.length > 2 ? rest.slice(-2) : rest).join(', ');
}

/** The venue the couple has locked in (chosen pointer first, then any booked). */
export function chosenVenue(
  event: EventRow | null,
  venues: VenueRow[],
): VenueRow | null {
  const byId = event?.chosen_venue_id
    ? venues.find((v) => v.id === event.chosen_venue_id)
    : null;
  return byId ?? venues.find((v) => v.category === 'venue' && v.booked_at) ?? null;
}

/** Area derived from the chosen venue, or '' when none is chosen. */
export function chosenVenueArea(event: EventRow | null, venues: VenueRow[]): string {
  const v = chosenVenue(event, venues);
  return v ? venueArea(v.address) : '';
}

/**
 * The effective search location: the couple's own location if set, otherwise
 * the chosen venue's area. Empty only before either is known.
 */
export function effectiveLocation(event: EventRow | null, venues: VenueRow[]): string {
  const manual = (event?.location ?? '').trim();
  if (manual) return manual;
  return chosenVenueArea(event, venues);
}
