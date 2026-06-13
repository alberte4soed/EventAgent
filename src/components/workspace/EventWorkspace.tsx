"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatMessageRow,
  EmailDraftRow,
  EmailReplyRow,
  EventRow,
  OutboundEmailRow,
  VenueRow,
} from "@/lib/db/types";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { QuotesDashboard } from "@/components/quotes/QuotesDashboard";
import { VenueCanvas } from "@/components/workspace/VenueCanvas";

interface Props {
  initialEvent: EventRow | null;
  initialMessages: ChatMessageRow[];
  initialVenues: VenueRow[];
  initialDrafts: EmailDraftRow[];
  initialOutbound: OutboundEmailRow[];
  initialReplies: EmailReplyRow[];
  gmailConnected: boolean;
  initialPrompt?: string | null;
}

function upsertById<T extends { id: string }>(rows: T[], row: T): T[] {
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx === -1) return [...rows, row];
  const next = rows.slice();
  next[idx] = row;
  return next;
}

export function EventWorkspace({
  initialEvent,
  initialMessages,
  initialVenues,
  initialDrafts,
  initialOutbound,
  initialReplies,
  gmailConnected,
  initialPrompt = null,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [event, setEvent] = useState<EventRow | null>(initialEvent);
  const [messages, setMessages] = useState<ChatMessageRow[]>(initialMessages);
  const [venues, setVenues] = useState<VenueRow[]>(initialVenues);
  const [drafts, setDrafts] = useState<EmailDraftRow[]>(initialDrafts);
  const [outbound, setOutbound] = useState<OutboundEmailRow[]>(initialOutbound);
  const [replies, setReplies] = useState<EmailReplyRow[]>(initialReplies);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "quotes">("chat");
  const eventIdRef = useRef<string | null>(initialEvent?.id ?? null);

  // ── Realtime: live updates for replies (cron), venues, event status ──
  useEffect(() => {
    const eventId = event?.id;
    if (!eventId) return;
    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_replies", filter: `event_id=eq.${eventId}` },
        (p) => setReplies((rows) => upsertById(rows, p.new as EmailReplyRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "outbound_emails", filter: `event_id=eq.${eventId}` },
        (p) => setOutbound((rows) => upsertById(rows, p.new as OutboundEmailRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "venues", filter: `event_id=eq.${eventId}` },
        (p) => setVenues((rows) => upsertById(rows, p.new as VenueRow))
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, event?.id]);

  const refreshEvent = useCallback(async () => {
    const id = eventIdRef.current;
    if (!id) return;
    const { data } = await supabase.from("events").select("*").eq("id", id).single();
    if (data) setEvent(data as EventRow);
  }, [supabase]);

  const refreshSideData = useCallback(async () => {
    const id = eventIdRef.current;
    if (!id) return;
    const [{ data: v }, { data: d }] = await Promise.all([
      supabase.from("venues").select("*").eq("event_id", id).order("created_at"),
      supabase.from("email_drafts").select("*").eq("event_id", id),
    ]);
    if (v) setVenues(v as VenueRow[]);
    if (d) setDrafts(d as EmailDraftRow[]);
  }, [supabase]);

  // ── Chat: send a message, consume the SSE stream ────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
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
          body: JSON.stringify({ eventId: eventIdRef.current ?? undefined, message: trimmed }),
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
              // Make the URL shareable without remounting the page.
              window.history.replaceState(null, "", `/events/${parsed.eventId}`);
            } else if (name === "status") {
              setAgentStatus(parsed.status);
            } else if (name === "message") {
              setMessages((m) => [...m, parsed as ChatMessageRow]);
            } else if (name === "error") {
              throw new Error(parsed.error);
            }
          }
        }
        await Promise.all([refreshEvent(), refreshSideData()]);
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            ...optimistic,
            id: `local-err-${Date.now()}`,
            role: "assistant",
            content: `Something went wrong: ${err instanceof Error ? err.message : "unknown error"}. Please try again.`,
          },
        ]);
      } finally {
        setAgentStatus(null);
      }
    },
    [agentStatus, refreshEvent, refreshSideData]
  );

  // Auto-send a quick-start prompt (from the home dashboard) exactly once.
  const firedInitialRef = useRef(false);
  useEffect(() => {
    if (initialPrompt && !firedInitialRef.current && messages.length === 0) {
      firedInitialRef.current = true;
      sendMessage(initialPrompt);
    }
  }, [initialPrompt, messages.length, sendMessage]);

  // ── Swipes ───────────────────────────────────────────────────────────
  const swipedDecksRef = useRef<Set<string>>(new Set());
  const handleSwipe = useCallback(
    async (venueId: string, decision: "liked" | "rejected") => {
      setVenues((rows) =>
        rows.map((v) => (v.id === venueId ? { ...v, swipe_status: decision } : v))
      );
      await fetch(`/api/venues/${venueId}/swipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
    },
    []
  );

  const handleDeckFinished = useCallback(
    (messageId: string, liked: number, rejected: number) => {
      // Drive the agent to the email-draft step exactly once per deck.
      if (swipedDecksRef.current.has(messageId)) return;
      swipedDecksRef.current.add(messageId);
      sendMessage(
        `I finished swiping: ${liked} venue${liked === 1 ? "" : "s"} liked, ${rejected} rejected. Let's draft the quote-request email.`
      );
    },
    [sendMessage]
  );

  // ── Draft approval ───────────────────────────────────────────────────
  const [approving, setApproving] = useState(false);
  const handleApproveDraft = useCallback(
    async (draftId: string) => {
      setApproving(true);
      setAgentStatus("Sending emails through your Gmail…");
      try {
        const res = await fetch(`/api/drafts/${draftId}/approve`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error === "gmail_not_connected"
              ? "Gmail isn't connected — connect it in Settings first."
              : data.error ?? "Sending failed"
          );
        }
        // The route writes a summary chat message; pull fresh state.
        const id = eventIdRef.current;
        if (id) {
          const { data: msgs } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("event_id", id)
            .order("created_at", { ascending: true });
          if (msgs) setMessages(msgs as ChatMessageRow[]);
          const { data: o } = await supabase
            .from("outbound_emails")
            .select("*")
            .eq("event_id", id);
          if (o) setOutbound(o as OutboundEmailRow[]);
        }
        await Promise.all([refreshEvent(), refreshSideData()]);
        setTab("quotes");
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            id: `local-err-${Date.now()}`,
            event_id: eventIdRef.current ?? "",
            user_id: "",
            role: "assistant",
            content: err instanceof Error ? err.message : "Sending failed.",
            payload: null,
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setApproving(false);
        setAgentStatus(null);
      }
    },
    [supabase, refreshEvent, refreshSideData]
  );

  const quoteCount = replies.filter((r) => r.quote_status === "quoted").length;

  const activeVenueBatch = useMemo(() => {
    const msg = [...messages].reverse().find((m) => m.payload?.kind === "venue_batch");
    if (!msg || msg.payload?.kind !== "venue_batch") return null;
    return {
      messageId: msg.id,
      venueIds: msg.payload.venue_ids,
    };
  }, [messages]);

  const batchVenues = useMemo(() => {
    if (!activeVenueBatch) return [];
    return venues.filter((v) => activeVenueBatch.venueIds.includes(v.id));
  }, [venues, activeVenueBatch]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {!gmailConnected && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs text-amber-800">
          Gmail isn&apos;t connected yet — you can chat and swipe, but connect it in{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>{" "}
          before sending quote requests.
        </div>
      )}

      {tab === "quotes" ? (
        <>
          <header className="flex shrink-0 items-center gap-3 border-b border-[#D4D6C0] bg-[#F6F0E8] px-6 py-4">
            <button
              type="button"
              onClick={() => setTab("chat")}
              className="text-sm text-[#8a8568] transition hover:text-[#4A4E3C]"
            >
              ← Back to workspace
            </button>
            <h1 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[#4A4E3C]">
              Quotes
            </h1>
          </header>
          <QuotesDashboard venues={venues} outbound={outbound} replies={replies} />
        </>
      ) : (
        <div className="flex min-h-0 flex-1">
          <ChatPanel
            messages={messages}
            venues={venues}
            drafts={drafts}
            agentStatus={agentStatus}
            approving={approving}
            quoteCount={quoteCount}
            onSend={sendMessage}
            onApproveDraft={handleApproveDraft}
            onOpenQuotes={() => setTab("quotes")}
          />
          <VenueCanvas
            event={event}
            venues={batchVenues}
            drafts={drafts}
            messageId={activeVenueBatch?.messageId ?? null}
            gmailConnected={gmailConnected}
            onSwipe={handleSwipe}
            onDeckFinished={handleDeckFinished}
            onOpenQuotes={() => setTab("chat")}
          />
        </div>
      )}
    </div>
  );
}
