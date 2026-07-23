"use client";

import VenueDiscovery, { type VenueHubView } from '../Venues';
import Suppliers from '../Suppliers';
import CategoryFilterBar from './CategoryFilterBar';
import type { NavigateTarget } from '../../lib/hub-nav';
import type { HubCat, HubTab } from './shared';

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
  const showVenues = cat === 'venue' || cat === 'alle';
  const goToVenue = () => onSwitchTab('explore', 'venue');
  // The filter bar drops in under each sub-view's own header (Discover for
  // venues, top of the grid for vendors) instead of being pinned to the top.
  const categoryBar = (
    <CategoryFilterBar cat={cat} onCatChange={onCatChange} vendorsLocked={vendorsLocked} />
  );

  if (showVenues && cat !== 'alle') {
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

  if (showVenues && cat === 'alle') {
    return (
      <div className="space-y-8">
        <section>
          <VenueDiscovery
            onNavigate={onNavigate}
            hub={{
              view: 'discover',
              onViewChange: onVenueViewChange,
              onSwitchTab: onSwitchTab,
              searchQuery: query,
              category: 'venue',
              showHint: false,
              categoryBar,
            }}
          />
        </section>
        <section className="rule-t pt-8">
          <Suppliers
            onNavigate={onNavigate}
            hub={{ cat: 'alle', query, showHint: false, locked: vendorsLocked, onGoToVenue: goToVenue }}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categoryBar}
      <Suppliers
        onNavigate={onNavigate}
        hub={{ cat, query, showHint: false, locked: vendorsLocked, onGoToVenue: goToVenue }}
      />
    </div>
  );
}
