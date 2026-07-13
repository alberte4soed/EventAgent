"use client";

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle } from 'lucide-react';
import VenueDiscovery, { type VenueHubView } from '../Venues';
import { useWedding } from '../../useWedding';
import { Eyebrow, cn } from '../../ui';
import type { NavigateTarget } from '../../lib/hub-nav';
import type { HubCat, HubTab } from './shared';
import { matchesHubCat, matchesHubSearch } from './shared';
import type { VenueRow } from '@/lib/db/types';

const CAT_LABEL: Record<string, string> = {
  venue: 'Venue',
  photographer: 'Foto',
  florist: 'Blomster',
  caterer: 'Catering',
  musician: 'Musik',
  planner: 'Planlægger',
  other: 'Andet',
};

export default function ShortlistPanel({
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
  const { venues, outbound, refresh } = useWedding();
  const sentIds = useMemo(() => new Set(outbound.map((o) => o.venue_id)), [outbound]);

  const liked = useMemo(
    () => venues.filter((v) => v.swipe_status === 'liked' && matchesHubCat(v, cat) && matchesHubSearch(v, query)),
    [venues, cat, query],
  );

  const likedVenues = liked.filter((v) => v.category === 'venue');
  const likedVendors = liked.filter((v) => v.category !== 'venue');
  const showVenueList = cat === 'venue' || cat === 'alle';
  const showVendorList = cat !== 'venue';

  if (venueView === 'review' && showVenueList) {
    return (
      <VenueDiscovery
        onNavigate={onNavigate}
        hub={{
          view: 'review',
          onViewChange: onVenueViewChange,
          onSwitchTab: onSwitchTab,
          searchQuery: query,
          category: cat,
          showHint: false,
        }}
      />
    );
  }

  return (
    <div className="space-y-10">
      {showVenueList && likedVenues.length > 0 && (
        <VenueDiscovery
          onNavigate={onNavigate}
          hub={{
            view: 'list',
            onViewChange: onVenueViewChange,
            onSwitchTab: onSwitchTab,
            searchQuery: query,
            category: cat,
            showHint: false,
          }}
        />
      )}

      {showVendorList && (
        <VendorShortlist
          items={likedVendors}
          contacted={sentIds}
          onNavigate={onNavigate}
          onExplore={(c) => onSwitchTab('explore', c)}
        />
      )}

      {liked.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-serif text-[1.3rem] italic text-ink-soft">Ingen på shortlisten endnu</p>
          <button
            type="button"
            onClick={() => onSwitchTab('explore', cat === 'alle' ? 'venue' : cat)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.8rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer"
          >
            Udforsk {cat === 'venue' ? 'venues' : 'leverandører'}
          </button>
        </div>
      )}

      {showVenueList && likedVenues.length === 0 && showVendorList && likedVendors.length > 0 && null}
    </div>
  );
}

function VendorShortlist({
  items,
  contacted,
  onNavigate,
  onExplore,
}: {
  items: VenueRow[];
  contacted: Set<string>;
  onNavigate?: (s: NavigateTarget) => void;
  onExplore: (cat: HubCat) => void;
}) {
  const { refresh } = useWedding();
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (id: string, liked: boolean) => {
    setBusy(id);
    try {
      await fetch(`/api/venues/${id}/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: liked ? 'rejected' : 'liked' }),
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <section>
      <Eyebrow>Leverandører på shortlisten · {items.length}</Eyebrow>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => {
          const isContacted = contacted.has(v.id);
          return (
            <motion.div
              key={v.id}
              layout
              className="rule flex flex-col rounded-2xl bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted">
                    {CAT_LABEL[v.category] ?? v.category}
                  </p>
                  <h3 className="display mt-1 text-[1.05rem] text-ink">{v.name}</h3>
                  {v.price_hint && <p className="mt-1 font-serif text-[0.95rem] text-ink">{v.price_hint}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => void toggle(v.id, true)}
                  disabled={busy === v.id}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-ink cursor-pointer"
                  aria-label="Fjern fra shortlist"
                >
                  <Heart size={14} fill="currentColor" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {isContacted ? (
                  <span className="rounded-full bg-shell px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted">
                    Kontaktet
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate?.('ava')}
                    className="rounded-full bg-ink px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-canvas cursor-pointer"
                  >
                    Bed Ava kontakte
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onExplore('alle')}
        className={cn(
          'mt-6 flex w-full items-center justify-center gap-2 rounded-2xl rule bg-card px-5 py-3.5',
          'text-[0.85rem] text-ink hover:bg-shell transition-colors cursor-pointer',
        )}
      >
        <MessageCircle size={16} className="text-muted" />
        Find flere leverandører
      </button>
    </section>
  );
}
