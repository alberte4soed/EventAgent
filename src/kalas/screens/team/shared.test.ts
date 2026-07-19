import { describe, expect, it } from 'vitest';
import { venueLockedIn, catLocked } from './shared';
import type { VenueRow } from '@/lib/db/types';

const venue = (over: Partial<VenueRow>): VenueRow => ({
  id: 'v1', category: 'venue', booked_at: null, ...over,
} as VenueRow);

describe('venueLockedIn', () => {
  it('false when no venue is chosen or booked', () => {
    expect(venueLockedIn([venue({})], null)).toBe(false);
    expect(venueLockedIn([], null)).toBe(false);
  });

  it('true when a venue is chosen (event.chosen_venue_id)', () => {
    expect(venueLockedIn([venue({})], 'v1')).toBe(true);
  });

  it('true when any venue has booked_at', () => {
    expect(venueLockedIn([venue({ booked_at: '2026-01-01' })], null)).toBe(true);
  });
});

describe('catLocked', () => {
  it('never locks the venue or "alle" category', () => {
    expect(catLocked('venue', [venue({})], null)).toBe(false);
    expect(catLocked('alle', [venue({})], null)).toBe(false);
  });

  it('locks vendor categories until a venue is locked in', () => {
    expect(catLocked('fotografi', [venue({})], null)).toBe(true);
    expect(catLocked('fotografi', [venue({})], 'v1')).toBe(false);
    expect(catLocked('catering', [venue({ booked_at: '2026-01-01' })], null)).toBe(false);
  });
});
