"use client";

/* Authenticated Kalas app. Mounted at /home via next/dynamic with ssr:false,
   so sessionStorage/window access in the screens is safe. Onboarding lives
   on its own Next route (/onboarding) — no phase state here. */
import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import Shell, { type ScreenId } from './Shell';
import { KalasProvider, useKalas } from './store';
import Home from './screens/Home';
import Ava from './screens/Ava';
import Inspiration from './screens/Moodboard';
import VenueDiscovery from './screens/Venues';
import Suppliers from './screens/Suppliers';
import Planning from './screens/Planning';
import Budget from './screens/Budget';
import Guests from './screens/Guests';
import Website from './screens/Website';
import Invites from './screens/Invites';
import Seating from './screens/Seating';

export default function KalasRoot() {
  return (
    <MotionConfig reducedMotion="user">
      <KalasProvider>
        <div className="theme-kalas min-h-screen bg-canvas font-sans text-ink">
          <AppInner />
        </div>
      </KalasProvider>
    </MotionConfig>
  );
}

function AppInner() {
  const { pendingCount, avaBadge } = useKalas();
  const [screen, setScreen] = useState<ScreenId>(() => {
    return (sessionStorage.getItem('kalas_screen') as ScreenId) || 'home';
  });

  const navigate = (s: ScreenId) => {
    sessionStorage.setItem('kalas_screen', s);
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const screens: Record<ScreenId, React.ReactNode> = {
    home:        <Home onNavigate={navigate} />,
    ava:         <Ava />,
    inspiration: <Inspiration onNavigate={navigate} />,
    venues:      <VenueDiscovery onNavigate={navigate} />,
    vendors:     <Suppliers onNavigate={navigate} />,
    planning:    <Planning />,
    budget:      <Budget onNavigate={navigate} />,
    guests:      <Guests />,
    website:     <Website />,
    invites:     <Invites />,
    seating:     <Seating />,
  };

  return (
    <Shell current={screen} onNavigate={navigate} pendingCount={pendingCount} avaBadge={avaBadge}>
      <AnimatePresence mode="wait">
        <div key={screen}>{screens[screen]}</div>
      </AnimatePresence>
    </Shell>
  );
}
