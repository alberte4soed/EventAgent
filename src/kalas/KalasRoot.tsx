"use client";

/* Authenticated Kalas app. Mounted at /home via next/dynamic with ssr:false,
   so sessionStorage/window access in the screens is safe. Onboarding lives
   on its own Next route (/onboarding) — no phase state here. */
import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import Shell, { type ScreenId } from './Shell';
import GuidedTour from './GuidedTour';
import { KalasProvider, useKalas } from './store';
import { WeddingProvider } from './useWedding';
import { LanguageProvider, type Lang } from './i18n';
import Home from './screens/Home';
import Ava from './screens/Ava';
import { migrateSavedScreen, resolveScreenNavigation, type NavigateTarget } from './lib/hub-nav';
import { isLegacyHubScreen } from './screens/team/shared';
import VendorHub from './screens/team/VendorHub';
import Planning from './screens/Planning';
import Budget from './screens/Budget';
import Guests from './screens/Guests';
import Website from './screens/Website';
import Invites from './screens/Invites';
import Seating from './screens/Seating';
import Registry from './screens/Registry';

export default function KalasRoot({ initialLang = 'da' }: { initialLang?: Lang }) {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider initialLang={initialLang}>
        <WeddingProvider>
          <KalasProvider>
            <div className="theme-kalas min-h-screen bg-canvas font-sans text-ink">
              <AppInner />
            </div>
          </KalasProvider>
        </WeddingProvider>
      </LanguageProvider>
    </MotionConfig>
  );
}

function AppInner() {
  const { pendingCount, avaBadge } = useKalas();
  const [avaOpen, setAvaOpen] = useState(false);
  const [hubTick, setHubTick] = useState(0);
  const [screen, setScreen] = useState<ScreenId>(() => {
    const saved = sessionStorage.getItem('kalas_screen');
    if (saved === 'ava' || saved === 'inspiration') return 'home';
    return migrateSavedScreen(saved) || 'home';
  });
  // One-time welcome tour, armed by onboarding completion (or `?tour=1` so it
  // can be replayed on demand from the real app).
  const [showTour, setShowTour] = useState(() => {
    try {
      if (sessionStorage.getItem('kalas_tour') === '1') return true;
      return new URLSearchParams(window.location.search).get('tour') === '1';
    } catch { return false; }
  });

  const navigate = (s: NavigateTarget) => {
    if (s === 'ava') {
      setAvaOpen(true);
      return;
    }
    const hadDeepLink = isLegacyHubScreen(s)
      || Boolean(sessionStorage.getItem('kalas_hub_tab') || sessionStorage.getItem('kalas_hub_cat'));
    const target = resolveScreenNavigation(s);
    if (target === 'team' && hadDeepLink) setHubTick((t) => t + 1);
    setAvaOpen(false);
    sessionStorage.setItem('kalas_screen', target);
    setScreen(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishTour = () => {
    try { sessionStorage.removeItem('kalas_tour'); } catch { /* ignore */ }
    setShowTour(false);
    navigate('home');
  };

  type AppScreen = Exclude<ScreenId, 'ava'>;
  const screens: Record<AppScreen, React.ReactNode> = {
    home:        <Home onNavigate={navigate} />,
    team:        <VendorHub key={hubTick} onNavigate={navigate} />,
    planning:    <Planning />,
    budget:      <Budget />,
    guests:      <Guests />,
    website:     <Website />,
    registry:    <Registry onNavigate={navigate} />,
    invites:     <Invites />,
    seating:     <Seating />,
  };

  const activeScreen = screen === 'ava' ? 'home' : screen;

  return (
    <>
      <Shell
        current={activeScreen}
        onNavigate={navigate}
        pendingCount={pendingCount}
        avaBadge={avaBadge}
        avaOpen={avaOpen}
        onAvaOpen={() => setAvaOpen(true)}
        avaDrawer={
          <Ava
            onNavigate={navigate}
            onClose={() => setAvaOpen(false)}
            variant="drawer"
          />
        }
      >
        <AnimatePresence mode="wait">
          <div key={activeScreen}>{screens[activeScreen as AppScreen]}</div>
        </AnimatePresence>
      </Shell>

      <AnimatePresence>
        {showTour && (
          <GuidedTour key="guided-tour" onNavigate={navigate} onFinish={finishTour} />
        )}
      </AnimatePresence>
    </>
  );
}
