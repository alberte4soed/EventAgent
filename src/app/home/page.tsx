import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/db/profile";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import type { EventRow, VendorCategory } from "@/lib/db/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOrCreateProfile(supabase, user.id);
  if (!profile.onboarded) redirect("/onboarding");

  const [{ data: events }, likedRes, quotedRes, sentRes] = await Promise.all([
    supabase.from("events").select("*").order("created_at", { ascending: false }),
    supabase
      .from("venues")
      .select("id", { count: "exact", head: true })
      .eq("swipe_status", "liked"),
    supabase
      .from("email_replies")
      .select("id", { count: "exact", head: true })
      .eq("quote_status", "quoted"),
    supabase
      .from("outbound_emails")
      .select("id", { count: "exact", head: true })
      .in("status", ["sent", "replied"]),
  ]);

  const allEvents = (events ?? []) as EventRow[];

  // The journey hub follows the profile's active wedding, falling back to
  // the most recent one still in flight.
  const activeEvent =
    allEvents.find((e) => e.id === profile.active_event_id) ??
    allEvents.find((e) => e.status !== "done") ??
    null;

  let activeLiked = 0;
  let activeQuotes = 0;
  let inviteOrderStatus: string | null = null;
  const bookedByCategory: Partial<Record<VendorCategory, number>> = {};
  const contactedByCategory: Partial<Record<VendorCategory, number>> = {};
  let unreadReplies = 0;

  if (activeEvent) {
    const [likedActive, quotesActive, orderRes, venuesRes, outboundRes, unreadRes] =
      await Promise.all([
        supabase
          .from("venues")
          .select("id", { count: "exact", head: true })
          .eq("event_id", activeEvent.id)
          .eq("swipe_status", "liked"),
        supabase
          .from("email_replies")
          .select("id", { count: "exact", head: true })
          .eq("event_id", activeEvent.id)
          .eq("quote_status", "quoted"),
        supabase
          .from("invite_orders")
          .select("status")
          .eq("event_id", activeEvent.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("venues")
          .select("id, category, booked_at")
          .eq("event_id", activeEvent.id),
        supabase
          .from("outbound_emails")
          .select("venue_id")
          .eq("event_id", activeEvent.id)
          .in("status", ["sent", "replied"]),
        supabase
          .from("email_replies")
          .select("id", { count: "exact", head: true })
          .eq("event_id", activeEvent.id)
          .is("read_at", null),
      ]);
    activeLiked = likedActive.count ?? 0;
    activeQuotes = quotesActive.count ?? 0;
    inviteOrderStatus = (orderRes.data?.status as string | undefined) ?? null;
    unreadReplies = unreadRes.count ?? 0;

    const venueCategory = new Map<string, VendorCategory>();
    for (const v of (venuesRes.data ?? []) as {
      id: string;
      category: VendorCategory;
      booked_at: string | null;
    }[]) {
      venueCategory.set(v.id, v.category);
      if (v.booked_at) {
        bookedByCategory[v.category] = (bookedByCategory[v.category] ?? 0) + 1;
      }
    }
    const contactedVenueIds = new Set(
      ((outboundRes.data ?? []) as { venue_id: string }[]).map((o) => o.venue_id)
    );
    for (const venueId of contactedVenueIds) {
      const cat = venueCategory.get(venueId);
      if (cat) contactedByCategory[cat] = (contactedByCategory[cat] ?? 0) + 1;
    }
  }

  return (
    <HomeDashboard
      profile={profile}
      events={allEvents}
      stats={{
        venuesLiked: likedRes.count ?? 0,
        quotesIn: quotedRes.count ?? 0,
        emailsSent: sentRes.count ?? 0,
      }}
      activeEvent={activeEvent}
      activeExtras={{
        likedVenues: activeLiked,
        quotesIn: activeQuotes,
        inviteOrderStatus,
        bookedByCategory,
        contactedByCategory,
        unreadReplies,
      }}
    />
  );
}
