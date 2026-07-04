"use client";

import Link from "next/link";
import type { ChatMessageRow, EmailDraftRow, VenueRow } from "@/lib/db/types";
import { DraftApprovalCard } from "@/components/draft/DraftApprovalCard";
import { InviteBriefCard } from "@/components/chat/InviteBriefCard";
import { ReplyProposalChatCard } from "@/components/chat/ReplyProposalChatCard";

interface Props {
  message: ChatMessageRow;
  /** Omitted in the lightweight sidebar — payload cards fall back to links. */
  venues?: VenueRow[];
  drafts?: EmailDraftRow[];
  isActiveDraft?: boolean;
  approving?: boolean;
  onApproveDraft?: (draftId: string) => void;
  onRequestChanges?: () => void;
  /** When true, rich payload cards collapse to links into the workspace. */
  compact?: boolean;
}

function AgentAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#dbd5c2] bg-[#F6F0E8]">
      <span className="font-[family-name:var(--font-fraunces)] text-[13px] font-semibold text-[#4A4E3C]">
        a
      </span>
    </div>
  );
}

export function MessageBubble({
  message,
  venues,
  drafts,
  isActiveDraft = false,
  approving = false,
  onApproveDraft,
  onRequestChanges,
  compact = false,
}: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[340px] rounded-tl-2xl rounded-tr-2xl rounded-br-[5px] rounded-bl-2xl bg-[#4A4E3C] px-4 py-[11px]">
          <p className="whitespace-pre-wrap text-sm leading-[1.55] text-[#F6F0E8]">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {message.content && (
        <div className="flex gap-3">
          <AgentAvatar />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <p className="whitespace-pre-wrap text-sm leading-[1.6] text-[#4A4E3C]">
              {message.content}
            </p>
            {message.payload?.kind === "venue_batch" && (
              <VenueBatchPill
                count={(message.payload as { venue_ids: string[] }).venue_ids.length}
                eventId={message.event_id}
                compact={compact}
              />
            )}
          </div>
        </div>
      )}

      {message.payload?.kind === "draft" &&
        (() => {
          const draft = drafts?.find(
            (d) => d.id === (message.payload as { draft_id: string }).draft_id
          );
          if (compact || !draft || !venues) {
            return (
              <div className="ml-10">
                <WorkspaceLink eventId={message.event_id} label="Review the email draft" />
              </div>
            );
          }
          return (
            <div className="ml-10">
              <DraftApprovalCard
                draft={draft}
                venues={venues}
                active={isActiveDraft && draft.status === "proposed"}
                approving={approving}
                onApprove={() => onApproveDraft?.(draft.id)}
                onRequestChanges={() => onRequestChanges?.()}
              />
            </div>
          );
        })()}

      {message.payload?.kind === "invite_brief" && (
        <div className="ml-10">
          <InviteBriefCard
            wording={message.payload.wording}
            style={message.payload.style}
            eventId={message.event_id}
          />
        </div>
      )}

      {message.payload?.kind === "reply_proposal" && (
        <div className="ml-10">
          <ReplyProposalChatCard proposalId={message.payload.proposal_id} />
        </div>
      )}

      {message.payload?.kind === "send_report" && (
        <div className="ml-10 flex gap-2 text-xs">
          <span className="rounded-full bg-[#e0dac7] px-2.5 py-1 font-medium text-[#656952]">
            ✓ {message.payload.sent} sent
          </span>
          {message.payload.failed > 0 && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">
              ✗ {message.payload.failed} failed
            </span>
          )}
          {message.payload.skipped > 0 && (
            <span className="rounded-full bg-[#ddd6c0] px-2.5 py-1 text-[#8a8568]">
              {message.payload.skipped} skipped (no email)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function VenueBatchPill({
  count,
  eventId,
  compact,
}: {
  count: number;
  eventId: string;
  compact: boolean;
}) {
  const inner = (
    <>
      <svg stroke="#7A8066" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="size-3">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span className="text-[11.5px] font-medium text-[#656952]">{count} on your board</span>
    </>
  );
  if (compact) {
    return (
      <Link
        href={`/events/${eventId}`}
        className="flex h-[26px] w-fit items-center gap-1.5 rounded-full bg-[#e0dac7] px-2.5 transition hover:bg-[#ddd6c0]"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="flex h-[26px] w-fit items-center gap-1.5 rounded-full bg-[#e0dac7] px-2.5">
      {inner}
    </div>
  );
}

function WorkspaceLink({ eventId, label }: { eventId: string; label: string }) {
  return (
    <Link
      href={`/events/${eventId}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-[#e0dac7] px-3 py-1.5 text-[11.5px] font-medium text-[#656952] transition hover:bg-[#ddd6c0]"
    >
      {label} →
    </Link>
  );
}
