"use client";

import type { VenueRow } from "@/lib/db/types";

export function VenueCard({ venue }: { venue: VenueRow }) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(40,38,34,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-stone-900">{venue.name}</h3>
        {venue.capacity && (
          <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
            👥 {venue.capacity}
          </span>
        )}
      </div>
      {venue.address && (
        <p className="mt-1 text-xs text-stone-400">📍 {venue.address}</p>
      )}
      {venue.description && (
        <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-stone-500">
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
  );
}
