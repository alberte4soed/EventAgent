"use client";

import type { VenueRow } from "@/lib/db/types";

export function VenueCard({ venue }: { venue: VenueRow }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-zinc-100">{venue.name}</h3>
        {venue.capacity && (
          <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
            👥 {venue.capacity}
          </span>
        )}
      </div>
      {venue.address && (
        <p className="mt-1 text-xs text-zinc-500">📍 {venue.address}</p>
      )}
      {venue.description && (
        <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-zinc-400">
          {venue.description}
        </p>
      )}
      <div className="mt-3 space-y-1 text-xs text-zinc-500">
        {venue.price_hint && <p>💰 {venue.price_hint}</p>}
        {venue.email && <p>✉️ {venue.email}</p>}
        {venue.website && (
          <a
            href={venue.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sky-400 hover:underline"
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            Visit website ↗
          </a>
        )}
      </div>
    </div>
  );
}
