import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGmailConnection } from "@/lib/gmail/oauth";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; gmail_error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const gmail = await getGmailConnection(user.id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Link href="/events" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to events
        </Link>
      </div>

      {params.connected && (
        <div className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
          Gmail connected successfully.
        </div>
      )}
      {params.gmail_error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          Gmail connection failed ({params.gmail_error}). Please try again.
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">Gmail connection</h2>
        <p className="mt-1 text-sm text-zinc-400">
          EventAgent sends quote requests from your Gmail and reads replies to
          collect quotes. Scopes: send &amp; read only.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
          {gmail.connected ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Connected{gmail.email ? ` as ${gmail.email}` : ""}
              </div>
              <a
                href="/api/gmail/connect"
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Reconnect
              </a>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                Not connected
              </div>
              <a
                href="/api/gmail/connect"
                className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200"
              >
                Connect Gmail
              </a>
            </>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">Account</h2>
        <p className="mt-1 text-sm text-zinc-400">Signed in as {user.email}</p>
      </section>
    </main>
  );
}
