"use client";

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
  onSend: (text: string) => void;
  onSwipe: (venueId: string, decision: "liked" | "rejected") => void;
  onDeckFinished: (messageId: string, liked: number, rejected: number) => void;
  onApproveDraft: (draftId: string) => void;
}

export function ChatPanel({
  messages,
  venues,
  drafts,
  agentStatus,
  approving,
  onSend,
  onSwipe,
  onDeckFinished,
  onApproveDraft,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, agentStatus]);

  const lastDraftMessageId = [...messages]
    .reverse()
    .find((m) => m.payload?.kind === "draft")?.id;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
              <p className="font-medium text-stone-900">
                👋 Hi! I&apos;m your event-planning agent.
              </p>
              <p className="mt-2">
                Tell me about the event you&apos;re planning — for example:{" "}
                <em>
                  &quot;Find venues for a 50th birthday party in Copenhagen for 80
                  people.&quot;
                </em>{" "}
                I&apos;ll search the web for venues, you swipe through them, and
                I&apos;ll email the ones you like for quotes — straight from your
                Gmail.
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
              onSwipe={onSwipe}
              onDeckFinished={onDeckFinished}
              onApproveDraft={onApproveDraft}
              onRequestChanges={() =>
                document.getElementById("chat-input")?.focus()
              }
            />
          ))}
          {agentStatus && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#7c8a76]" />
              {agentStatus}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <ChatInput disabled={agentStatus !== null} onSend={onSend} />
    </div>
  );
}
