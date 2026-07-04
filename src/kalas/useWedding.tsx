"use client";

/* The real data layer for the Kalas app. Loads the signed-in couple's actual
   wedding (event + venues + outreach + replies + proposals + invites) via the
   browser Supabase client and exposes it — plus a `couple` adapter shaped like
   the old mock `data.ts` so screens can read real data with minimal changes.
   Screens that have no backend yet keep reading data.ts. */

import * as React from "react";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeJourney, type JourneyStage } from "@/lib/journey";
import type {
  EmailDraftRow,
  EmailReplyRow,
  EventRow,
  InviteDesignRow,
  InviteOrderRow,
  OutboundEmailRow,
  ProfileRow,
  ReplyProposalRow,
  VendorCategory,
  VenueRow,
} from "@/lib/db/types";

/** Adapter shaped like the old mock `couple` so screens swap in easily. */
export interface Couple {
  a: string;
  b: string;
  dateISO: string | null;
  dateLabel: string;
  guests: number;
  budgetTotal: number;
  region: string;
  style: string;
  email: string;
}

interface WeddingData {
  loading: boolean;
  hasWedding: boolean;
  event: EventRow | null;
  profile: ProfileRow | null;
  couple: Couple;
  venues: VenueRow[];
  drafts: EmailDraftRow[];
  outbound: OutboundEmailRow[];
  replies: EmailReplyRow[];
  proposals: ReplyProposalRow[];
  inviteOrders: InviteOrderRow[];
  inviteDesigns: InviteDesignRow[];
  journey: JourneyStage[];
  refresh: () => Promise<void>;
}

const FALLBACK_COUPLE: Couple = {
  a: "",
  b: "",
  dateISO: null,
  dateLabel: "",
  guests: 0,
  budgetTotal: 0,
  region: "",
  style: "",
  email: "",
};

const Ctx = createContext<WeddingData | null>(null);

function upsertById<T extends { id: string }>(rows: T[], row: T): T[] {
  const i = rows.findIndex((x) => x.id === row.id);
  if (i === -1) return [...rows, row];
  const next = rows.slice();
  next[i] = row;
  return next;
}

function parseBudget(text: string | null): number {
  if (!text) return 0;
  const digits = text.replace(/[^\d]/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
}

function toCouple(
  event: EventRow | null,
  profile: ProfileRow | null,
  email: string
): Couple {
  if (!event) return { ...FALLBACK_COUPLE, email };
  const a = (profile?.display_name ?? event.title).split(/\s+/)[0] || "";
  const b = profile?.partner_name?.split(/\s+/)[0] ?? "";
  const dateISO = event.event_date;
  const dateLabel = dateISO
    ? new Date(dateISO).toLocaleDateString("da-DK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : event.date_hint ?? "Dato ikke fastsat";
  const style =
    (typeof event.requirements?.description === "string"
      ? (event.requirements.description as string)
      : Array.isArray(event.requirements?.vibes)
        ? (event.requirements.vibes as string[]).join(", ")
        : "") || "";
  return {
    a,
    b,
    dateISO,
    dateLabel,
    guests: event.guest_count ?? 0,
    budgetTotal: parseBudget(event.budget),
    region: event.location ?? "",
    style,
    email,
  };
}

export function WeddingProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [email, setEmail] = useState("");
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [drafts, setDrafts] = useState<EmailDraftRow[]>([]);
  const [outbound, setOutbound] = useState<OutboundEmailRow[]>([]);
  const [replies, setReplies] = useState<EmailReplyRow[]>([]);
  const [proposals, setProposals] = useState<ReplyProposalRow[]>([]);
  const [inviteOrders, setInviteOrders] = useState<InviteOrderRow[]>([]);
  const [inviteDesigns, setInviteDesigns] = useState<InviteDesignRow[]>([]);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setEmail(user.email ?? "");

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((profileRow as ProfileRow | null) ?? null);

    // The active wedding: profile pointer, else the most recent event.
    let ev: EventRow | null = null;
    const activeId = (profileRow as ProfileRow | null)?.active_event_id;
    if (activeId) {
      const { data } = await supabase.from("events").select("*").eq("id", activeId).maybeSingle();
      ev = (data as EventRow | null) ?? null;
    }
    if (!ev) {
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      ev = (data as EventRow | null) ?? null;
    }
    setEvent(ev);

    if (ev) {
      const [v, d, o, r, p, io, idz] = await Promise.all([
        supabase.from("venues").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("email_drafts").select("*").eq("event_id", ev.id),
        supabase.from("outbound_emails").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("email_replies").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("reply_proposals").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("invite_orders").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
        supabase.from("invite_designs").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
      ]);
      setVenues((v.data ?? []) as VenueRow[]);
      setDrafts((d.data ?? []) as EmailDraftRow[]);
      setOutbound((o.data ?? []) as OutboundEmailRow[]);
      setReplies((r.data ?? []) as EmailReplyRow[]);
      setProposals((p.data ?? []) as ReplyProposalRow[]);
      setInviteOrders((io.data ?? []) as InviteOrderRow[]);
      setInviteDesigns((idz.data ?? []) as InviteDesignRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: keep the wedding fresh as the agent/cron writes rows.
  useEffect(() => {
    if (!event?.id) return;
    const eventId = event.id;
    const channel = supabase
      .channel(`wedding-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "venues", filter: `event_id=eq.${eventId}` },
        (p) => setVenues((rows) => upsertById(rows, p.new as VenueRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_replies", filter: `event_id=eq.${eventId}` },
        (p) => setReplies((rows) => upsertById(rows, p.new as EmailReplyRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reply_proposals", filter: `event_id=eq.${eventId}` },
        (p) => setProposals((rows) => upsertById(rows, p.new as ReplyProposalRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "outbound_emails", filter: `event_id=eq.${eventId}` },
        (p) => setOutbound((rows) => upsertById(rows, p.new as OutboundEmailRow))
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, event?.id]);

  const journey = useMemo(() => {
    if (!event) return [];
    const likedVenues = venues.filter((v) => v.swipe_status === "liked").length;
    const quotesIn = replies.filter((r) => r.quote_status === "quoted").length;
    const bookedByCategory: Partial<Record<VendorCategory, number>> = {};
    const contactedByCategory: Partial<Record<VendorCategory, number>> = {};
    const contacted = new Set(outbound.map((o) => o.venue_id));
    for (const v of venues) {
      if (v.booked_at) bookedByCategory[v.category] = (bookedByCategory[v.category] ?? 0) + 1;
      if (contacted.has(v.id)) contactedByCategory[v.category] = (contactedByCategory[v.category] ?? 0) + 1;
    }
    return computeJourney(event, {
      likedVenues,
      quotesIn,
      inviteOrderStatus: inviteOrders[0]?.status ?? null,
      bookedByCategory,
      contactedByCategory,
      unreadReplies: replies.filter((r) => !r.read_at).length,
    });
  }, [event, venues, replies, outbound, inviteOrders]);

  const value = useMemo<WeddingData>(
    () => ({
      loading,
      hasWedding: Boolean(event),
      event,
      profile,
      couple: toCouple(event, profile, email),
      venues,
      drafts,
      outbound,
      replies,
      proposals,
      inviteOrders,
      inviteDesigns,
      journey,
      refresh: load,
    }),
    [loading, event, profile, email, venues, drafts, outbound, replies, proposals, inviteOrders, inviteDesigns, journey, load]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWedding(): WeddingData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWedding must be used inside <WeddingProvider>");
  return ctx;
}
