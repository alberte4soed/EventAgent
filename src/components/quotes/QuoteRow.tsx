"use client";

import { useState } from "react";
import type { EmailReplyRow, OutboundEmailRow, VenueRow } from "@/lib/db/types";

interface Props {
  venue: VenueRow;
  outbound?: OutboundEmailRow;
  replies: EmailReplyRow[];
}

function statusBadge(outbound?: OutboundEmailRow, latest?: EmailReplyRow) {
  if (latest) {
    switch (latest.quote_status) {
      case "quoted":
        return { label: "Quoted", classes: "bg-[#e3ece8] text-[#4d6b5c]" };
      case "no_availability":
        return { label: "Not available", classes: "bg-[#f0e0dc] text-[#a8483a]" };
      case "needs_info":
        return { label: "Needs info", classes: "bg-[#f3ecd6] text-[#8a6d2f]" };
      default:
        return { label: "Replied", classes: "bg-[#e7ecf1] text-[#4d6175]" };
    }
  }
  switch (outbound?.status) {
    case "sent":
      return { label: "Sent — awaiting reply", classes: "bg-[#e0dac7] text-[#5c4a3d]" };
    case "failed":
      return { label: "Send failed", classes: "bg-[#f0e0dc] text-[#a8483a]" };
    default:
      return { label: "Not contacted", classes: "bg-[#e0dac7] text-[#9a8a77]" };
  }
}

export function QuoteRow({ venue, outbound, replies }: Props) {
  const [open, setOpen] = useState(false);
  const latest = [...replies].sort((a, b) =>
    (b.received_at ?? b.created_at).localeCompare(a.received_at ?? a.created_at)
  )[0];
  const badge = statusBadge(outbound, latest);
  const quote = latest?.quote;

  return (
    <div className="rounded-2xl border border-[#dfd9c6] bg-[#fdfbf4]">
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
            <div className="truncate font-semibold text-[#3d2b23]">{venue.name}</div>
            <div className="mt-0.5 truncate text-xs text-[#9a8a77]">
              {outbound
                ? `Sent to ${outbound.to_email}${outbound.sent_at ? ` · ${new Date(outbound.sent_at).toLocaleString()}` : ""}`
                : venue.email ?? "No contact email"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {quote?.has_quote && quote.price_amount != null && (
            <span className="text-sm font-semibold text-[#ac5239]">
              {quote.price_amount.toLocaleString()} {quote.currency ?? ""}
              {quote.price_basis ? (
                <span className="font-normal text-[#9a8a77]"> {quote.price_basis}</span>
              ) : null}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.classes}`}>
            {badge.label}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#e5e0cf] px-5 py-4 text-sm">
          {outbound?.status === "failed" && (
            <p className="text-[#a8483a]">Send error: {outbound.error}</p>
          )}
          {latest ? (
            <>
              {quote?.summary && <p className="text-[#5c4a3d]">{quote.summary}</p>}
              {quote?.conditions && (
                <p className="mt-1 text-xs text-[#9a8a77]">Conditions: {quote.conditions}</p>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-[#9a8a77] hover:text-[#5c4a3d]">
                  Full reply
                </summary>
                <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#f4f1e8] p-3 font-[family-name:var(--font-inter)] text-xs leading-relaxed text-[#7a6b5c]">
                  {latest.body ?? latest.snippet ?? "(empty)"}
                </pre>
              </details>
            </>
          ) : (
            <p className="text-[#9a8a77]">No reply yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
