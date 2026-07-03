"use client";

import dynamic from "next/dynamic";

// ssr:false — the Kalas SPA reads sessionStorage/window during render.
const KalasRoot = dynamic(() => import("@/kalas/KalasRoot"), {
  ssr: false,
  loading: () => <div className="theme-kalas min-h-screen bg-canvas" />,
});

export function KalasAppClient() {
  return <KalasRoot />;
}
