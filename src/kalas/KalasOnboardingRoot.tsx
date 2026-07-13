"use client";

/* Wedding-interview onboarding. Mounted at /onboarding (ssr:false). On
   completion we persist the couple's answers as a real wedding (creating the
   event, seeding Ava's chat, marking the profile onboarded) and do a full
   navigation to /home so the server gate re-reads profiles.onboarded. */
import { AnimatePresence, MotionConfig } from 'motion/react';
import { type ScreenId } from './Shell';
import Onboarding, { type FormState, toOnboardingPayload } from './screens/Onboarding';
import { LanguageProvider, useLang, type Lang } from './i18n';
import { markAllHintsSeen } from './OnboardingHint';

export default function KalasOnboardingRoot({ initialLang = 'da' }: { initialLang?: Lang }) {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider initialLang={initialLang}>
        <div className="theme-kalas min-h-screen bg-canvas font-sans text-ink">
          <OnboardingShell />
        </div>
      </LanguageProvider>
    </MotionConfig>
  );
}

function OnboardingShell() {
  const { lang } = useLang();

  const enter = async (form: FormState, _s?: ScreenId) => {
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...toOnboardingPayload(form), language: lang }),
      });
    } catch {
      // Non-fatal: fall back to just marking onboarded so the gate lets them in.
      try {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboarded: true, language: lang }),
        });
      } catch {
        // /home's server gate will bounce back here if nothing stuck.
      }
    }
    // Start the app on Home and play the one-time guided tour. Suppress the
    // individual per-page hints up front so they don't collide with the tour.
    markAllHintsSeen();
    sessionStorage.setItem('kalas_screen', 'home');
    sessionStorage.setItem('kalas_tour', '1');
    window.location.assign('/home');
  };

  return (
    <AnimatePresence mode="wait">
      <Onboarding key="onb" onEnter={enter} />
    </AnimatePresence>
  );
}
