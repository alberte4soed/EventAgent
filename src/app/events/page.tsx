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
          href="/home"
          className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#4A4E3C]"
        >
          kalas
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-sm text-[#7A8066] hover:text-[#4A4E3C]">
            Home
          </Link>
          <Link href="/settings" className="text-sm text-[#7A8066] hover:text-[#4A4E3C]">
            Settings
          </Link>
          <Link
            href="/events/new"
            className="rounded-xl bg-[#4A4E3C] px-4 py-2 text-sm font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47]"
          >
            + Plan a new wedding
          </Link>
        </div>
      </div>

      <h1 className="mb-6 font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.6px] text-[#4A4E3C]">
        Your weddings
      </h1>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C4C8AE] bg-[#F6F0E8]/60 p-12 text-center text-[#7A8066]">
          <p className="text-3xl">💍</p>
          <p className="mt-3 text-sm">
            No weddings yet. Start a conversation and Kalas will take it from there.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex items-center justify-between rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4 transition hover:border-[#C4C8AE]"
              >
                <div>
                  <div className="font-semibold text-[#4A4E3C]">{event.title}</div>
                  <div className="mt-0.5 text-xs text-[#8a8568]">
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
