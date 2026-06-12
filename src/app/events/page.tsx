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
        <Link href="/" className="text-lg font-semibold tracking-tight">
          kalas
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-sm text-stone-500 hover:text-stone-900">
            Settings
          </Link>
          <Link
            href="/events/new"
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-700"
          >
            + Plan a new event
          </Link>
        </div>
      </div>

      <h1 className="mb-6 text-2xl font-medium tracking-tight">Your events</h1>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 p-12 text-center text-stone-500">
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
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-4 transition hover:border-stone-300"
              >
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="mt-0.5 text-xs text-stone-500">
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
