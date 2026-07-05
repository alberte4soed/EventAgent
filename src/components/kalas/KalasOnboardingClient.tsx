"use client";

import dynamic from "next/dynamic";
import type { AppLanguage } from "@/lib/db/types";

const KalasOnboardingRoot = dynamic(() => import("@/kalas/KalasOnboardingRoot"), {
  ssr: false,
  loading: () => <div className="theme-kalas min-h-screen bg-canvas" />,
});

export function KalasOnboardingClient({ initialLang = "da" }: { initialLang?: AppLanguage }) {
  return <KalasOnboardingRoot initialLang={initialLang} />;
}
