"use client";

import VenueDiscovery, { type VenueHubView } from '../Venues';
import VendorExplore from './VendorExplore';
import CategoryFilterBar from './CategoryFilterBar';
import { useLang } from '../../i18n';
import type { NavigateTarget } from '../../lib/hub-nav';
import { EXPLORE_HEADERS, type HubCat, type HubTab } from './shared';

export default function ExplorePanel({
  cat,
  onCatChange,
  query,
  venueView,
  onVenueViewChange,
  onNavigate,
  onSwitchTab,
  vendorsLocked = false,
}: {
  cat: HubCat;
  onCatChange: (cat: HubCat) => void;
  query: string;
  venueView: VenueHubView;
  onVenueViewChange: (view: VenueHubView) => void;
  onNavigate?: (s: NavigateTarget) => void;
  onSwitchTab: (tab: HubTab, cat?: HubCat) => void;
  vendorsLocked?: boolean;
}) {
  const { t } = useLang();
  const goToVenue = () => onSwitchTab('explore', 'venue');
  // The filter bar drops in under each sub-view's own header (Discover for
  // venues, top of the grid for vendors) instead of being pinned to the top.
  const categoryBar = (
    <CategoryFilterBar cat={cat} onCatChange={onCatChange} vendorsLocked={vendorsLocked} />
  );

  if (cat === 'venue') {
    return (
      <VenueDiscovery
        onNavigate={onNavigate}
        hub={{
          view: venueView === 'review' ? 'discover' : venueView,
          onViewChange: onVenueViewChange,
          onSwitchTab: onSwitchTab,
          searchQuery: query,
          category: cat,
          showHint: false,
          categoryBar,
        }}
      />
    );
  }

  const header = EXPLORE_HEADERS[cat];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mt-1 font-serif text-[clamp(2rem,4vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-[#314523]">
          {t(header.title)}
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-[#6c7561]">
          {t(header.body)}
        </p>
      </div>
      {categoryBar}
      <VendorExplore cat={cat} onGoToVenue={goToVenue} onNavigate={onNavigate} />
    </div>
  );
}
