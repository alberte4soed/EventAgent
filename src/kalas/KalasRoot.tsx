"use client";

/* Authenticated Kalas app. Mounted at /home via next/dynamic with ssr:false,
   so sessionStorage/window access in the screens is safe. Onboarding lives
   on its own Next route (/onboarding) — no phase state here. */
import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import Shell, { type ScreenId } from './Shell';
import { WeddingProvider, useWedding } from './useWedding';
import { LanguageProvider, type Lang } from './i18n';
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
import Inbox from './screens/Inbox';

export default function KalasRoot({ initialLang = 'da' }: { initialLang?: Lang }) {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider initialLang={initialLang}>
        <WeddingProvider>
          <div className="theme-kalas min-h-screen bg-canvas font-sans text-ink">
            <AppInner />
          </div>
        </WeddingProvider>
      </LanguageProvider>
    </MotionConfig>
  );
}

function AppInner() {
  // Real counts, live via realtime: approvals badge the Home row, unread
  // vendor replies badge Ava. Both self-clear through send/dismiss/read flows.
  const { pendingProposals, unreadReplies } = useWedding();
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
    ava:         <Ava onNavigate={navigate} />,
    inspiration: <Inspiration onNavigate={navigate} />,
    venues:      <VenueDiscovery onNavigate={navigate} />,
    vendors:     <Suppliers onNavigate={navigate} />,
    inbox:       <Inbox onNavigate={navigate} />,
    planning:    <Planning />,
    budget:      <Budget onNavigate={navigate} />,
    guests:      <Guests />,
    website:     <Website />,
    invites:     <Invites />,
    seating:     <Seating />,
  };

  return (
    <Shell current={screen} onNavigate={navigate} pendingCount={pendingProposals} avaBadge={unreadReplies}>
      <AnimatePresence mode="wait">
        <div key={screen}>{screens[screen]}</div>
      </AnimatePresence>
    </Shell>
  );
}
