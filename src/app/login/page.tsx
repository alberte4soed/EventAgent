"use client";

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
    <main className="flex flex-1 items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-xl">
        <div className="mb-2 text-3xl">🎉</div>
        <h1 className="text-2xl font-semibold">EventAgent</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Chat with an agent that finds venues, emails them from your Gmail,
          and collects quotes for your event.
        </p>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>
    </main>
  );
}
