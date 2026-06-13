import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
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
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.6px] text-[#4A4E3C]">
          Settings
        </h1>
        <Link href="/home" className="text-sm text-[#7A8066] hover:text-[#4A4E3C]">
          ← Back home
        </Link>
      </div>

      {params.connected && (
        <div className="mb-6 rounded-xl border border-[#cdd9cf] bg-[#e3ece8] px-4 py-3 text-sm text-[#4d6b5c]">
          Gmail connected successfully.
        </div>
      )}
      {params.gmail_error && (
        <div className="mb-6 rounded-xl border border-[#e6c4bc] bg-[#f0e0dc] px-4 py-3 text-sm text-[#a8483a]">
          Gmail connection failed ({params.gmail_error}). Please try again.
        </div>
      )}

      <section className="rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] p-6">
        <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[#4A4E3C]">
          Gmail connection
        </h2>
        <p className="mt-1 text-sm text-[#7A8066]">
          Kalas sends wedding venue quote requests from your Gmail and reads replies to
          collect quotes. Scopes: send &amp; read only.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#D4D6C0] bg-[#F6F0E8] px-4 py-3">
          {gmail.connected ? (
            <>
              <div className="flex items-center gap-2 text-sm text-[#4A4E3C]">
                <span className="h-2 w-2 rounded-full bg-[#4A4E3C]" />
                Connected{gmail.email ? ` as ${gmail.email}` : ""}
              </div>
              <a
                href="/api/gmail/connect"
                className="rounded-full border border-[#D4D6C0] px-3 py-1.5 text-xs text-[#656952] hover:bg-[#ddd6c0]"
              >
                Reconnect
              </a>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-[#8a8568]">
                <span className="h-2 w-2 rounded-full bg-[#C4C8AE]" />
                Not connected
              </div>
              <a
                href="/api/gmail/connect"
                className="rounded-full bg-[#4A4E3C] px-3 py-1.5 text-xs font-medium text-[#F6F0E8] hover:bg-[#575B47]"
              >
                Connect Gmail
              </a>
            </>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] p-6">
        <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[#4A4E3C]">
          Account
        </h2>
        <p className="mt-1 text-sm text-[#7A8066]">Signed in as {user.email}</p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
