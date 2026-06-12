"use client";

import type { ChatMessageRow, EmailDraftRow, VenueRow } from "@/lib/db/types";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { DraftApprovalCard } from "@/components/draft/DraftApprovalCard";

interface Props {
  message: ChatMessageRow;
  venues: VenueRow[];
  drafts: EmailDraftRow[];
  isActiveDraft: boolean;
  approving: boolean;
  onSwipe: (venueId: string, decision: "liked" | "rejected") => void;
  onDeckFinished: (messageId: string, liked: number, rejected: number) => void;
  onApproveDraft: (draftId: string) => void;
  onRequestChanges: () => void;
}

export function MessageBubble({
  message,
  venues,
  drafts,
  isActiveDraft,
  approving,
  onSwipe,
  onDeckFinished,
  onApproveDraft,
  onRequestChanges,
}: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}>
      {message.content && (
        <div
          className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-white text-zinc-900"
              : "border border-zinc-800 bg-zinc-900 text-zinc-200"
          }`}
        >
          {message.content}
        </div>
      )}

      {message.payload?.kind === "venue_batch" && (
        <SwipeDeck
          messageId={message.id}
          venues={venues.filter((v) =>
            (message.payload as { venue_ids: string[] }).venue_ids.includes(v.id)
          )}
          onSwipe={onSwipe}
          onFinished={onDeckFinished}
        />
      )}

      {message.payload?.kind === "draft" &&
        (() => {
          const draft = drafts.find(
            (d) => d.id === (message.payload as { draft_id: string }).draft_id
          );
          if (!draft) return null;
          return (
            <DraftApprovalCard
              draft={draft}
              venues={venues}
              active={isActiveDraft && draft.status === "proposed"}
              approving={approving}
              onApprove={() => onApproveDraft(draft.id)}
              onRequestChanges={onRequestChanges}
            />
          );
        })()}

      {message.payload?.kind === "send_report" && (
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-emerald-950 px-2.5 py-1 text-emerald-300">
            ✓ {message.payload.sent} sent
          </span>
          {message.payload.failed > 0 && (
            <span className="rounded-full bg-red-950 px-2.5 py-1 text-red-300">
              ✗ {message.payload.failed} failed
            </span>
          )}
          {message.payload.skipped > 0 && (
            <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-400">
              {message.payload.skipped} skipped (no email)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
