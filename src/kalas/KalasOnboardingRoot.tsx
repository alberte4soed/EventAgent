"use client";

/* Wedding-interview onboarding. Mounted at /onboarding (ssr:false). On
   completion we mark the profile onboarded and do a full navigation to
   /home so the server gate re-reads profiles.onboarded. */
import { AnimatePresence, MotionConfig } from 'motion/react';
import { type ScreenId } from './Shell';
import Onboarding from './screens/Onboarding';

export default function KalasOnboardingRoot() {
  const enter = async (s?: ScreenId) => {
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarded: true }),
      });
    } catch {
      // Non-fatal: /home's server gate will bounce back here if it didn't stick.
    }
    sessionStorage.setItem('kalas_screen', s ?? 'home');
    window.location.assign('/home');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="theme-kalas min-h-screen bg-canvas font-sans text-ink">
        <AnimatePresence mode="wait">
          <Onboarding key="onb" onEnter={enter} />
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
