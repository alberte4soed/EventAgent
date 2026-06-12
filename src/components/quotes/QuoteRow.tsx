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
        return { label: "Quoted", classes: "bg-emerald-950 text-emerald-300" };
      case "no_availability":
        return { label: "Not available", classes: "bg-red-950 text-red-300" };
      case "needs_info":
        return { label: "Needs info", classes: "bg-amber-950 text-amber-300" };
      default:
        return { label: "Replied", classes: "bg-blue-950 text-blue-300" };
    }
  }
  switch (outbound?.status) {
    case "sent":
      return { label: "Sent — awaiting reply", classes: "bg-zinc-800 text-zinc-300" };
    case "failed":
      return { label: "Send failed", classes: "bg-red-950 text-red-300" };
    default:
      return { label: "Not contacted", classes: "bg-zinc-800 text-zinc-500" };
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <div className="truncate font-medium text-zinc-200">{venue.name}</div>
          <div className="mt-0.5 truncate text-xs text-zinc-500">
            {outbound
              ? `Sent to ${outbound.to_email}${outbound.sent_at ? ` · ${new Date(outbound.sent_at).toLocaleString()}` : ""}`
              : venue.email ?? "No contact email"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {quote?.has_quote && quote.price_amount != null && (
            <span className="text-sm font-semibold text-emerald-300">
              {quote.price_amount.toLocaleString()} {quote.currency ?? ""}
              {quote.price_basis ? (
                <span className="font-normal text-zinc-500"> {quote.price_basis}</span>
              ) : null}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.classes}`}>
            {badge.label}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-5 py-4 text-sm">
          {outbound?.status === "failed" && (
            <p className="text-red-400">Send error: {outbound.error}</p>
          )}
          {latest ? (
            <>
              {quote?.summary && <p className="text-zinc-300">{quote.summary}</p>}
              {quote?.conditions && (
                <p className="mt-1 text-xs text-zinc-500">Conditions: {quote.conditions}</p>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
                  Full reply
                </summary>
                <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-sans text-xs leading-relaxed text-zinc-400">
                  {latest.body ?? latest.snippet ?? "(empty)"}
                </pre>
              </details>
            </>
          ) : (
            <p className="text-zinc-500">No reply yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
