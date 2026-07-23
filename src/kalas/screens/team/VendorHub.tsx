"use client";

import { useCallback, useMemo, useState } from 'react';
import { useWedding } from '../../useWedding';
import { useLang } from '../../i18n';
import OnboardingHint from '../../OnboardingHint';
import type { NavigateTarget } from '../../lib/hub-nav';
import type { VenueHubView } from '../Venues';
import HubTabBar from './HubTabBar';
import ExplorePanel from './ExplorePanel';
import ShortlistPanel from './ShortlistPanel';
import BookedPanel from './BookedPanel';
import {
  hubBadges,
  readHubDeepLink,
  resolveDefaultTab,
  venueLockedIn,
  type HubCat,
  type HubTab,
} from './shared';

export default function VendorHub({ onNavigate }: { onNavigate?: (s: NavigateTarget) => void }) {
  const { venues, outbound, replies, event, loading } = useWedding();
  const { t } = useLang();

  const deepLink = useMemo(() => readHubDeepLink(), []);

  const [tab, setTab] = useState<HubTab>(() => {
    if (deepLink.tab) return deepLink.tab;
    return resolveDefaultTab(venues, outbound, replies, event?.chosen_venue_id);
  });
  const [cat, setCat] = useState<HubCat>(deepLink.cat ?? 'alle');
  const [venueView, setVenueView] = useState<VenueHubView>(
    deepLink.tab === 'shortlist' ? 'list' : 'discover',
  );

  const badges = useMemo(
    () => hubBadges(venues, outbound, replies, event?.chosen_venue_id),
    [venues, outbound, replies, event?.chosen_venue_id],
  );

  // Non-venue categories stay locked until a venue is locked in from the shortlist.
  const vendorsLocked = useMemo(
    () => !venueLockedIn(venues, event?.chosen_venue_id),
    [venues, event?.chosen_venue_id],
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
    <div className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-8 sm:px-9 lg:px-12">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9079]">{t('Planlægning')}</p>
        <h1 className="mt-1 font-serif text-[clamp(2rem,4vw,2.4rem)] leading-[1.1] tracking-[-0.02em] text-[#314523]">
          {t('Venue & leverandører')}
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-[#6c7561]">
          {t('Find jeres venue og leverandører, gem favoritter, og hold styr på hvem I har booket.')}
        </p>
      </div>

      <HubTabBar tab={tab} badges={badges} onChange={onTabChange} />

      {/* The category filter now lives under each panel's own header
          (ExplorePanel → Discover/Suppliers, ShortlistPanel → "Trin 2"). */}
      <div>
        {tab === 'explore' && (
          <ExplorePanel
            cat={cat}
            onCatChange={setCat}
            query=""
            venueView={venueView}
            onVenueViewChange={setVenueView}
            onNavigate={onNavigate}
            onSwitchTab={onSwitchTab}
            vendorsLocked={vendorsLocked}
          />
        )}
        {tab === 'shortlist' && (
          <ShortlistPanel
            cat={cat}
            onCatChange={setCat}
            query=""
            venueView={venueView}
            onVenueViewChange={setVenueView}
            onNavigate={onNavigate}
            onSwitchTab={onSwitchTab}
            vendorsLocked={vendorsLocked}
          />
        )}
        {tab === 'booked' && <BookedPanel onSwitchTab={onSwitchTab} />}
      </div>

      <OnboardingHint id="team" />
    </div>
  );
}
