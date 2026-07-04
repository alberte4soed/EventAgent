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
    <main className="flex flex-1 flex-col bg-[#F6F0E8] text-[#4A4E3C]">
      <header className="mx-auto flex w-full max-w-5xl items-center px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#4A4E3C]"
        >
          kalas
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm rounded-3xl border border-[#D4D6C0] bg-[#F6F0E8] p-10 text-center shadow-[0px_8px_30px_rgba(74,78,60,0.06)]">
          <p className="text-[11px] font-medium uppercase tracking-[1.1px] text-[#4A4E3C]">
            Welcome
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl font-semibold tracking-[-0.5px] text-[#4A4E3C]">
            Sign in or create your account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#7A8066]">
            One Google account is all you need — Ava plans your wedding with you and
            reaches out to venues and vendors from her own concierge inbox.
          </p>
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-[#4A4E3C] px-4 py-3 text-sm font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47] disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>
          <p className="mt-4 text-xs text-[#8a8568]">
            New here? The same button creates your account.
          </p>
        </div>
      </div>
    </main>
  );
}
