"use client";

import type { EmailDraftRow, VenueRow } from "@/lib/db/types";
import { CATEGORY_META } from "@/lib/journey";

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
  const category = draft.category ?? "venue";
  const categoryMeta =
    category !== "venue" ? CATEGORY_META[category] : null;
  const categoryNoun = categoryMeta ? categoryMeta.label.toLowerCase() : "venue";
  // Recipients are liked vendors in this draft's category not yet contacted.
  const recipients = venues.filter(
    (v) => v.swipe_status === "liked" && v.category === category
  );
  const missingEmail = recipients.filter((v) => !v.email);

  return (
    <div className="w-full max-w-lg rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[1.1px] text-[#4A4E3C]">
          Email draft · v{draft.version}
        </span>
        <div className="flex items-center gap-2">
          {categoryMeta && (
            <span className="rounded-full bg-[#ece8db] px-2 py-0.5 text-xs font-medium text-[#656952]">
              {categoryMeta.emoji} {categoryMeta.label}
            </span>
          )}
          {draft.status !== "proposed" && (
            <span className="rounded-full bg-[#e0dac7] px-2 py-0.5 text-xs text-[#656952]">
              {draft.status}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-[#4A4E3C]">{draft.subject}</p>
      <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#F6F0E8] p-3 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-[#656952]">
        {draft.body_template}
      </pre>

      <div className="mt-3 text-xs text-[#7A8066]">
        Ava will write an individual email to{" "}
        <span className="font-medium text-[#4A4E3C]">{recipients.length}</span> liked {categoryNoun}
        {recipients.length === 1 ? "" : "s"}
        {recipients.length > 0 && (
          <span>: {recipients.map((v) => v.name).join(", ")}</span>
        )}
        {missingEmail.length > 0 && (
          <p className="mt-1 text-[#4A4E3C]">
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
            className="rounded-xl bg-[#4A4E3C] px-4 py-2 text-sm font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47] disabled:opacity-50"
          >
            {approving ? "Sending…" : "Approve & send"}
          </button>
          <button
            onClick={onRequestChanges}
            disabled={approving}
            className="rounded-xl border border-[#D4D6C0] px-4 py-2 text-sm text-[#656952] transition hover:bg-[#ddd6c0] disabled:opacity-50"
          >
            Request changes
          </button>
        </div>
      )}
    </div>
  );
}
