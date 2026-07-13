"use client";

import VenueDiscovery, { type VenueHubView } from '../Venues';
import Suppliers from '../Suppliers';
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
  const showVenues = cat === 'venue' || cat === 'alle';

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
            }}
          />
        </section>
        <section className="rule-t pt-8">
          <Suppliers
            onNavigate={onNavigate}
            hub={{ cat: 'alle', query, showHint: false }}
          />
        </section>
      </div>
    );
  }

  return (
    <Suppliers
      onNavigate={onNavigate}
      hub={{ cat, query, showHint: false }}
    />
  );
}
