"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { AgentUiAction, ChatMessageRow } from "@/lib/db/types";

interface Options {
  initialEventId: string | null;
  initialMessages?: ChatMessageRow[];
  /** Fired when the agent lazily creates a new event mid-turn. */
  onEventCreated?: (eventId: string) => void;
  /** Fired after a turn's stream completes (refresh venues/drafts, etc.). */
  onTurnComplete?: () => void;
  /** Fired when the agent drives the client mid-turn (page navigation). */
  onUiAction?: (action: AgentUiAction) => void;
  /** Which interface the user is in — the agent navigates more proactively in chat mode. */
  uiMode?: "chat" | "classic";
  /** Rewrite the browser URL when a new event id arrives (workspace only). */
  syncUrl?: boolean;
}

export interface AgentChat {
  messages: ChatMessageRow[];
  agentStatus: string | null;
  eventId: string | null;
  sendMessage: (text: string, ctx?: { contextReplyId?: string }) => Promise<void>;
  setMessages: Dispatch<SetStateAction<ChatMessageRow[]>>;
}

/**
 * The shared chat transport: optimistic user message, POST /api/chat, and the
 * SSE frame parser (event/status/message/error). Extracted from EventWorkspace
 * so the omnipresent Ava sidebar can drive the same agent.
 */
export function useAgentChat({
  initialEventId,
  initialMessages = [],
  onEventCreated,
  onTurnComplete,
  onUiAction,
  uiMode = "classic",
  syncUrl = false,
}: Options): AgentChat {
  const [messages, setMessages] = useState<ChatMessageRow[]>(initialMessages);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const eventIdRef = useRef<string | null>(initialEventId);
  // Ref so a new callback identity never invalidates sendMessage mid-stream.
  const onUiActionRef = useRef(onUiAction);
  useEffect(() => {
    onUiActionRef.current = onUiAction;
  }, [onUiAction]);

  const sendMessage = useCallback(
    async (text: string, ctx?: { contextReplyId?: string }) => {
      const trimmed = text.trim();
      if (!trimmed || agentStatus !== null) return;

      const optimistic: ChatMessageRow = {
        id: `local-${Date.now()}`,
        event_id: eventIdRef.current ?? "",
        user_id: "",
        role: "user",
        content: trimmed,
        payload: null,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, optimistic]);
      setAgentStatus("Thinking…");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: eventIdRef.current ?? undefined,
            message: trimmed,
            contextReplyId: ctx?.contextReplyId,
            uiMode,
          }),
        });
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            let name = "message";
            let data = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event: ")) name = line.slice(7).trim();
              else if (line.startsWith("data: ")) data += line.slice(6);
            }
            if (!data) continue;
            const parsed = JSON.parse(data);
            if (name === "event") {
              eventIdRef.current = parsed.eventId;
              if (syncUrl) {
                window.history.replaceState(null, "", `/events/${parsed.eventId}`);
              }
              onEventCreated?.(parsed.eventId);
            } else if (name === "status") {
              setAgentStatus(parsed.status);
            } else if (name === "ui") {
              onUiActionRef.current?.(parsed as AgentUiAction);
            } else if (name === "user_message") {
              const saved = parsed as ChatMessageRow;
              setMessages((m) => {
                if (m.some((x) => x.id === saved.id)) {
                  return m.filter((x) => x.id !== optimistic.id);
                }
                return [...m.filter((x) => x.id !== optimistic.id), saved];
              });
            } else if (name === "message") {
              setMessages((m) =>
                m.some((x) => x.id === (parsed as ChatMessageRow).id)
                  ? m
                  : [...m, parsed as ChatMessageRow]
              );
            } else if (name === "error") {
              throw new Error(parsed.error);
            }
          }
        }
        onTurnComplete?.();
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            ...optimistic,
            id: `local-err-${Date.now()}`,
            role: "assistant",
            content: `Something went wrong: ${
              err instanceof Error ? err.message : "unknown error"
            }. Please try again.`,
          },
        ]);
      } finally {
        setAgentStatus(null);
      }
    },
    [agentStatus, onEventCreated, onTurnComplete, syncUrl, uiMode]
  );

  return { messages, agentStatus, eventId: eventIdRef.current, sendMessage, setMessages };
}
