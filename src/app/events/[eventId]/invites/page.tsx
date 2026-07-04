import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvitesPlanner, type DesignPreview } from "@/components/invites/InvitesPlanner";
import type { EventRow, InviteDesignRow, InviteOrderRow } from "@/lib/db/types";

export default async function InvitesPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { eventId } = await params;
  const { checkout } = await searchParams;

  const [{ data: event }, { data: orders }, { data: designRows }] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    supabase
      .from("invite_orders")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("invite_designs")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);
  if (!event) notFound();

  // Sign URLs for the most recent designs so previews survive reload.
  const designs: DesignPreview[] = await Promise.all(
    ((designRows ?? []) as InviteDesignRow[]).map(async (d) => {
      const { data: signed } = await supabase.storage
        .from("invite-designs")
        .createSignedUrl(d.storage_path, 3600);
      return { id: d.id, url: signed?.signedUrl ?? null, selected: d.selected };
    })
  );

  return (
    <main className="min-h-screen bg-[#F6F0E8] text-[#4A4E3C]">
      <header className="sticky top-0 z-30 border-b border-[#D4D6C0] bg-[#F6F0E8]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/home"
            className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px]"
          >
            kalas
          </Link>
          <Link
            href={`/events/${eventId}`}
            className="rounded-full px-3.5 py-2 text-sm text-[#656952] transition hover:bg-[#ece8db]"
          >
            ← Back to workspace
          </Link>
        </div>
      </header>
      <InvitesPlanner
        event={event as EventRow}
        orders={(orders ?? []) as InviteOrderRow[]}
        checkoutResult={checkout ?? null}
        initialDesigns={designs}
      />
    </main>
  );
}
