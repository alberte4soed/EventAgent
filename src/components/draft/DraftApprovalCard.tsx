"use client";

import type { EmailDraftRow, VenueRow } from "@/lib/db/types";

interface Props {
  draft: EmailDraftRow;
  venues: VenueRow[];
  active: boolean; // latest proposed draft → show action buttons
  approving: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
}

export function DraftApprovalCard({
  draft,
  venues,
  active,
  approving,
  onApprove,
  onRequestChanges,
}: Props) {
  const recipients = venues.filter((v) => v.swipe_status === "liked");
  const missingEmail = recipients.filter((v) => !v.email);

  return (
    <div className="w-full max-w-lg rounded-2xl border border-amber-900/60 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-amber-400">
          Email draft · v{draft.version}
        </span>
        {draft.status !== "proposed" && (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            {draft.status}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm font-medium text-zinc-200">{draft.subject}</p>
      <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-sans text-sm leading-relaxed text-zinc-300">
        {draft.body_template}
      </pre>

      <div className="mt-3 text-xs text-zinc-500">
        Will be personalized and sent to{" "}
        <span className="text-zinc-300">{recipients.length}</span> liked venue
        {recipients.length === 1 ? "" : "s"}
        {recipients.length > 0 && (
          <span>: {recipients.map((v) => v.name).join(", ")}</span>
        )}
        {missingEmail.length > 0 && (
          <p className="mt-1 text-amber-400">
            ⚠ No contact email yet for {missingEmail.map((v) => v.name).join(", ")} —
            I&apos;ll try to find one when sending, otherwise they&apos;ll be skipped.
          </p>
        )}
      </div>

      {active && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={onApprove}
            disabled={approving || recipients.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {approving ? "Sending…" : "Approve & send"}
          </button>
          <button
            onClick={onRequestChanges}
            disabled={approving}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            Request changes
          </button>
        </div>
      )}
    </div>
  );
}
