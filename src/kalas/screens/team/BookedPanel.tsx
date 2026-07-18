"use client";

import { useMemo } from 'react';
import { Camera, Flower2, Home, Music, UtensilsCrossed, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWedding } from '../../useWedding';
import { cn } from '../../ui';
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
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a9079]">
        Jeres team · {bookedCount} booket
      </p>
      <p className="mt-2 max-w-xl text-sm text-[#6c7561]">
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
                'flex min-h-[200px] flex-col rounded-[18px] border p-5 transition-colors',
                booked
                  ? 'border-[#d3dcc4] bg-[#eef1e6]'
                  : 'border-dashed border-[#d8d4c7] bg-[#fcfbf7]',
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  booked ? 'bg-[#314523] text-[#f7f5ef]' : 'bg-[#f0ede5] text-[#6c7561]',
                )}>
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <div>
                  <h3 className="font-serif text-[1.15rem] text-[#314523]">{slot.label}</h3>
                  {booked && <p className="text-[0.72rem] font-medium text-[#7a9068]">Booket ✓</p>}
                </div>
              </div>

              {booked ? (
                <div className="mt-4 flex-1">
                  <p className="font-serif text-[1.05rem] text-[#314523]">{booked.name}</p>
                  {booked.price_hint && (
                    <p className="mt-1 text-[0.82rem] text-[#6c7561]">{booked.price_hint}</p>
                  )}
                  {booked.address && (
                    <p className="mt-1 text-[0.78rem] text-[#6c7561]">{booked.address}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onSwitchTab('shortlist', slot.id)}
                    className="mt-4 text-[0.78rem] font-medium text-[#314523] underline-offset-2 hover:underline cursor-pointer"
                  >
                    Se detaljer
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-1 flex-col">
                  <p className="text-[0.82rem] leading-relaxed text-[#6c7561]">{slot.leadTime}</p>
                  <button
                    type="button"
                    onClick={() => onSwitchTab('explore', slot.id)}
                    className="mt-auto inline-flex h-8 items-center gap-1.5 self-start rounded-full border border-[#314523] px-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#314523] hover:bg-[#f7f5ef] transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
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
          className="mt-8 inline-flex h-8 items-center gap-1.5 rounded-full bg-[#314523] px-3 text-xs font-semibold text-[#f7f5ef] hover:opacity-90 transition-colors cursor-pointer"
        >
          Find fotograf →
        </button>
      )}
    </div>
  );
}
