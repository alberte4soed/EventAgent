"use client";

import { useMemo } from 'react';
import { Camera, Flower2, Home, Music, UtensilsCrossed, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWedding } from '../../useWedding';
import { Eyebrow, cn } from '../../ui';
import type { HubCat, HubTab } from './shared';
import type { VendorCategory } from '@/lib/db/types';

type Slot = {
  id: HubCat;
  label: string;
  icon: LucideIcon;
  backend: VendorCategory | 'venue';
  leadTime: string;
};

const SLOTS: Slot[] = [
  { id: 'venue', label: 'Venue', icon: Home, backend: 'venue', leadTime: 'Book 12+ måneder inden. De fleste par vælger dette først.' },
  { id: 'fotografi', label: 'Fotograf', icon: Camera, backend: 'photographer', leadTime: 'Book 9–12 måneder inden.' },
  { id: 'blomster', label: 'Florist', icon: Flower2, backend: 'florist', leadTime: 'Book 6–9 måneder inden.' },
  { id: 'catering', label: 'Catering', icon: UtensilsCrossed, backend: 'caterer', leadTime: 'Book 6–9 måneder inden.' },
  { id: 'musik', label: 'Musik', icon: Music, backend: 'musician', leadTime: 'Book 6–12 måneder inden.' },
];

export default function BookedPanel({
  onSwitchTab,
}: {
  onSwitchTab: (tab: HubTab, cat?: HubCat) => void;
}) {
  const { event, venues } = useWedding();
  const chosenVenueId = event?.chosen_venue_id ?? null;

  const bookedBySlot = useMemo(() => {
    const map = new Map<string, typeof venues[number]>();
    for (const v of venues) {
      if (v.booked_at || v.id === chosenVenueId) {
        map.set(v.category === 'venue' ? 'venue' : v.category, v);
      }
    }
    return map;
  }, [venues, chosenVenueId]);

  const bookedCount = bookedBySlot.size;

  return (
    <div>
      <Eyebrow>Jeres team · {bookedCount} booket</Eyebrow>
      <p className="mt-2 max-w-xl text-[0.9rem] text-ink-soft">
        Hold styr på hele holdet ét sted — fra venue til fotograf og blomster.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SLOTS.map((slot) => {
          const booked = slot.backend === 'venue'
            ? bookedBySlot.get('venue')
            : bookedBySlot.get(slot.backend);
          const Icon = slot.icon;

          return (
            <div
              key={slot.id}
              className={cn(
                'flex min-h-[200px] flex-col rounded-2xl border-2 border-dashed p-5 transition-colors',
                booked ? 'border-sage bg-sage-tint/40' : 'border-[var(--color-line)] bg-card',
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  booked ? 'bg-sage text-ink' : 'bg-shell text-muted',
                )}>
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <div>
                  <h3 className="font-serif text-[1.15rem] text-ink">{slot.label}</h3>
                  {booked && <p className="text-[0.72rem] font-medium text-success">Booket ✓</p>}
                </div>
              </div>

              {booked ? (
                <div className="mt-4 flex-1">
                  <p className="font-serif text-[1.05rem] text-ink">{booked.name}</p>
                  {booked.price_hint && (
                    <p className="mt-1 text-[0.82rem] text-muted">{booked.price_hint}</p>
                  )}
                  {booked.address && (
                    <p className="mt-1 text-[0.78rem] text-muted">{booked.address}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onSwitchTab('shortlist', slot.id)}
                    className="mt-4 text-[0.78rem] font-medium text-ink underline-offset-2 hover:underline cursor-pointer"
                  >
                    Se detaljer
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-1 flex-col">
                  <p className="text-[0.82rem] leading-relaxed text-ink-soft">{slot.leadTime}</p>
                  <button
                    type="button"
                    onClick={() => onSwitchTab('explore', slot.id)}
                    className="mt-auto inline-flex items-center gap-2 self-start rounded-full border border-ink px-4 py-2 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink hover:bg-shell transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    Booket? Tilføj her
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {bookedBySlot.has('venue') && !bookedBySlot.has('photographer') && (
        <button
          type="button"
          onClick={() => onSwitchTab('explore', 'fotografi')}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer"
        >
          Find fotograf →
        </button>
      )}
    </div>
  );
}
