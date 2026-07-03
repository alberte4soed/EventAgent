import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/db/profile";
import { KalasAppClient } from "@/components/kalas/KalasAppClient";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOrCreateProfile(supabase, user.id);
  if (!profile.onboarded) redirect("/onboarding");

  return <KalasAppClient />;
}
