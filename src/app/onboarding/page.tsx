import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/db/profile";
import { getGmailConnection } from "@/lib/gmail/oauth";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOrCreateProfile(supabase, user.id);
  if (profile.onboarded) redirect("/home");

  const gmail = await getGmailConnection(user.id);

  return (
    <OnboardingFlow
      initialName={profile.display_name ?? ""}
      gmailConnected={gmail.connected}
    />
  );
}
