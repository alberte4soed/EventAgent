import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/db/types";
import { StatusChip } from "@/components/ui/StatusChip";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
  const events = (data ?? []) as EventRow[];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your events</h1>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-sm text-zinc-400 hover:text-zinc-200">
            Settings
          </Link>
          <Link
            href="/events/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
          >
            + Plan a new event
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
          <p className="text-3xl">🗓️</p>
          <p className="mt-3 text-sm">
            No events yet. Start a conversation and the agent will take it from there.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 transition hover:border-zinc-700"
              >
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {[event.location, event.guest_count && `${event.guest_count} guests`, event.event_date]
                      .filter(Boolean)
                      .join(" · ") || "Details pending"}
                  </div>
                </div>
                <StatusChip status={event.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
