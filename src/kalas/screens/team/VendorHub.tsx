"use client";

import { useCallback, useMemo, useState } from 'react';
import { useWedding } from '../../useWedding';
import { useLang } from '../../i18n';
import OnboardingHint from '../../OnboardingHint';
import type { NavigateTarget } from '../../lib/hub-nav';
import type { VenueHubView } from '../Venues';
import HubTabBar from './HubTabBar';
import CategoryFilterBar from './CategoryFilterBar';
import ExplorePanel from './ExplorePanel';
import ShortlistPanel from './ShortlistPanel';
import InboxPanel from './InboxPanel';
import BookedPanel from './BookedPanel';
import {
  hubBadges,
  readHubDeepLink,
  resolveDefaultTab,
  type HubCat,
  type HubTab,
} from './shared';

export default function VendorHub({ onNavigate }: { onNavigate?: (s: NavigateTarget) => void }) {
  const { t } = useLang();
  const { venues, outbound, replies, event, loading } = useWedding();

  const deepLink = useMemo(() => readHubDeepLink(), []);

  const [tab, setTab] = useState<HubTab>(() => {
    if (deepLink.tab) return deepLink.tab;
    return resolveDefaultTab(venues, outbound, replies, event?.chosen_venue_id);
  });
  const [cat, setCat] = useState<HubCat>(deepLink.cat ?? 'alle');
  const [query, setQuery] = useState('');
  const [venueView, setVenueView] = useState<VenueHubView>(
    deepLink.tab === 'shortlist' ? 'list' : 'discover',
  );

  const badges = useMemo(
    () => hubBadges(venues, outbound, replies, event?.chosen_venue_id),
    [venues, outbound, replies, event?.chosen_venue_id],
  );

  const onSwitchTab = useCallback((next: HubTab, nextCat?: HubCat) => {
    setTab(next);
    if (nextCat) setCat(nextCat);
    if (next === 'explore') setVenueView('discover');
    if (next === 'shortlist') setVenueView('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const onTabChange = useCallback((next: HubTab) => {
    onSwitchTab(next, cat);
  }, [cat, onSwitchTab]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
      <p className="max-w-xl text-[0.9rem] text-ink-soft">
        {t('Fra opdagelse til henvendelser og booking — ét samlet overblik over jeres bryllupsteam.')}
      </p>

      <CategoryFilterBar
        query={query}
        cat={cat}
        onQueryChange={setQuery}
        onCatChange={setCat}
      />

      <HubTabBar tab={tab} badges={badges} onChange={onTabChange} />

      <div className="mt-8">
        {tab === 'explore' && (
          <ExplorePanel
            cat={cat}
            query={query}
            venueView={venueView}
            onVenueViewChange={setVenueView}
            onNavigate={onNavigate}
            onSwitchTab={onSwitchTab}
          />
        )}
        {tab === 'shortlist' && (
          <ShortlistPanel
            cat={cat}
            query={query}
            venueView={venueView}
            onVenueViewChange={setVenueView}
            onNavigate={onNavigate}
            onSwitchTab={onSwitchTab}
          />
        )}
        {tab === 'inbox' && <InboxPanel onNavigate={onNavigate} />}
        {tab === 'booked' && <BookedPanel onSwitchTab={onSwitchTab} />}
      </div>

      <OnboardingHint id="team" />
    </div>
  );
}
