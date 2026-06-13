"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={
        className ??
        "rounded-full border border-[#D4D6C0] px-4 py-2 text-sm font-medium text-[#656952] transition hover:bg-[#ddd6c0] disabled:opacity-50"
      }
    >
      {loading ? "Signing out…" : "Log out"}
    </button>
  );
}
