"use client";

import type { VenueRow } from "@/lib/db/types";

export function VenueCard({ venue }: { venue: VenueRow }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(40,38,34,0.08)]">
      {/* Photo header (real Google Places photo, or a calm gradient) */}
      <div className="relative h-36 shrink-0 overflow-hidden bg-[#eef0ec]">
        {venue.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={venue.image_url}
            alt={venue.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#dfe5db] to-[#cdd6c8] text-3xl">
            📍
          </div>
        )}
        {venue.capacity && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 backdrop-blur">
            👥 {venue.capacity}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-stone-900">{venue.name}</h3>
        {venue.address && (
          <p className="mt-1 text-xs text-stone-400">📍 {venue.address}</p>
        )}
        {venue.description && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-stone-500">
            {venue.description}
          </p>
        )}
        <div className="mt-3 space-y-1 text-xs text-stone-500">
          {venue.price_hint && <p>💰 {venue.price_hint}</p>}
          {venue.email && <p>✉️ {venue.email}</p>}
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[#7c8a76] hover:underline"
              onPointerDownCapture={(e) => e.stopPropagation()}
            >
              Visit website ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
