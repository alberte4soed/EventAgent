"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  wording: string;
  style: string | null;
  eventId: string;
}

/** Inline chat card showing drafted invitation wording, à la DraftApprovalCard. */
export function InviteBriefCard({ wording, style, eventId }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(wording);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — nothing to do.
    }
  }

  return (
    <div className="max-w-md rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] shadow-[0px_4px_12px_rgba(74,78,60,0.07)]">
      <div className="flex items-center justify-between border-b border-[#D4D6C0] px-5 py-3">
        <span className="text-[12.5px] font-semibold text-[#4A4E3C]">
          💌 Invitation wording
        </span>
        {style && (
          <span className="rounded-full bg-[#ece8db] px-2.5 py-1 text-[11px] font-medium text-[#656952]">
            {style}
          </span>
        )}
      </div>
      <div className="px-5 py-5">
        <p className="whitespace-pre-wrap text-center font-[family-name:var(--font-fraunces)] text-[15px] leading-[1.8] text-[#4A4E3C]">
          {wording}
        </p>
      </div>
      <div className="flex items-center gap-2.5 border-t border-[#D4D6C0] px-5 py-3.5">
        <Link
          href={`/events/${eventId}/invites`}
          className="rounded-full bg-[#4A4E3C] px-4 py-2 text-xs font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47]"
        >
          Order prints →
        </Link>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-[#D4D6C0] px-4 py-2 text-xs font-medium text-[#656952] transition hover:border-[#C4C8AE]"
        >
          {copied ? "Copied ✓" : "Copy text"}
        </button>
      </div>
    </div>
  );
}
