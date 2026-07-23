"use client";

import VenueDiscovery, { type VenueHubView } from '../Venues';
import VendorExplore from './VendorExplore';
import type { NavigateTarget } from '../../lib/hub-nav';
import type { HubCat, HubTab } from './shared';

export default function ExplorePanel({
  cat,
  query,
  venueView,
  onVenueViewChange,
  onNavigate,
  onSwitchTab,
}: {
  cat: HubCat;
  query: string;
  venueView: VenueHubView;
  onVenueViewChange: (view: VenueHubView) => void;
  onNavigate?: (s: NavigateTarget) => void;
  onSwitchTab: (tab: HubTab, cat?: HubCat) => void;
}) {
  const goToVenue = () => onSwitchTab('explore', 'venue');

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
        }}
      />
    );
  }

  return <VendorExplore cat={cat} onGoToVenue={goToVenue} onNavigate={onNavigate} />;
}
