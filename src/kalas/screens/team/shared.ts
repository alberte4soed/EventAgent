import type { EmailReplyRow, OutboundEmailRow, VenueRow } from '@/lib/db/types';

export type HubTab = 'explore' | 'shortlist' | 'inbox' | 'booked';

export type HubCat =
  | 'alle'
  | 'venue'
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
  { id: 'shortlist', label: 'Shortlist' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'booked', label: 'Booked' },
];

export const HUB_CATS: { id: HubCat; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'venue', label: 'Venue' },
  { id: 'fotografi', label: 'Foto' },
  { id: 'video', label: 'Video' },
  { id: 'blomster', label: 'Blomster' },
  { id: 'catering', label: 'Catering' },
  { id: 'bar', label: 'Bar & Drinks' },
  { id: 'kage', label: 'Bryllupskage' },
  { id: 'musik', label: 'Musik' },
  { id: 'beauty', label: 'Beauty' },
];

const LEGACY_SCREENS = new Set(['venues', 'vendors', 'inbox']);

export function isLegacyHubScreen(id: string): id is 'venues' | 'vendors' | 'inbox' {
  return LEGACY_SCREENS.has(id);
}

export function readHubDeepLink(): { tab?: HubTab; cat?: HubCat } {
  if (typeof window === 'undefined') return {};
  const tab = sessionStorage.getItem(HUB_TAB_KEY) as HubTab | null;
  const cat = sessionStorage.getItem(HUB_CAT_KEY) as HubCat | null;
  if (tab) sessionStorage.removeItem(HUB_TAB_KEY);
  if (cat) sessionStorage.removeItem(HUB_CAT_KEY);

  // Legacy keys
  const legacyVenuesView = sessionStorage.getItem('kalas_venues_view');
  if (legacyVenuesView === 'picks' || legacyVenuesView === 'list') {
    sessionStorage.removeItem('kalas_venues_view');
    return { tab: 'shortlist', cat: cat ?? 'venue' };
  }
  const legacyVendorCat = sessionStorage.getItem('kalas_vendor_cat') as HubCat | null;
  if (legacyVendorCat) {
    sessionStorage.removeItem('kalas_vendor_cat');
    return { tab: tab ?? 'explore', cat: legacyVendorCat };
  }

  return { tab: tab ?? undefined, cat: cat ?? undefined };
}

export function writeHubDeepLink(tab: HubTab, cat?: HubCat) {
  sessionStorage.setItem(HUB_TAB_KEY, tab);
  if (cat) sessionStorage.setItem(HUB_CAT_KEY, cat);
}

export function legacyScreenToHub(screen: 'venues' | 'vendors' | 'inbox'): { tab: HubTab; cat?: HubCat } {
  switch (screen) {
    case 'venues':
      return { tab: 'explore', cat: 'venue' };
    case 'vendors':
      return { tab: 'explore', cat: 'alle' };
    case 'inbox':
      return { tab: 'inbox' };
  }
}

export function resolveDefaultTab(
  venues: VenueRow[],
  outbound: OutboundEmailRow[],
  replies: EmailReplyRow[],
  eventChosenVenueId: string | null | undefined,
): HubTab {
  const unread = replies.filter((r) => !r.read_at).length;
  if (unread > 0) return 'inbox';

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
  replies: EmailReplyRow[],
  eventChosenVenueId: string | null | undefined,
): Partial<Record<HubTab, number>> {
  const sentIds = new Set(outbound.map((o) => o.venue_id));
  const shortlist = venues.filter((v) => v.swipe_status === 'liked' && !sentIds.has(v.id)).length;
  const unread = replies.filter((r) => !r.read_at).length;
  const booked = venues.filter((v) => v.booked_at || v.id === eventChosenVenueId).length;
  return {
    shortlist: shortlist || undefined,
    inbox: unread || undefined,
    booked: booked || undefined,
  };
}

export function matchesHubCat(row: VenueRow, cat: HubCat): boolean {
  if (cat === 'alle') return true;
  if (cat === 'venue') return row.category === 'venue';
  const map: Partial<Record<HubCat, string>> = {
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
