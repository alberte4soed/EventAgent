"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  EmailAttachmentRow,
  EmailReplyRow,
  OutboundEmailRow,
  ReplyProposalRow,
  VenueRow,
  VendorCategory,
} from "@/lib/db/types";
import { CATEGORY_META } from "@/lib/journey";
import { ChipButton } from "@/components/ui/Chip";
import { useAssistant } from "@/components/assistant/AssistantProvider";
import { AttachmentGallery } from "./AttachmentGallery";

interface Props {
  eventId: string;
  replyAddress: string | null;
  initialVenues: VenueRow[];
  initialOutbound: OutboundEmailRow[];
  initialReplies: EmailReplyRow[];
  initialAttachments: EmailAttachmentRow[];
  initialProposals: ReplyProposalRow[];
}

function upsertById<T extends { id: string }>(rows: T[], row: T): T[] {
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx === -1) return [...rows, row];
  const next = rows.slice();
  next[idx] = row;
  return next;
}

interface ThreadMessage {
  id: string;
  direction: "out" | "in";
  body: string;
  at: string;
  attachments?: EmailAttachmentRow[];
  reply?: EmailReplyRow;
}

export function OutreachInbox({
  eventId,
  replyAddress,
  initialVenues,
  initialOutbound,
  initialReplies,
  initialAttachments,
  initialProposals,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [venues, setVenues] = useState(initialVenues);
  const [outbound, setOutbound] = useState(initialOutbound);
  const [replies, setReplies] = useState(initialReplies);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [proposals, setProposals] = useState(initialProposals);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<VendorCategory | "all">("all");
  const [showFiles, setShowFiles] = useState(false);

  // Realtime: new replies (cron), proposals, our sent replies, attachments.
  useEffect(() => {
    const channel = supabase
      .channel(`outreach-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "outbound_emails", filter: `event_id=eq.${eventId}` },
        (p) => setOutbound((r) => upsertById(r, p.new as OutboundEmailRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_replies", filter: `event_id=eq.${eventId}` },
        (p) => setReplies((r) => upsertById(r, p.new as EmailReplyRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reply_proposals", filter: `event_id=eq.${eventId}` },
        (p) => setProposals((r) => upsertById(r, p.new as ReplyProposalRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_attachments", filter: `event_id=eq.${eventId}` },
        (p) => setAttachments((r) => upsertById(r, p.new as EmailAttachmentRow))
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, eventId]);

  // Contacted vendors = those with at least one outbound email.
  const threadVenueIds = useMemo(() => {
    const ids = new Set(outbound.map((o) => o.venue_id));
    return venues.filter((v) => ids.has(v.id));
  }, [outbound, venues]);

  const visibleVendors =
    categoryFilter === "all"
      ? threadVenueIds
      : threadVenueIds.filter((v) => v.category === categoryFilter);

  const attachmentsByReply = useMemo(() => {
    const map = new Map<string, EmailAttachmentRow[]>();
    for (const a of attachments) {
      map.set(a.email_reply_id, [...(map.get(a.email_reply_id) ?? []), a]);
    }
    return map;
  }, [attachments]);

  const unreadByVenue = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of replies) {
      if (!r.read_at) map.set(r.venue_id, (map.get(r.venue_id) ?? 0) + 1);
    }
    return map;
  }, [replies]);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId) ?? null;

  const buildThread = useCallback(
    (venueId: string): ThreadMessage[] => {
      const outs: ThreadMessage[] = outbound
        .filter((o) => o.venue_id === venueId)
        .map((o) => ({
          id: `out-${o.id}`,
          direction: "out" as const,
          body: o.body,
          at: o.sent_at ?? o.created_at,
        }));
      const ins: ThreadMessage[] = replies
        .filter((r) => r.venue_id === venueId)
        .map((r) => ({
          id: `in-${r.id}`,
          direction: "in" as const,
          body: r.body ?? r.snippet ?? "",
          at: r.received_at ?? r.created_at,
          attachments: attachmentsByReply.get(r.id),
          reply: r,
        }));
      return [...outs, ...ins].sort((a, b) => a.at.localeCompare(b.at));
    },
    [outbound, replies, attachmentsByReply]
  );

  // Mark a venue's unread replies as read when opened.
  const markRead = useCallback(
    async (venueId: string) => {
      const unread = replies.filter((r) => r.venue_id === venueId && !r.read_at);
      if (unread.length === 0) return;
      const now = new Date().toISOString();
      setReplies((rs) =>
        rs.map((r) => (r.venue_id === venueId && !r.read_at ? { ...r, read_at: now } : r))
      );
      await Promise.all(
        unread.map((r) => fetch(`/api/replies/${r.id}/read`, { method: "POST" }))
      );
    },
    [replies]
  );

  function openThread(venueId: string) {
    setSelectedVenueId(venueId);
    setShowFiles(false);
    void markRead(venueId);
  }

  const activeCategories = useMemo(() => {
    const set = new Set<VendorCategory>();
    for (const v of threadVenueIds) set.add(v.category);
    return [...set];
  }, [threadVenueIds]);

  return (
    <div className="flex min-h-0 flex-1">
      {/* Thread list */}
      <aside className="flex w-[340px] shrink-0 flex-col border-r border-[#D4D6C0]">
        <div className="border-b border-[#D4D6C0] px-4 py-3">
          {replyAddress && (
            <ReplyAddressChip address={replyAddress} />
          )}
          {activeCategories.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <ChipButton
                label="All"
                selected={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
              />
              {activeCategories.map((c) => {
                const meta = c === "venue" ? null : CATEGORY_META[c];
                return (
                  <ChipButton
                    key={c}
                    label={meta ? meta.label : "Venue"}
                    emoji={meta?.emoji}
                    selected={categoryFilter === c}
                    onClick={() => setCategoryFilter(c)}
                  />
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setShowFiles(true);
              setSelectedVenueId(null);
            }}
            className={`mt-3 w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
              showFiles
                ? "border-[#4A4E3C] bg-[#c2b280] text-[#4A4E3C]"
                : "border-[#D4D6C0] text-[#656952] hover:bg-[#ece8db]"
            }`}
          >
            📎 All files vendors sent ({attachments.length})
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {visibleVendors.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#8a8568]">
              No outreach yet. Like some vendors and ask Ava to reach out.
            </p>
          ) : (
            visibleVendors.map((v) => {
              const thread = buildThread(v.id);
              const last = thread[thread.length - 1];
              const unread = unreadByVenue.get(v.id) ?? 0;
              const meta = v.category === "venue" ? null : CATEGORY_META[v.category];
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => openThread(v.id)}
                  className={`flex w-full items-start gap-3 border-b border-[#e5e2d5] px-4 py-3 text-left transition ${
                    selectedVenueId === v.id ? "bg-[#ece8db]" : "hover:bg-[#f0ece0]"
                  }`}
                >
                  <div
                    className={`mt-1 size-9 shrink-0 rounded-lg bg-cover bg-center ${
                      v.image_url ? "" : "bg-gradient-to-br from-[#e0dac7] to-[#C4C8AE]"
                    }`}
                    style={v.image_url ? { backgroundImage: `url('${v.image_url}')` } : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-[#4A4E3C]">
                        {v.name}
                      </span>
                      {unread > 0 && (
                        <span className="size-2 shrink-0 rounded-full bg-[#a8483a]" />
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {meta && (
                        <span className="text-[10.5px] text-[#8a8568]">{meta.emoji} {meta.label}</span>
                      )}
                      {v.booked_at && (
                        <span className="rounded-full bg-[#c2b280] px-1.5 text-[10px] font-medium text-[#4A4E3C]">
                          Booked
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[11.5px] text-[#8a8568]">
                      {last ? `${last.direction === "out" ? "You: " : ""}${last.body.slice(0, 60)}` : "No messages"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Detail */}
      <section className="min-h-0 flex-1 overflow-y-auto bg-[#F6F0E8]">
        {showFiles ? (
          <AllFilesView venues={venues} attachments={attachments} />
        ) : selectedVenue ? (
          <ThreadDetail
            venue={selectedVenue}
            messages={buildThread(selectedVenue.id)}
            proposals={proposals.filter((p) => p.venue_id === selectedVenue.id)}
            onVenueBooked={(row) => setVenues((vs) => upsertById(vs, row))}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-sm text-[#8a8568]">
            <div>
              <p className="text-3xl">📨</p>
              <p className="mt-3 max-w-xs">
                Select a vendor to see the conversation, their replies, and any files
                they sent. Ava drafts a response to every reply for you to approve.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ReplyAddressChip({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(address).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          },
          () => {}
        );
      }}
      className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#D4D6C0] bg-[#F6F0E8] px-3 py-2 text-left"
      title="Vendors reply to this address"
    >
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-[1px] text-[#8a8568]">
          Replies come to
        </span>
        <span className="block truncate text-[12px] font-medium text-[#4A4E3C]">
          {address}
        </span>
      </span>
      <span className="shrink-0 text-[11px] text-[#8a8568]">{copied ? "✓" : "copy"}</span>
    </button>
  );
}

function ThreadDetail({
  venue,
  messages,
  proposals,
  onVenueBooked,
}: {
  venue: VenueRow;
  messages: ThreadMessage[];
  proposals: ReplyProposalRow[];
  onVenueBooked: (v: VenueRow) => void;
}) {
  const latestReply = [...messages].reverse().find((m) => m.direction === "in")?.reply;
  const activeProposal = proposals
    .filter((p) => p.status === "proposed" && p.email_reply_id === latestReply?.id)
    .slice(-1)[0];
  const meta = venue.category === "venue" ? null : CATEGORY_META[venue.category];

  async function markBooked() {
    const res = await fetch(`/api/venues/${venue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booked: true }),
    });
    if (res.ok) onVenueBooked((await res.json()) as VenueRow);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D4D6C0] bg-[#F6F0E8]/90 px-6 py-3 backdrop-blur">
        <div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-[-0.4px] text-[#4A4E3C]">
            {venue.name}
          </h2>
          <p className="text-xs text-[#8a8568]">
            {meta ? `${meta.emoji} ${meta.label}` : "Venue"}
            {venue.rating != null ? ` · ★ ${Number(venue.rating).toFixed(1)}` : ""}
          </p>
        </div>
        {venue.booked_at ? (
          <span className="rounded-full bg-[#c2b280] px-3 py-1.5 text-xs font-semibold text-[#4A4E3C]">
            Booked 🎉
          </span>
        ) : (
          <button
            type="button"
            onClick={markBooked}
            className="rounded-full border border-[#4A4E3C] px-3.5 py-1.5 text-xs font-medium text-[#4A4E3C] transition hover:bg-[#c2b280]"
          >
            Mark booked
          </button>
        )}
      </header>

      <div className="flex-1 space-y-3 px-6 py-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                m.direction === "out"
                  ? "bg-[#4A4E3C] text-[#F6F0E8]"
                  : "border border-[#D4D6C0] bg-[#F6F0E8] text-[#4A4E3C]"
              }`}
            >
              <p className="whitespace-pre-wrap text-[13.5px] leading-[1.55]">{m.body}</p>
              {m.reply?.quote?.summary && (
                <div className="mt-2 rounded-lg bg-[#ece8db] px-3 py-2 text-[12px] text-[#656952]">
                  💬 {m.reply.quote.summary}
                  {m.reply.quote.price_amount != null && (
                    <span className="ml-1 font-semibold text-[#4A4E3C]">
                      {m.reply.quote.price_amount.toLocaleString()} {m.reply.quote.currency ?? ""}
                    </span>
                  )}
                </div>
              )}
              {m.attachments && m.attachments.length > 0 && (
                <AttachmentGallery attachments={m.attachments} />
              )}
            </div>
          </div>
        ))}
      </div>

      {activeProposal && latestReply && (
        <ProposalCard
          key={activeProposal.id}
          replyId={latestReply.id}
          proposal={activeProposal}
          venueName={venue.name}
        />
      )}
    </div>
  );
}

function ProposalCard({
  replyId,
  proposal,
  venueName,
}: {
  replyId: string;
  proposal: ReplyProposalRow;
  venueName: string;
}) {
  const { openWithPrompt } = useAssistant();
  const [body, setBody] = useState(proposal.body);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    setBusy(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) setSent(true);
    } finally {
      setBusy(false);
    }
  }

  async function dismiss() {
    setBusy(true);
    try {
      await fetch(`/api/proposals/${proposal.id}/dismiss`, { method: "POST" });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/replies/${replyId}/propose`, { method: "POST" });
      if (res.ok) {
        const fresh = (await res.json()) as ReplyProposalRow;
        setBody(fresh.body);
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="sticky bottom-0 border-t border-[#D4D6C0] bg-[#ece8db] px-6 py-3 text-xs font-medium text-[#7A8066]">
        Reply handled ✓
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 border-t border-[#D4D6C0] bg-[#ece8db] px-6 py-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#4A4E3C]">
          Ava&apos;s suggested reply
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={regenerate}
          className="text-[11px] text-[#7A8066] underline-offset-2 hover:underline disabled:opacity-50"
        >
          Regenerate
        </button>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        className="w-full rounded-xl border border-[#D4D6C0] bg-[#F6F0E8] px-4 py-3 text-[13.5px] leading-relaxed outline-none transition focus:border-[#4A4E3C]"
      />
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={busy || !body.trim()}
          onClick={send}
          className="rounded-full bg-[#4A4E3C] px-4 py-2 text-xs font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47] disabled:opacity-50"
        >
          {busy ? "Sending…" : "Approve & send"}
        </button>
        <button
          type="button"
          onClick={() =>
            openWithPrompt(
              `Let's talk about ${venueName}'s reply before I send anything.`,
              { contextReplyId: replyId }
            )
          }
          className="rounded-full border border-[#D4D6C0] px-4 py-2 text-xs text-[#656952] transition hover:bg-[#ddd6c0]"
        >
          Discuss with Ava
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={dismiss}
          className="rounded-full px-3 py-2 text-xs text-[#8a8568] transition hover:text-[#4A4E3C] disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function AllFilesView({
  venues,
  attachments,
}: {
  venues: VenueRow[];
  attachments: EmailAttachmentRow[];
}) {
  const byVenue = useMemo(() => {
    const map = new Map<string, EmailAttachmentRow[]>();
    for (const a of attachments) {
      map.set(a.venue_id, [...(map.get(a.venue_id) ?? []), a]);
    }
    return map;
  }, [attachments]);

  if (attachments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center text-sm text-[#8a8568]">
        <div>
          <p className="text-3xl">📎</p>
          <p className="mt-3 max-w-xs">
            Files vendors send you — venue photos, brochures, menus — will collect here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.4px] text-[#4A4E3C]">
        Files from vendors
      </h2>
      <div className="mt-5 space-y-6">
        {[...byVenue.entries()].map(([venueId, files]) => {
          const venue = venues.find((v) => v.id === venueId);
          return (
            <div key={venueId}>
              <p className="mb-2 text-sm font-semibold text-[#4A4E3C]">
                {venue?.name ?? "Vendor"}
              </p>
              <AttachmentGallery attachments={files} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
