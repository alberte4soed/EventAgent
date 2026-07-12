import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventRow, ProfileRow } from "@/lib/db/types";

/** The signed-in user's active wedding: the profile pointer, else most recent. */
export async function getActiveEvent(supabase: SupabaseClient, userId: string): Promise<EventRow | null> {
  const { data: profile } = await supabase
    .from("profiles").select("active_event_id").eq("user_id", userId).maybeSingle();
  const activeId = (profile as Pick<ProfileRow, "active_event_id"> | null)?.active_event_id;
  if (activeId) {
    const { data } = await supabase.from("events").select("*").eq("id", activeId).maybeSingle();
    if (data) return data as EventRow;
  }
  const { data } = await supabase
    .from("events").select("*").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data as EventRow | null) ?? null;
}
