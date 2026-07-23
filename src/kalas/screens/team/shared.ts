import type { EmailReplyRow, OutboundEmailRow, VenueRow } from '@/lib/db/types';

export type HubTab = 'explore' | 'shortlist' | 'booked';

export type HubCat =
  | 'venue'
  | 'overnatning'
  | 'fotografi'
  | 'video'
  | 'blomster'
  | 'catering'
  | 'bar'
  | 'kage'
  | 'musik'
  | 'beauty';

export const HUB_TAB_KEY = 'kalas_hub_tab';
export const HUB_CAT_KEY = 'kalas_hub_cat';

export const HUB_TABS: { id: HubTab; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'shortlist', label: 'Favoritter' },
  { id: 'booked', label: 'Booked' },
];

export const HUB_CATS: { id: HubCat; label: string }[] = [
  { id: 'venue', label: 'Venue' },
  { id: 'overnatning', label: 'Overnatning' },
  { id: 'fotografi', label: 'Foto' },
  { id: 'video', label: 'Video' },
  { id: 'blomster', label: 'Blomster' },
  { id: 'catering', label: 'Catering' },
  { id: 'bar', label: 'Bar & Drinks' },
  { id: 'kage', label: 'Bryllupskage' },
  { id: 'musik', label: 'Musik' },
  { id: 'beauty', label: 'Beauty' },
];

/** Explore-tab header copy per category (Danish keys → `t()`). */
export const EXPLORE_HEADERS: Record<HubCat, { title: string; body: string }> = {
  venue: {
    title: 'Byg jeres liste af venues',
    body: 'Drej på kloden og vælg et land, eller skriv selv et sted — Ava researcher rigtige venues, som I kan gå på opdagelse i nedenfor.',
  },
  overnatning: {
    title: 'Find overnatning til gæsterne',
    body: 'Ava finder hoteller og overnatningssteder nær jeres lokation, som gæsterne kan booke — gem dem I vil anbefale.',
  },
  fotografi: {
    title: 'Byg jeres liste af fotografer',
    body: 'Gennemse fotografer Ava har fundet — gem dem I kan lide, så kan hun kontakte dem for jer.',
  },
  video: {
    title: 'Byg jeres liste af videografer',
    body: 'Gennemse videografer Ava har fundet — gem dem I kan lide, så kan hun kontakte dem for jer.',
  },
  blomster: {
    title: 'Byg jeres liste af florister',
    body: 'Gennemse florister Ava har fundet — gem dem I kan lide, så kan hun kontakte dem for jer.',
  },
  catering: {
    title: 'Byg jeres liste af catering',
    body: 'Gennemse catering Ava har fundet — gem dem I kan lide, så kan hun kontakte dem for jer.',
  },
  bar: {
    title: 'Byg jeres liste af bar & drinks',
    body: 'Gennemse bar- og drinksleverandører Ava har fundet — gem dem I kan lide, så kan hun kontakte dem for jer.',
  },
  kage: {
    title: 'Byg jeres liste af bryllupskager',
    body: 'Gennemse kagebagerier Ava har fundet — gem dem I kan lide, så kan hun kontakte dem for jer.',
  },
  musik: {
    title: 'Byg jeres liste af musikere',
    body: 'Gennemse DJ\'s, bands og musikere Ava har fundet — gem dem I kan lide, så kan hun kontakte dem for jer.',
  },
  beauty: {
    title: 'Byg jeres liste af beauty',
    body: 'Gennemse makeup- og hårstylister Ava har fundet — gem dem I kan lide, så kan hun kontakte dem for jer.',
  },
};

const HUB_CAT_IDS = new Set<string>(HUB_CATS.map((c) => c.id));

export function isHubCat(value: string | null | undefined): value is HubCat {
  return Boolean(value && HUB_CAT_IDS.has(value));
}

const LEGACY_SCREENS = new Set(['venues', 'vendors']);

export function isLegacyHubScreen(id: string): id is 'venues' | 'vendors' {
  return LEGACY_SCREENS.has(id);
}

export function readHubDeepLink(): { tab?: HubTab; cat?: HubCat } {
  if (typeof window === 'undefined') return {};
  const rawTab = sessionStorage.getItem(HUB_TAB_KEY);
  const rawCat = sessionStorage.getItem(HUB_CAT_KEY);
  if (rawTab) sessionStorage.removeItem(HUB_TAB_KEY);
  if (rawCat) sessionStorage.removeItem(HUB_CAT_KEY);

  // Inbox left the hub — ignore stale deep-links.
  const tab = (rawTab === 'explore' || rawTab === 'shortlist' || rawTab === 'booked')
    ? rawTab
    : undefined;
  const cat = isHubCat(rawCat) ? rawCat : undefined;

  // Legacy keys
  const legacyVenuesView = sessionStorage.getItem('kalas_venues_view');
  if (legacyVenuesView === 'picks' || legacyVenuesView === 'list') {
    sessionStorage.removeItem('kalas_venues_view');
    return { tab: 'shortlist', cat: cat ?? 'venue' };
  }
  const legacyVendorCat = sessionStorage.getItem('kalas_vendor_cat');
  if (legacyVendorCat) {
    sessionStorage.removeItem('kalas_vendor_cat');
    return { tab: tab ?? 'explore', cat: isHubCat(legacyVendorCat) ? legacyVendorCat : 'fotografi' };
  }

  return { tab, cat };
}

export function writeHubDeepLink(tab: HubTab, cat?: HubCat) {
  sessionStorage.setItem(HUB_TAB_KEY, tab);
  if (cat) sessionStorage.setItem(HUB_CAT_KEY, cat);
}

export function legacyScreenToHub(screen: 'venues' | 'vendors'): { tab: HubTab; cat?: HubCat } {
  switch (screen) {
    case 'venues':
      return { tab: 'explore', cat: 'venue' };
    case 'vendors':
      return { tab: 'explore', cat: 'fotografi' };
  }
}

export function resolveDefaultTab(
  venues: VenueRow[],
  outbound: OutboundEmailRow[],
  _replies: EmailReplyRow[],
  eventChosenVenueId: string | null | undefined,
): HubTab {
  const sentIds = new Set(outbound.map((o) => o.venue_id));
  const likedNotContacted = venues.some((v) => v.swipe_status === 'liked' && !sentIds.has(v.id));
  const contactedUnbooked = venues.some(
    (v) => sentIds.has(v.id) && !v.booked_at && v.id !== eventChosenVenueId,
  );
  if (likedNotContacted || contactedUnbooked) return 'shortlist';

  const bookedCount = venues.filter((v) => v.booked_at || v.id === eventChosenVenueId).length;
  if (bookedCount > 0) return 'booked';

  return 'explore';
}

export function hubBadges(
  venues: VenueRow[],
  outbound: OutboundEmailRow[],
  _replies: EmailReplyRow[],
  eventChosenVenueId: string | null | undefined,
): Partial<Record<HubTab, number>> {
  const sentIds = new Set(outbound.map((o) => o.venue_id));
  const shortlist = venues.filter((v) => v.swipe_status === 'liked' && !sentIds.has(v.id)).length;
  const booked = venues.filter((v) => v.booked_at || v.id === eventChosenVenueId).length;
  return {
    shortlist: shortlist || undefined,
    booked: booked || undefined,
  };
}

/**
 * Vendor categories (everything except venue) stay locked until the couple has
 * locked in a location from the shortlist — i.e. a venue is chosen/booked.
 * Venue is always first; the venue category itself is never locked. Locked =
 * browse allowed, but the expensive actions (Ava outreach, research) are gated.
 */
export function venueLockedIn(venues: VenueRow[], chosenVenueId: string | null | undefined): boolean {
  if (chosenVenueId) return true;
  return venues.some((v) => Boolean(v.booked_at));
}

export function catLocked(cat: HubCat, venues: VenueRow[], chosenVenueId: string | null | undefined): boolean {
  // Venue is always first — never locked.
  if (cat === 'venue') return false;
  return !venueLockedIn(venues, chosenVenueId);
}

export function matchesHubCat(row: VenueRow, cat: HubCat): boolean {
  if (cat === 'venue') return row.category === 'venue';
  const map: Partial<Record<HubCat, string>> = {
    overnatning: 'accommodation',
    fotografi: 'photographer',
    blomster: 'florist',
    catering: 'caterer',
    musik: 'musician',
  };
  const backend = map[cat];
  if (backend) return row.category === backend;
  if (cat === 'video') return row.category === 'photographer';
  return row.category !== 'venue';
}

export function matchesHubSearch(row: VenueRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.name.toLowerCase().includes(q)
    || (row.address ?? '').toLowerCase().includes(q)
    || (row.description ?? '').toLowerCase().includes(q)
    || row.category.toLowerCase().includes(q)
  );
}
