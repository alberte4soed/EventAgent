import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGmailConnection } from "@/lib/gmail/oauth";
import { EventWorkspace } from "@/components/workspace/EventWorkspace";

export default async function NewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const gmail = await getGmailConnection(user.id);

  return (
    <EventWorkspace
      initialEvent={null}
      initialMessages={[]}
      initialVenues={[]}
      initialDrafts={[]}
      initialOutbound={[]}
      initialReplies={[]}
      gmailConnected={gmail.connected}
    />
  );
}
