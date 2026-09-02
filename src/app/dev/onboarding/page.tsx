"use client";

/* Onboarding against no session — the real /onboarding sits behind the
   middleware gate and a profile row, which makes it awkward to look at while
   changing its palette. /dev is outside the gate. Sibling of /dev/timeline. */
import KalasOnboardingRoot from '@/kalas/KalasOnboardingRoot';

export default function DevOnboardingPage() {
  return <KalasOnboardingRoot initialLang="da" />;
}
