"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="flex flex-1 flex-col bg-[#faf9f6] text-stone-900">
      <header className="mx-auto flex w-full max-w-5xl items-center px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          kalas
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#7c8a76]">
            Welcome
          </p>
          <h1 className="mt-4 text-2xl font-medium tracking-tight">
            Sign in or create your account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            One Google account is all you need — Kalas plans with you and
            sends quote requests from your own Gmail.
          </p>
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-8 w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>
          <p className="mt-4 text-xs text-stone-400">
            New here? The same button creates your account.
          </p>
        </div>
      </div>
    </main>
  );
}
