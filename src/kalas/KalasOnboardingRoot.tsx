"use client";

/* Wedding-interview onboarding. Mounted at /onboarding (ssr:false). On
   completion we persist the couple's answers as a real wedding (creating the
   event, seeding Ava's chat, marking the profile onboarded) and do a full
   navigation to /home so the server gate re-reads profiles.onboarded. */
import { AnimatePresence, MotionConfig } from 'motion/react';
import { type ScreenId } from './Shell';
import Onboarding, { type FormState } from './screens/Onboarding';

export default function KalasOnboardingRoot() {
  const enter = async (form: FormState, s?: ScreenId) => {
    const guests = Number.parseInt(form.guests, 10);
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nameA,
          partner_name: form.nameB || null,
          city: form.location,
          date: form.date
            ? { precision: 'exact', iso: form.date }
            : { precision: 'undecided' },
          guest_count: Number.isFinite(guests) ? guests : null,
          budget: form.budget || null,
          description: form.description || null,
          partner_email: form.partnerEmail || null,
        }),
      });
    } catch {
      // Non-fatal: fall back to just marking onboarded so the gate lets them in.
      try {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboarded: true }),
        });
      } catch {
        // /home's server gate will bounce back here if nothing stuck.
      }
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
