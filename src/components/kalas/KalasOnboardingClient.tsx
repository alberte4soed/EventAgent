"use client";

import dynamic from "next/dynamic";

const KalasOnboardingRoot = dynamic(() => import("@/kalas/KalasOnboardingRoot"), {
  ssr: false,
  loading: () => <div className="theme-kalas min-h-screen bg-canvas" />,
});

export function KalasOnboardingClient() {
  return <KalasOnboardingRoot />;
}
