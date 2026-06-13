"use client";

import type { EmailReplyRow, OutboundEmailRow, VenueRow } from "@/lib/db/types";
import { QuoteRow } from "./QuoteRow";

interface Props {
  venues: VenueRow[];
  outbound: OutboundEmailRow[];
  replies: EmailReplyRow[];
}

export function QuotesDashboard({ venues, outbound, replies }: Props) {
  const liked = venues.filter((v) => v.swipe_status === "liked");

  if (liked.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-[#7A8066]">
        <div>
          <p className="text-3xl">📬</p>
          <p className="mt-3 max-w-sm">
            No venues shortlisted yet. Like some venues on your board and quotes
            will be collected here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F6F0E8] px-6 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[#4A4E3C]">
          Quote requests
        </h2>
        <p className="mt-1 text-xs text-[#8a8568]">
          Replies are checked every few minutes — new quotes appear here
          automatically.
        </p>
        <div className="mt-5 space-y-3">
          {liked.map((venue) => (
            <QuoteRow
              key={venue.id}
              venue={venue}
              outbound={outbound.find((o) => o.venue_id === venue.id)}
              replies={replies.filter((r) => r.venue_id === venue.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
