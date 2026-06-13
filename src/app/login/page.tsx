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
    <main className="flex flex-1 flex-col bg-[#f4f1e8] text-[#3d2b23]">
      <header className="mx-auto flex w-full max-w-5xl items-center px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#ac5239]"
        >
          kalas
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm rounded-3xl border border-[#dfd9c6] bg-[#fdfbf4] p-10 text-center shadow-[0px_8px_30px_rgba(61,43,35,0.06)]">
          <p className="text-[11px] font-medium uppercase tracking-[1.1px] text-[#ac5239]">
            Welcome
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl font-semibold tracking-[-0.5px] text-[#3d2b23]">
            Sign in or create your account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#7a6b5c]">
            One Google account is all you need — Kalas plans with you and
            sends quote requests from your own Gmail.
          </p>
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-[#ac5239] px-4 py-3 text-sm font-medium text-[#f8f4e9] shadow-[0px_3px_10px_rgba(172,82,57,0.3)] transition hover:bg-[#96462f] disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>
          <p className="mt-4 text-xs text-[#9a8a77]">
            New here? The same button creates your account.
          </p>
        </div>
      </div>
    </main>
  );
}
