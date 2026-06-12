"use client";

import Link from "next/link";
import type { EmailDraftRow, EventRow, VenueRow } from "@/lib/db/types";
import { FeaturedVenueDeck } from "@/components/swipe/FeaturedVenueDeck";

interface Props {
  event: EventRow | null;
  venues: VenueRow[];
  drafts: EmailDraftRow[];
  messageId: string | null;
  gmailConnected: boolean;
  onSwipe: (venueId: string, decision: "liked" | "rejected") => void;
  onDeckFinished: (messageId: string, liked: number, rejected: number) => void;
  onOpenQuotes: () => void;
}

export function VenueCanvas({
  event,
  venues,
  drafts,
  messageId,
  gmailConnected,
  onSwipe,
  onDeckFinished,
  onOpenQuotes,
}: Props) {
  const batchVenues = venues;
  const pending = batchVenues.filter((v) => v.swipe_status === "pending");
  const liked = batchVenues.filter((v) => v.swipe_status === "liked");
  const reviewed = batchVenues.filter((v) => v.swipe_status !== "pending").length;
  const proposedDraft = drafts.find((d) => d.status === "proposed");

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f1e8]">
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e5e0cf] px-7">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-[-0.45px] text-[#3d2b23]">
            {event?.title ?? "New event"}
          </h1>
          <div className="flex items-center gap-3.5 text-[12.5px] text-[#7a6b5c]">
            {event?.location && (
              <span className="flex items-center gap-1">
                <svg
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="size-3 text-[#9a8a77]"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {event.location}
              </span>
            )}
            {event?.guest_count && (
              <span className="flex items-center gap-1">
                <svg
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="size-3 text-[#9a8a77]"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {event.guest_count} guests
              </span>
            )}
            {event?.event_date && (
              <span className="flex items-center gap-1">
                <svg
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="size-3 text-[#9a8a77]"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {event.event_date}
              </span>
            )}
          </div>
        </div>
        {batchVenues.length > 0 && (
          <div className="flex h-[34px] items-center gap-2 rounded-full bg-[#ece8db] px-3.5">
            <svg
              stroke="#ac5239"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="size-3.5"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="text-[13px] font-medium text-[#3d2b23]">
              {liked.length} liked · {reviewed} of {batchVenues.length} reviewed
            </span>
          </div>
        )}
      </header>

      {batchVenues.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <p className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[#3d2b23]">
            Your venue board
          </p>
          <p className="max-w-md text-sm leading-relaxed text-[#7a6b5c]">
            Venues appear here after kalas searches the web. Describe your event in the chat — location,
            guest count, and vibe — and I&apos;ll populate this board for you to swipe through.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 gap-5 overflow-hidden px-7 py-5">
          <div className="flex min-w-0 flex-1 flex-col">
            {messageId && (
              <FeaturedVenueDeck
                messageId={messageId}
                venues={batchVenues}
                onSwipe={onSwipe}
                onFinished={onDeckFinished}
              />
            )}
          </div>
          {pending.length > 1 && (
            <div className="flex w-[252px] shrink-0 flex-col gap-2.5">
              <p className="text-[11px] font-medium uppercase tracking-[1.1px] text-[#9a8a77]">
                Up next
              </p>
              <div className="flex flex-col gap-2.5 overflow-y-auto">
                {pending.slice(1, 5).map((venue) => (
                  <div
                    key={venue.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#e5e0cf] bg-[#fdfbf4] p-2.5"
                  >
                    <div
                      className={`size-14 shrink-0 rounded-xl bg-cover bg-center bg-no-repeat ${
                        venue.image_url
                          ? ""
                          : "bg-gradient-to-br from-[#e0dac7] to-[#cfc8b2]"
                      }`}
                      style={
                        venue.image_url ? { backgroundImage: `url('${venue.image_url}')` } : undefined
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-[#3d2b23]">
                        {venue.name}
                      </p>
                      <p className="truncate text-[11.5px] text-[#9a8a77]">
                        {venue.capacity ? `${venue.capacity} capacity` : venue.address ?? "Venue"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(liked.length > 0 || proposedDraft) && (
        <div className="flex shrink-0 items-center gap-3.5 border-t border-[#e5e0cf] bg-[#f0ede0] px-7 py-4">
          <div className="shrink-0">
            <p className="text-[13px] font-semibold text-[#3d2b23]">Liked venues</p>
            <p className="text-[11.5px] text-[#9a8a77]">Quotes go to these</p>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto">
            {liked.map((venue) => (
              <div
                key={venue.id}
                className="flex h-11 shrink-0 items-center gap-2.5 rounded-[14px] border border-[#dfd9c6] bg-[#fdfbf4] px-3.5"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-[#f0e4dd]">
                  <svg
                    stroke="#ac5239"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="size-3"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold text-[#3d2b23]">{venue.name}</p>
                  <p className="text-[10.5px] text-[#9a8a77]">Shortlisted</p>
                </div>
              </div>
            ))}
          </div>
          {proposedDraft ? (
            <button
              type="button"
              onClick={onOpenQuotes}
              className="flex h-[42px] shrink-0 items-center gap-2 rounded-xl bg-[#ac5239] px-[18px] text-[13.5px] font-medium text-[#f8f4e9] shadow-[0px_3px_10px_rgba(172,82,57,0.3)] transition hover:bg-[#96462f]"
            >
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="size-[15px]"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Review draft in chat
            </button>
          ) : !gmailConnected ? (
            <Link
              href="/settings"
              className="flex h-[42px] shrink-0 items-center gap-2 rounded-xl border border-[#ac5239] px-[18px] text-[13.5px] font-medium text-[#ac5239] transition hover:bg-[#f0e4dd]"
            >
              Connect Gmail to send quotes
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
