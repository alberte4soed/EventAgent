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

/** Catalogue of event types used across onboarding and the home quick-start. */
export const EVENT_TEMPLATES = [
  { key: "birthday", label: "Birthday", emoji: "🎂", prompt: "Help me plan a birthday party." },
  { key: "wedding", label: "Wedding", emoji: "💍", prompt: "Help me plan a wedding." },
  { key: "dinner", label: "Dinner party", emoji: "🍽️", prompt: "Help me plan a dinner party." },
  { key: "corporate", label: "Work event", emoji: "💼", prompt: "Help me plan a company event." },
  { key: "launch", label: "Launch party", emoji: "🚀", prompt: "Help me plan a launch party." },
  { key: "anniversary", label: "Anniversary", emoji: "🥂", prompt: "Help me plan an anniversary celebration." },
  { key: "baby", label: "Baby shower", emoji: "🍼", prompt: "Help me plan a baby shower." },
  { key: "reunion", label: "Reunion", emoji: "✨", prompt: "Help me plan a reunion." },
] as const;
