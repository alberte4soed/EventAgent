import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/db/profile";
import { Landing } from "@/components/landing/Landing";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await getOrCreateProfile(supabase, user.id);
    redirect(profile.onboarded ? "/home" : "/onboarding");
  }

  return <Landing />;
}
