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
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#ac5239]"
        >
          kalas
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-sm text-[#7a6b5c] hover:text-[#3d2b23]">
            Settings
          </Link>
          <Link
            href="/events/new"
            className="rounded-xl bg-[#ac5239] px-4 py-2 text-sm font-medium text-[#f8f4e9] shadow-[0px_3px_10px_rgba(172,82,57,0.3)] transition hover:bg-[#96462f]"
          >
            + Plan a new event
          </Link>
        </div>
      </div>

      <h1 className="mb-6 font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.6px] text-[#3d2b23]">
        Your events
      </h1>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cfc8b2] bg-[#fdfbf4]/60 p-12 text-center text-[#7a6b5c]">
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
                className="flex items-center justify-between rounded-2xl border border-[#dfd9c6] bg-[#fdfbf4] px-5 py-4 transition hover:border-[#cfc8b2]"
              >
                <div>
                  <div className="font-semibold text-[#3d2b23]">{event.title}</div>
                  <div className="mt-0.5 text-xs text-[#9a8a77]">
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
