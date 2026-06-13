import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGmailConnection } from "@/lib/gmail/oauth";
import { EventWorkspace } from "@/components/workspace/EventWorkspace";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { prompt } = await searchParams;
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
      initialPrompt={prompt ?? null}
    />
  );
}
