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
import { resolveWeddingDate } from "@/lib/wedding-date";
import type {
  BudgetItemRow,
  EmailAttachmentRow,
  EmailDraftRow,
  EmailReplyRow,
  EventRow,
  GuestRow,
  InvitationRow,
  InviteDesignRow,
  InviteOrderRow,
  MoodboardItemRow,
  OutboundEmailRow,
  ProfileRow,
  RegistryClaimRow,
  RegistryItemRow,
  ReplyProposalRow,
  SeatingPlanRow,
  TimelineTaskRow,
  VendorCategory,
  VenueRow,
  WeddingSiteRow,
  WebsiteDesignRow,
  SitePhotoRow,
  WebsiteOrderRow,
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
  attachments: EmailAttachmentRow[];
  proposals: ReplyProposalRow[];
  inviteOrders: InviteOrderRow[];
  inviteDesigns: InviteDesignRow[];
  invitation: InvitationRow | null;
  journey: JourneyStage[];

  // Planning tables (migration 0007) — the couple's own editable data.
  budgetItems: BudgetItemRow[];
  guests: GuestRow[];
  timelineTasks: TimelineTaskRow[];
  moodboardItems: MoodboardItemRow[];
  weddingSite: WeddingSiteRow | null;
  seatingPlan: SeatingPlanRow | null;
  registryItems: RegistryItemRow[];
  registryClaims: RegistryClaimRow[];
  /** All generations, newest first; the active one drives the live site. */
  websiteDesigns: WebsiteDesignRow[];
  websiteDesign: WebsiteDesignRow | null;
  sitePhotos: SitePhotoRow[];
  websiteOrders: WebsiteOrderRow[];
  websitePaid: boolean;

  refresh: () => Promise<void>;
  updateEvent: (patch: Partial<EventRow>) => Promise<void>;

  saveBudgetItem: (item: { category: string; label: string; planned_amount?: number; paid_amount?: number; sort?: number }) => Promise<void>;
  deleteBudgetItem: (category: string) => Promise<void>;

  addGuest: (guest: Partial<GuestRow> & { name: string }) => Promise<GuestRow | null>;
  updateGuest: (id: string, patch: Partial<GuestRow>) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;

  addTask: (task: { title: string; due_date?: string | null; category?: string | null; sort?: number; done?: boolean }) => Promise<TimelineTaskRow | null>;
  updateTask: (id: string, patch: Partial<TimelineTaskRow>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  seedTasks: (tasks: { title: string; due_date?: string | null; category?: string | null; done?: boolean; sort?: number }[]) => Promise<void>;

  addMoodboardItem: (item: { image_key?: string | null; image_url?: string | null; note?: string | null }) => Promise<MoodboardItemRow | null>;
  removeMoodboardItem: (id: string) => Promise<void>;

  saveSite: (patch: { config?: Record<string, unknown>; domain?: string | null; published?: boolean }) => Promise<void>;
  saveInvite: (patch: { config?: Record<string, unknown>; slug?: string | null; published?: boolean }) => Promise<void>;
  saveSeating: (data: Record<string, unknown>) => Promise<void>;

  addRegistryItem: (item: Partial<RegistryItemRow> & { title: string }) => Promise<RegistryItemRow | null>;
  updateRegistryItem: (id: string, patch: Partial<RegistryItemRow>) => Promise<void>;
  deleteRegistryItem: (id: string) => Promise<void>;
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

function removeById<T extends { id: string }>(rows: T[], id: string): T[] {
  return rows.filter((x) => x.id !== id);
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
  const dateISO = event.event_date ?? resolveWeddingDate(event).iso;
  const dateLabel = event.event_date
    ? new Date(event.event_date).toLocaleDateString("da-DK", {
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
  const [attachments, setAttachments] = useState<EmailAttachmentRow[]>([]);
  const [proposals, setProposals] = useState<ReplyProposalRow[]>([]);
  const [inviteOrders, setInviteOrders] = useState<InviteOrderRow[]>([]);
  const [inviteDesigns, setInviteDesigns] = useState<InviteDesignRow[]>([]);
  const [invitation, setInvitation] = useState<InvitationRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItemRow[]>([]);
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [timelineTasks, setTimelineTasks] = useState<TimelineTaskRow[]>([]);
  const [moodboardItems, setMoodboardItems] = useState<MoodboardItemRow[]>([]);
  const [weddingSite, setWeddingSite] = useState<WeddingSiteRow | null>(null);
  const [seatingPlan, setSeatingPlan] = useState<SeatingPlanRow | null>(null);
  const [registryItems, setRegistryItems] = useState<RegistryItemRow[]>([]);
  const [registryClaims, setRegistryClaims] = useState<RegistryClaimRow[]>([]);
  const [websiteDesigns, setWebsiteDesigns] = useState<WebsiteDesignRow[]>([]);
  const [sitePhotos, setSitePhotos] = useState<SitePhotoRow[]>([]);
  const [websiteOrders, setWebsiteOrders] = useState<WebsiteOrderRow[]>([]);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setEmail(user.email ?? "");
    setUserId(user.id);

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
      const [v, d, o, r, at, p, io, idz, bi, g, tt, mb, ws, sp, ri, rc, wd, sph, wo, inv] = await Promise.all([
        supabase.from("venues").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("email_drafts").select("*").eq("event_id", ev.id),
        supabase.from("outbound_emails").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("email_replies").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("email_attachments").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("reply_proposals").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("invite_orders").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
        supabase.from("invite_designs").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
        supabase.from("budget_items").select("*").eq("event_id", ev.id).order("sort"),
        supabase.from("guests").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("timeline_tasks").select("*").eq("event_id", ev.id).order("sort").order("due_date"),
        supabase.from("moodboard_items").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
        supabase.from("wedding_sites").select("*").eq("event_id", ev.id).maybeSingle(),
        supabase.from("seating_plans").select("*").eq("event_id", ev.id).maybeSingle(),
        supabase.from("registry_items").select("*").eq("event_id", ev.id).order("sort"),
        supabase.from("registry_claims").select("*").eq("event_id", ev.id).order("created_at"),
        supabase.from("website_designs").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
        supabase.from("site_photos").select("*").eq("event_id", ev.id).order("sort").order("created_at"),
        supabase.from("website_orders").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
        supabase.from("invitations").select("*").eq("event_id", ev.id).maybeSingle(),
      ]);
      setVenues((v.data ?? []) as VenueRow[]);
      setDrafts((d.data ?? []) as EmailDraftRow[]);
      setOutbound((o.data ?? []) as OutboundEmailRow[]);
      setReplies((r.data ?? []) as EmailReplyRow[]);
      setAttachments((at.data ?? []) as EmailAttachmentRow[]);
      setProposals((p.data ?? []) as ReplyProposalRow[]);
      setInviteOrders((io.data ?? []) as InviteOrderRow[]);
      setInviteDesigns((idz.data ?? []) as InviteDesignRow[]);
      setBudgetItems((bi.data ?? []) as BudgetItemRow[]);
      setGuests((g.data ?? []) as GuestRow[]);
      setTimelineTasks((tt.data ?? []) as TimelineTaskRow[]);
      setMoodboardItems((mb.data ?? []) as MoodboardItemRow[]);
      setWeddingSite((ws.data as WeddingSiteRow | null) ?? null);
      setSeatingPlan((sp.data as SeatingPlanRow | null) ?? null);
      setRegistryItems((ri.data ?? []) as RegistryItemRow[]);
      setRegistryClaims((rc.data ?? []) as RegistryClaimRow[]);
      setWebsiteDesigns((wd.data ?? []) as WebsiteDesignRow[]);
      setSitePhotos((sph.data ?? []) as SitePhotoRow[]);
      setWebsiteOrders((wo.data ?? []) as WebsiteOrderRow[]);
      setInvitation((inv.data as InvitationRow | null) ?? null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Mutators ────────────────────────────────────────────────────────────
  // Simple user-owned CRUD writes straight through the browser client (RLS
  // scopes every row to auth.uid()); local state updates optimistically from
  // the returned row, and realtime reconciles other tabs.
  const eventId = event?.id ?? null;

  const updateEvent = useCallback(
    async (patch: Partial<EventRow>) => {
      if (!eventId) return;
      const { data } = await supabase.from("events").update(patch).eq("id", eventId).select().single();
      if (data) setEvent(data as EventRow);
    },
    [supabase, eventId]
  );

  const saveBudgetItem = useCallback(
    async (item: { category: string; label: string; planned_amount?: number; paid_amount?: number; sort?: number }) => {
      if (!eventId || !userId) return;
      const existing = budgetItems.find((b) => b.category === item.category);
      if (existing) {
        const { data } = await supabase
          .from("budget_items")
          .update({
            label: item.label,
            planned_amount: item.planned_amount ?? existing.planned_amount,
            paid_amount: item.paid_amount ?? existing.paid_amount,
            sort: item.sort ?? existing.sort,
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (data) setBudgetItems((rows) => upsertById(rows, data as BudgetItemRow));
      } else {
        const { data } = await supabase
          .from("budget_items")
          .insert({
            event_id: eventId,
            user_id: userId,
            category: item.category,
            label: item.label,
            planned_amount: item.planned_amount ?? 0,
            paid_amount: item.paid_amount ?? 0,
            sort: item.sort ?? 0,
          })
          .select()
          .single();
        if (data) setBudgetItems((rows) => upsertById(rows, data as BudgetItemRow));
      }
    },
    [supabase, eventId, userId, budgetItems]
  );

  const deleteBudgetItem = useCallback(
    async (category: string) => {
      const existing = budgetItems.find((b) => b.category === category);
      if (!existing) return;
      await supabase.from("budget_items").delete().eq("id", existing.id);
      setBudgetItems((rows) => removeById(rows, existing.id));
    },
    [supabase, budgetItems]
  );

  const addGuest = useCallback(
    async (guest: Partial<GuestRow> & { name: string }) => {
      if (!eventId || !userId) return null;
      const { data } = await supabase
        .from("guests")
        .insert({
          event_id: eventId,
          user_id: userId,
          name: guest.name,
          side: guest.side ?? "Fælles",
          email: guest.email ?? null,
          phone: guest.phone ?? null,
          rsvp: guest.rsvp ?? "afventer",
          meal: guest.meal ?? null,
          plus_one: guest.plus_one ?? false,
          notes: guest.notes ?? null,
        })
        .select()
        .single();
      if (data) setGuests((rows) => upsertById(rows, data as GuestRow));
      return (data as GuestRow) ?? null;
    },
    [supabase, eventId, userId]
  );

  const updateGuest = useCallback(
    async (id: string, patch: Partial<GuestRow>) => {
      const { data } = await supabase.from("guests").update(patch).eq("id", id).select().single();
      if (data) setGuests((rows) => upsertById(rows, data as GuestRow));
    },
    [supabase]
  );

  const deleteGuest = useCallback(
    async (id: string) => {
      await supabase.from("guests").delete().eq("id", id);
      setGuests((rows) => removeById(rows, id));
    },
    [supabase]
  );

  const addTask = useCallback(
    async (task: { title: string; due_date?: string | null; category?: string | null; sort?: number; done?: boolean }) => {
      if (!eventId || !userId) return null;
      const { data } = await supabase
        .from("timeline_tasks")
        .insert({
          event_id: eventId,
          user_id: userId,
          title: task.title,
          due_date: task.due_date ?? null,
          category: task.category ?? null,
          sort: task.sort ?? 0,
          done: task.done ?? false,
        })
        .select()
        .single();
      if (data) setTimelineTasks((rows) => upsertById(rows, data as TimelineTaskRow));
      return (data as TimelineTaskRow) ?? null;
    },
    [supabase, eventId, userId]
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<TimelineTaskRow>) => {
      const { data } = await supabase.from("timeline_tasks").update(patch).eq("id", id).select().single();
      if (data) setTimelineTasks((rows) => upsertById(rows, data as TimelineTaskRow));
    },
    [supabase]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await supabase.from("timeline_tasks").delete().eq("id", id);
      setTimelineTasks((rows) => removeById(rows, id));
    },
    [supabase]
  );

  const seedTasks = useCallback(
    async (tasks: { title: string; due_date?: string | null; category?: string | null; done?: boolean; sort?: number }[]) => {
      if (!eventId || !userId || tasks.length === 0) return;
      const rows = tasks.map((t, i) => ({
        event_id: eventId,
        user_id: userId,
        title: t.title,
        due_date: t.due_date ?? null,
        category: t.category ?? null,
        done: t.done ?? false,
        sort: t.sort ?? i,
      }));
      const { data } = await supabase.from("timeline_tasks").insert(rows).select();
      if (data) setTimelineTasks((prev) => (data as TimelineTaskRow[]).reduce((acc, r) => upsertById(acc, r), prev));
    },
    [supabase, eventId, userId]
  );

  const addMoodboardItem = useCallback(
    async (item: { image_key?: string | null; image_url?: string | null; note?: string | null }) => {
      if (!eventId || !userId) return null;
      const { data } = await supabase
        .from("moodboard_items")
        .insert({
          event_id: eventId,
          user_id: userId,
          image_key: item.image_key ?? null,
          image_url: item.image_url ?? null,
          note: item.note ?? null,
        })
        .select()
        .single();
      if (data) setMoodboardItems((rows) => upsertById(rows, data as MoodboardItemRow));
      return (data as MoodboardItemRow) ?? null;
    },
    [supabase, eventId, userId]
  );

  const removeMoodboardItem = useCallback(
    async (id: string) => {
      await supabase.from("moodboard_items").delete().eq("id", id);
      setMoodboardItems((rows) => removeById(rows, id));
    },
    [supabase]
  );

  // Read the latest site via a ref so saveSite keeps a stable identity — it is
  // called from a debounced autosave effect, and depending on `weddingSite`
  // here would re-fire that effect on every save (an infinite save loop).
  const weddingSiteRef = React.useRef(weddingSite);
  weddingSiteRef.current = weddingSite;
  const saveSite = useCallback(
    async (patch: { config?: Record<string, unknown>; domain?: string | null; published?: boolean }) => {
      if (!eventId || !userId) return;
      const current = weddingSiteRef.current;
      const row = {
        event_id: eventId,
        user_id: userId,
        config: patch.config ?? current?.config ?? {},
        domain: patch.domain !== undefined ? patch.domain : current?.domain ?? null,
        published: patch.published !== undefined ? patch.published : current?.published ?? false,
        updated_at: new Date().toISOString(),
      };
      const { data } = await supabase
        .from("wedding_sites")
        .upsert(row, { onConflict: "event_id" })
        .select()
        .single();
      if (data) setWeddingSite(data as WeddingSiteRow);
    },
    [supabase, eventId, userId]
  );

  // Same ref pattern as saveSite: the debounced autosave in the Invites screen
  // must not re-fire when `invitation` changes, so read the latest via a ref.
  const invitationRef = React.useRef(invitation);
  invitationRef.current = invitation;
  const saveInvite = useCallback(
    async (patch: { config?: Record<string, unknown>; slug?: string | null; published?: boolean }) => {
      if (!eventId || !userId) return;
      const current = invitationRef.current;
      const row = {
        event_id: eventId,
        user_id: userId,
        config: patch.config ?? current?.config ?? {},
        slug: patch.slug !== undefined ? patch.slug : current?.slug ?? null,
        published: patch.published !== undefined ? patch.published : current?.published ?? false,
        updated_at: new Date().toISOString(),
      };
      const { data } = await supabase
        .from("invitations")
        .upsert(row, { onConflict: "event_id" })
        .select()
        .single();
      if (data) setInvitation(data as InvitationRow);
    },
    [supabase, eventId, userId]
  );

  const saveSeating = useCallback(
    async (data: Record<string, unknown>) => {
      if (!eventId || !userId) return;
      const { data: row } = await supabase
        .from("seating_plans")
        .upsert(
          { event_id: eventId, user_id: userId, data, updated_at: new Date().toISOString() },
          { onConflict: "event_id" }
        )
        .select()
        .single();
      if (row) setSeatingPlan(row as SeatingPlanRow);
    },
    [supabase, eventId, userId]
  );

  const addRegistryItem = useCallback(
    async (item: Partial<RegistryItemRow> & { title: string }) => {
      if (!eventId || !userId) return null;
      const { data } = await supabase
        .from("registry_items")
        .insert({
          event_id: eventId,
          user_id: userId,
          title: item.title,
          description: item.description ?? null,
          image_url: item.image_url ?? null,
          product_url: item.product_url ?? null,
          store_name: item.store_name ?? null,
          price_cents: item.price_cents ?? null,
          currency: item.currency ?? "DKK",
          quantity: item.quantity ?? 1,
          sort: item.sort ?? 0,
        })
        .select()
        .single();
      if (data) setRegistryItems((rows) => upsertById(rows, data as RegistryItemRow));
      return (data as RegistryItemRow) ?? null;
    },
    [supabase, eventId, userId]
  );

  const updateRegistryItem = useCallback(
    async (id: string, patch: Partial<RegistryItemRow>) => {
      const { data } = await supabase.from("registry_items").update(patch).eq("id", id).select().single();
      if (data) setRegistryItems((rows) => upsertById(rows, data as RegistryItemRow));
    },
    [supabase]
  );

  const deleteRegistryItem = useCallback(
    async (id: string) => {
      await supabase.from("registry_items").delete().eq("id", id);
      setRegistryItems((rows) => removeById(rows, id));
    },
    [supabase]
  );

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
        { event: "*", schema: "public", table: "email_attachments", filter: `event_id=eq.${eventId}` },
        (p) => setAttachments((rows) => upsertById(rows, p.new as EmailAttachmentRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "outbound_emails", filter: `event_id=eq.${eventId}` },
        (p) => setOutbound((rows) => upsertById(rows, p.new as OutboundEmailRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budget_items", filter: `event_id=eq.${eventId}` },
        (p) =>
          p.eventType === "DELETE"
            ? setBudgetItems((rows) => removeById(rows, (p.old as { id: string }).id))
            : setBudgetItems((rows) => upsertById(rows, p.new as BudgetItemRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guests", filter: `event_id=eq.${eventId}` },
        (p) =>
          p.eventType === "DELETE"
            ? setGuests((rows) => removeById(rows, (p.old as { id: string }).id))
            : setGuests((rows) => upsertById(rows, p.new as GuestRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "timeline_tasks", filter: `event_id=eq.${eventId}` },
        (p) =>
          p.eventType === "DELETE"
            ? setTimelineTasks((rows) => removeById(rows, (p.old as { id: string }).id))
            : setTimelineTasks((rows) => upsertById(rows, p.new as TimelineTaskRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "moodboard_items", filter: `event_id=eq.${eventId}` },
        (p) =>
          p.eventType === "DELETE"
            ? setMoodboardItems((rows) => removeById(rows, (p.old as { id: string }).id))
            : setMoodboardItems((rows) => upsertById(rows, p.new as MoodboardItemRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wedding_sites", filter: `event_id=eq.${eventId}` },
        (p) => p.eventType !== "DELETE" && setWeddingSite(p.new as WeddingSiteRow)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "website_designs", filter: `event_id=eq.${eventId}` },
        (p) =>
          p.eventType === "DELETE"
            ? setWebsiteDesigns((rows) => removeById(rows, (p.old as { id: string }).id))
            : setWebsiteDesigns((rows) => upsertById(rows, p.new as WebsiteDesignRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_photos", filter: `event_id=eq.${eventId}` },
        (p) =>
          p.eventType === "DELETE"
            ? setSitePhotos((rows) => removeById(rows, (p.old as { id: string }).id))
            : setSitePhotos((rows) => upsertById(rows, p.new as SitePhotoRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seating_plans", filter: `event_id=eq.${eventId}` },
        (p) => p.eventType !== "DELETE" && setSeatingPlan(p.new as SeatingPlanRow)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invitations", filter: `event_id=eq.${eventId}` },
        (p) => p.eventType !== "DELETE" && setInvitation(p.new as InvitationRow)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registry_items", filter: `event_id=eq.${eventId}` },
        (p) =>
          p.eventType === "DELETE"
            ? setRegistryItems((rows) => removeById(rows, (p.old as { id: string }).id))
            : setRegistryItems((rows) => upsertById(rows, p.new as RegistryItemRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registry_claims", filter: `event_id=eq.${eventId}` },
        (p) =>
          p.eventType === "DELETE"
            ? setRegistryClaims((rows) => removeById(rows, (p.old as { id: string }).id))
            : setRegistryClaims((rows) => upsertById(rows, p.new as RegistryClaimRow))
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
      attachments,
      proposals,
      inviteOrders,
      inviteDesigns,
      invitation,
      journey,
      budgetItems,
      guests,
      timelineTasks,
      moodboardItems,
      weddingSite,
      seatingPlan,
      registryItems,
      registryClaims,
      websiteDesigns,
      websiteDesign: websiteDesigns.find((d) => d.active) ?? null,
      sitePhotos,
      websiteOrders,
      websitePaid: websiteOrders.some((o) => o.status === "paid"),
      refresh: load,
      updateEvent,
      saveBudgetItem,
      deleteBudgetItem,
      addGuest,
      updateGuest,
      deleteGuest,
      addTask,
      updateTask,
      deleteTask,
      seedTasks,
      addMoodboardItem,
      removeMoodboardItem,
      saveSite,
      saveInvite,
      saveSeating,
      addRegistryItem,
      updateRegistryItem,
      deleteRegistryItem,
    }),
    [
      loading, event, profile, email, venues, drafts, outbound, replies, attachments, proposals,
      inviteOrders, inviteDesigns, invitation, journey, budgetItems, guests, timelineTasks,
      moodboardItems, weddingSite, seatingPlan, registryItems, registryClaims,
      websiteDesigns, sitePhotos, websiteOrders, load, updateEvent, saveBudgetItem,
      deleteBudgetItem, addGuest, updateGuest, deleteGuest, addTask, updateTask, deleteTask, seedTasks,
      addMoodboardItem, removeMoodboardItem, saveSite, saveInvite, saveSeating,
      addRegistryItem, updateRegistryItem, deleteRegistryItem,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWedding(): WeddingData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWedding must be used inside <WeddingProvider>");
  return ctx;
}
