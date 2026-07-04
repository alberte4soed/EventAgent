"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAgentChat } from "@/lib/hooks/useAgentChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import type { ChatMessageRow } from "@/lib/db/types";

// Routes with their own full chat, or pre-auth — no floating assistant.
const HIDDEN_EXACT = new Set(["/", "/login", "/onboarding", "/events/new"]);
function isHidden(pathname: string): boolean {
  if (HIDDEN_EXACT.has(pathname)) return true;
  // The event workspace (exactly /events/[id]) already has full chat.
  if (/^\/events\/[^/]+$/.test(pathname)) return true;
  return false;
}

/** Active event id from the path when under /events/[id]/…, else null. */
function eventIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/events\/([^/]+)/);
  return m ? m[1] : null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingRef: MutableRefObject<{ prompt: string; ctx?: { contextReplyId?: string } } | null>;
  pendingVersion: number;
}

export function AssistantSidebar({ open, onOpenChange, pendingRef, pendingVersion }: Props) {
  const pathname = usePathname() ?? "/";
  const hidden = isHidden(pathname);

  const [eventId, setEventId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessageRow[]>([]);
  const [ready, setReady] = useState(false);

  // Resolve the bound event: path first, else the profile's active wedding.
  // The Supabase browser client is created inside the effect so it never runs
  // during SSR/prerender (where public env vars may be absent).
  useEffect(() => {
    if (hidden) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const fromPath = eventIdFromPath(pathname);
      let id = fromPath;
      if (!id) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("active_event_id")
            .eq("user_id", user.id)
            .maybeSingle();
          id = (profile?.active_event_id as string | null) ?? null;
          if (!id) {
            const { data: latest } = await supabase
              .from("events")
              .select("id")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            id = (latest?.id as string | null) ?? null;
          }
        }
      }
      if (cancelled) return;
      setEventId(id);
      if (id) {
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("event_id", id)
          .order("created_at", { ascending: false })
          .limit(30);
        if (!cancelled) {
          setInitialMessages(((msgs ?? []) as ChatMessageRow[]).reverse());
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, hidden]);

  if (hidden) return null;

  return (
    <>
      {/* Floating toggle */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label="Open Ava"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-[#4A4E3C] text-[#F6F0E8] shadow-[0px_6px_20px_rgba(74,78,60,0.4)] transition hover:bg-[#575B47]"
      >
        <span className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">a</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-[#dbd5c2] bg-[#ece8db] shadow-[-8px_0_40px_rgba(74,78,60,0.15)]"
            >
              <AssistantPanel
                key={eventId ?? "none"}
                eventId={eventId}
                ready={ready}
                initialMessages={initialMessages}
                onClose={() => onOpenChange(false)}
                pendingRef={pendingRef}
                pendingVersion={pendingVersion}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function AssistantPanel({
  eventId,
  ready,
  initialMessages,
  onClose,
  pendingRef,
  pendingVersion,
}: {
  eventId: string | null;
  ready: boolean;
  initialMessages: ChatMessageRow[];
  onClose: () => void;
  pendingRef: MutableRefObject<{ prompt: string; ctx?: { contextReplyId?: string } } | null>;
  pendingVersion: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { messages, agentStatus, sendMessage, setMessages } = useAgentChat({
    initialEventId: eventId,
    initialMessages,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live updates from other surfaces (cron replies, workspace turns).
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`assistant-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `event_id=eq.${eventId}` },
        (p) => {
          const row = p.new as ChatMessageRow;
          setMessages((m) => (m.some((x) => x.id === row.id) ? m : [...m, row]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, eventId, setMessages]);

  // Fire a pending openWithPrompt exactly once per request.
  const lastPending = useRef(0);
  useEffect(() => {
    if (pendingVersion > lastPending.current && pendingRef.current && ready) {
      lastPending.current = pendingVersion;
      const { prompt, ctx } = pendingRef.current;
      pendingRef.current = null;
      sendMessage(prompt, ctx);
    }
  }, [pendingVersion, ready, pendingRef, sendMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, agentStatus]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-[#dbd5c2] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full border border-[#dbd5c2] bg-[#F6F0E8] font-[family-name:var(--font-fraunces)] text-[13px] font-semibold text-[#4A4E3C]">
            a
          </span>
          <span className="font-[family-name:var(--font-fraunces)] text-[15px] font-semibold text-[#4A4E3C]">
            Ava
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-[#8a8568] transition hover:bg-[#ddd6c0]"
        >
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="size-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!eventId ? (
          <p className="mt-8 text-center text-sm text-[#8a8568]">
            Start planning a wedding and Ava will pick up the thread here.
          </p>
        ) : (
          <>
            {messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => (
                <MessageBubble key={m.id} message={m} compact />
              ))}
            {agentStatus && (
              <p className="ml-10 text-xs italic text-[#8a8568]">{agentStatus}</p>
            )}
          </>
        )}
      </div>

      {eventId && <ChatInput disabled={agentStatus !== null} onSend={(t) => sendMessage(t)} />}
    </div>
  );
}
