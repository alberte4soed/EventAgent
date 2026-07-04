"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReplyProposalRow } from "@/lib/db/types";

interface Props {
  proposalId: string;
}

/**
 * Renders Ava's proposed vendor reply inline in chat with approve/dismiss.
 * Self-fetches so it works from both the workspace and the assistant sidebar.
 */
export function ReplyProposalChatCard({ proposalId }: Props) {
  const [proposal, setProposal] = useState<ReplyProposalRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"sent" | "dismissed" | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reply_proposals")
      .select("*")
      .eq("id", proposalId)
      .maybeSingle()
      .then(({ data }) => setProposal((data as ReplyProposalRow | null) ?? null));
  }, [proposalId]);

  if (!proposal) return null;

  const settled = done ?? (proposal.status !== "proposed" ? proposal.status : null);

  async function act(kind: "send" | "dismiss") {
    setBusy(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/${kind}`, { method: "POST" });
      if (res.ok) setDone(kind === "send" ? "sent" : "dismissed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] p-4">
      <p className="text-[11px] font-medium uppercase tracking-[1.1px] text-[#4A4E3C]">
        Proposed reply to the vendor
      </p>
      <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#ece8db] p-3 font-[family-name:var(--font-inter)] text-[13px] leading-relaxed text-[#656952]">
        {proposal.body}
      </pre>
      {settled ? (
        <p className="mt-3 text-xs font-medium text-[#7A8066]">
          {settled === "sent" ? "Sent ✓" : "Dismissed"}
        </p>
      ) : (
        <div className="mt-3 flex gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => act("send")}
            className="rounded-full bg-[#4A4E3C] px-4 py-2 text-xs font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47] disabled:opacity-50"
          >
            {busy ? "Sending…" : "Approve & send"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act("dismiss")}
            className="rounded-full border border-[#D4D6C0] px-4 py-2 text-xs text-[#656952] transition hover:bg-[#ddd6c0] disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
