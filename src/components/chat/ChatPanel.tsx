"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ChatMessageRow, EmailDraftRow, VenueRow } from "@/lib/db/types";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";

interface Props {
  messages: ChatMessageRow[];
  venues: VenueRow[];
  drafts: EmailDraftRow[];
  agentStatus: string | null;
  approving: boolean;
  quoteCount: number;
  onSend: (text: string) => void;
  onApproveDraft: (draftId: string) => void;
  onOpenQuotes: () => void;
}

export function ChatPanel({
  messages,
  venues,
  drafts,
  agentStatus,
  approving,
  quoteCount,
  onSend,
  onApproveDraft,
  onOpenQuotes,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, agentStatus]);

  const lastDraftMessageId = [...messages]
    .reverse()
    .find((m) => m.payload?.kind === "draft")?.id;

  return (
    <div className="flex h-full w-full max-w-[460px] shrink-0 flex-col border-r border-[#dbd5c2] bg-[#ece8db]">
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#dbd5c2] px-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#4A4E3C]"
        >
          kalas
        </Link>
        <div className="flex items-center gap-2">
          {quoteCount > 0 && (
            <button
              type="button"
              onClick={onOpenQuotes}
              className="rounded-[10px] border border-[#C4C8AE] px-3 py-1.5 text-[12.5px] font-medium text-[#656952] transition hover:bg-[#e0dac7]"
            >
              Quotes ({quoteCount})
            </button>
          )}
          <Link
            href="/events/new"
            className="flex h-8 items-center gap-1.5 rounded-[10px] border border-[#C4C8AE] px-3 text-[12.5px] font-medium text-[#656952] transition hover:bg-[#e0dac7]"
          >
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="size-3.5 text-[#7A8066]"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New wedding
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-[22px]">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] p-5 text-sm leading-[1.6] text-[#7A8066]">
            <p className="font-medium text-[#4A4E3C]">Hi — I&apos;m your wedding-planning agent.</p>
            <p className="mt-2">
              Tell me about the wedding you&apos;re planning — for example:{" "}
              <em className="text-[#656952]">
                &quot;Find venues for our garden wedding in Copenhagen for 120 guests.&quot;
              </em>{" "}
              I&apos;ll search the web, you swipe through venues on the board, and I&apos;ll email
              the ones you like for quotes.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            venues={venues}
            drafts={drafts}
            isActiveDraft={message.id === lastDraftMessageId}
            approving={approving}
            onApproveDraft={onApproveDraft}
            onRequestChanges={() => document.getElementById("chat-input")?.focus()}
          />
        ))}
        {agentStatus && (
          <div className="flex items-center gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#dbd5c2] bg-[#F6F0E8]">
              <span className="font-[family-name:var(--font-fraunces)] text-[13px] font-semibold text-[#4A4E3C]">
                k
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#7A8066]">
              <span className="inline-block size-2 animate-pulse rounded-full bg-[#4A4E3C]" />
              {agentStatus}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput disabled={agentStatus !== null} onSend={onSend} />
    </div>
  );
}
