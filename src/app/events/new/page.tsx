import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <EventWorkspace
      initialEvent={null}
      initialMessages={[]}
      initialVenues={[]}
      initialDrafts={[]}
      initialOutbound={[]}
      initialReplies={[]}
      initialPrompt={prompt ?? null}
    />
  );
}
