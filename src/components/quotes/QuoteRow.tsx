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
        return { label: "Quoted", classes: "bg-[#eef0ec] text-[#5e6b58]" };
      case "no_availability":
        return { label: "Not available", classes: "bg-red-50 text-red-700" };
      case "needs_info":
        return { label: "Needs info", classes: "bg-amber-50 text-amber-700" };
      default:
        return { label: "Replied", classes: "bg-blue-50 text-blue-700" };
    }
  }
  switch (outbound?.status) {
    case "sent":
      return { label: "Sent — awaiting reply", classes: "bg-stone-100 text-stone-600" };
    case "failed":
      return { label: "Send failed", classes: "bg-red-50 text-red-700" };
    default:
      return { label: "Not contacted", classes: "bg-stone-100 text-stone-400" };
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
    <div className="rounded-2xl border border-stone-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <div className="truncate font-medium text-stone-900">{venue.name}</div>
          <div className="mt-0.5 truncate text-xs text-stone-500">
            {outbound
              ? `Sent to ${outbound.to_email}${outbound.sent_at ? ` · ${new Date(outbound.sent_at).toLocaleString()}` : ""}`
              : venue.email ?? "No contact email"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {quote?.has_quote && quote.price_amount != null && (
            <span className="text-sm font-semibold text-[#5e6b58]">
              {quote.price_amount.toLocaleString()} {quote.currency ?? ""}
              {quote.price_basis ? (
                <span className="font-normal text-stone-400"> {quote.price_basis}</span>
              ) : null}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.classes}`}>
            {badge.label}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-stone-200 px-5 py-4 text-sm">
          {outbound?.status === "failed" && (
            <p className="text-red-600">Send error: {outbound.error}</p>
          )}
          {latest ? (
            <>
              {quote?.summary && <p className="text-stone-700">{quote.summary}</p>}
              {quote?.conditions && (
                <p className="mt-1 text-xs text-stone-500">Conditions: {quote.conditions}</p>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-700">
                  Full reply
                </summary>
                <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#faf9f6] p-3 font-sans text-xs leading-relaxed text-stone-500">
                  {latest.body ?? latest.snippet ?? "(empty)"}
                </pre>
              </details>
            </>
          ) : (
            <p className="text-stone-500">No reply yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
