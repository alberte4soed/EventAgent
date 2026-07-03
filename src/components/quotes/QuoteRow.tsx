"use client";

import { useState } from "react";
import type { EmailReplyRow, OutboundEmailRow, VenueRow } from "@/lib/db/types";

interface Props {
  venue: VenueRow;
  outbound?: OutboundEmailRow;
  replies: EmailReplyRow[];
  chosen?: boolean;
  canChoose?: boolean;
  onChoose?: (venueId: string) => void;
}

function statusBadge(outbound?: OutboundEmailRow, latest?: EmailReplyRow) {
  if (latest) {
    switch (latest.quote_status) {
      case "quoted":
        return { label: "Quoted", classes: "bg-[#e3ece8] text-[#4d6b5c]" };
      case "no_availability":
        return { label: "Not available", classes: "bg-[#f0e0dc] text-[#a8483a]" };
      case "needs_info":
        return { label: "Needs info", classes: "bg-[#ddd6c0] text-[#8a6d2f]" };
      default:
        return { label: "Replied", classes: "bg-[#e7ecf1] text-[#4d6175]" };
    }
  }
  switch (outbound?.status) {
    case "sent":
      return { label: "Sent — awaiting reply", classes: "bg-[#e0dac7] text-[#656952]" };
    case "failed":
      return { label: "Send failed", classes: "bg-[#f0e0dc] text-[#a8483a]" };
    default:
      return { label: "Not contacted", classes: "bg-[#e0dac7] text-[#8a8568]" };
  }
}

export function QuoteRow({
  venue,
  outbound,
  replies,
  chosen = false,
  canChoose = false,
  onChoose,
}: Props) {
  const [open, setOpen] = useState(false);
  const latest = [...replies].sort((a, b) =>
    (b.received_at ?? b.created_at).localeCompare(a.received_at ?? a.created_at)
  )[0];
  const badge = statusBadge(outbound, latest);
  const quote = latest?.quote;

  return (
    <div className="rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#e0dac7]">
            {venue.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={venue.image_url} alt={venue.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm">📍</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-[#4A4E3C]">{venue.name}</span>
              {venue.rating != null && (
                <span className="shrink-0 rounded-full bg-[#ece8db] px-2 py-0.5 text-[11px] font-medium text-[#656952]">
                  ★ {Number(venue.rating).toFixed(1)}
                  {venue.review_count ? ` (${venue.review_count})` : ""}
                </span>
              )}
              {chosen && (
                <span className="shrink-0 rounded-full bg-[#c2b280] px-2 py-0.5 text-[11px] font-semibold text-[#4A4E3C]">
                  Your venue 🎉
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-xs text-[#8a8568]">
              {outbound
                ? `Sent to ${outbound.to_email}${outbound.sent_at ? ` · ${new Date(outbound.sent_at).toLocaleString()}` : ""}`
                : venue.email ?? "No contact email"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {quote?.has_quote && quote.price_amount != null && (
            <span className="text-sm font-semibold text-[#4A4E3C]">
              {quote.price_amount.toLocaleString()} {quote.currency ?? ""}
              {quote.price_basis ? (
                <span className="font-normal text-[#8a8568]"> {quote.price_basis}</span>
              ) : null}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.classes}`}>
            {badge.label}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#D4D6C0] px-5 py-4 text-sm">
          {outbound?.status === "failed" && (
            <p className="text-[#a8483a]">Send error: {outbound.error}</p>
          )}
          {latest ? (
            <>
              {quote?.summary && <p className="text-[#656952]">{quote.summary}</p>}
              {quote?.conditions && (
                <p className="mt-1 text-xs text-[#8a8568]">Conditions: {quote.conditions}</p>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-[#8a8568] hover:text-[#656952]">
                  Full reply
                </summary>
                <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#F6F0E8] p-3 font-[family-name:var(--font-inter)] text-xs leading-relaxed text-[#7A8066]">
                  {latest.body ?? latest.snippet ?? "(empty)"}
                </pre>
              </details>
            </>
          ) : (
            <p className="text-[#8a8568]">No reply yet.</p>
          )}
          {canChoose && !chosen && onChoose && (
            <button
              type="button"
              onClick={() => onChoose(venue.id)}
              className="mt-4 rounded-full bg-[#4A4E3C] px-4 py-2 text-xs font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47]"
            >
              Choose this venue 🎉
            </button>
          )}
        </div>
      )}
    </div>
  );
}
