import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/db/profile";
import { getGmailConnection } from "@/lib/gmail/oauth";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import type { EventRow } from "@/lib/db/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOrCreateProfile(supabase, user.id);
  if (!profile.onboarded) redirect("/onboarding");

  const [{ data: events }, likedRes, quotedRes, sentRes, gmail] = await Promise.all([
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
    getGmailConnection(user.id),
  ]);

  return (
    <HomeDashboard
      profile={profile}
      events={(events ?? []) as EventRow[]}
      stats={{
        venuesLiked: likedRes.count ?? 0,
        quotesIn: quotedRes.count ?? 0,
        emailsSent: sentRes.count ?? 0,
      }}
      gmailConnected={gmail.connected}
    />
  );
}
