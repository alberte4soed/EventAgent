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
        <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
        <Link href="/events" className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to events
        </Link>
      </div>

      {params.connected && (
        <div className="mb-6 rounded-xl border border-[#cdd6c8] bg-[#eef0ec] px-4 py-3 text-sm text-[#5e6b58]">
          Gmail connected successfully.
        </div>
      )}
      {params.gmail_error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Gmail connection failed ({params.gmail_error}). Please try again.
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-medium">Gmail connection</h2>
        <p className="mt-1 text-sm text-stone-500">
          Kalas sends quote requests from your Gmail and reads replies to
          collect quotes. Scopes: send &amp; read only.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-stone-200 bg-[#faf9f6] px-4 py-3">
          {gmail.connected ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-[#7c8a76]" />
                Connected{gmail.email ? ` as ${gmail.email}` : ""}
              </div>
              <a
                href="/api/gmail/connect"
                className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100"
              >
                Reconnect
              </a>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <span className="h-2 w-2 rounded-full bg-stone-300" />
                Not connected
              </div>
              <a
                href="/api/gmail/connect"
                className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-stone-50 hover:bg-stone-700"
              >
                Connect Gmail
              </a>
            </>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-medium">Account</h2>
        <p className="mt-1 text-sm text-stone-500">Signed in as {user.email}</p>
      </section>
    </main>
  );
}
