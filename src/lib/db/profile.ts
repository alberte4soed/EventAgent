import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "./types";

/**
 * Read the current user's profile, creating an empty row if the signup
 * trigger hasn't (e.g. pre-existing users). Returns null only if there is
 * no authenticated user.
 */
export async function getOrCreateProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRow> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data as ProfileRow;

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return created as ProfileRow;
}

/** Wedding planning templates used across onboarding and the home quick-start. */
export const EVENT_TEMPLATES = [
  { key: "wedding", label: "Full wedding", emoji: "💍", prompt: "Help us plan our wedding." },
  { key: "ceremony", label: "Ceremony only", emoji: "🕊️", prompt: "Help us find a ceremony venue." },
  { key: "reception", label: "Reception only", emoji: "🥂", prompt: "Help us plan our wedding reception." },
  { key: "elopement", label: "Elopement", emoji: "✨", prompt: "Help us plan an intimate elopement." },
  { key: "engagement", label: "Engagement party", emoji: "💐", prompt: "Help us plan an engagement party." },
  { key: "rehearsal", label: "Rehearsal dinner", emoji: "🍽️", prompt: "Help us plan a rehearsal dinner." },
  { key: "shower", label: "Bridal shower", emoji: "🎀", prompt: "Help us plan a bridal shower." },
  { key: "destination", label: "Destination wedding", emoji: "✈️", prompt: "Help us plan a destination wedding." },
] as const;
