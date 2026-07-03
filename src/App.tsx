import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import Shell, { type ScreenId } from './Shell';
import { KalasProvider, useKalas } from './store';
import Onboarding from './screens/Onboarding';
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

/* Value before signup: no auth phase — login happens at the send moment. */
type Phase = 'onboarding' | 'app';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <KalasProvider>
        <AppInner />
      </KalasProvider>
    </MotionConfig>
  );
}

function AppInner() {
  const { pendingCount, avaBadge } = useKalas();
  const [phase, setPhase] = useState<Phase>(() => {
    const stored = sessionStorage.getItem('kalas_phase');
    return stored === 'app' ? 'app' : 'onboarding';
  });
  const [screen, setScreen] = useState<ScreenId>(() => {
    return (sessionStorage.getItem('kalas_screen') as ScreenId) || 'home';
  });

  const goPhase = (p: Phase) => { sessionStorage.setItem('kalas_phase', p); setPhase(p); };
  const navigate = (s: ScreenId) => {
    sessionStorage.setItem('kalas_screen', s);
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (phase === 'onboarding') {
    return (
      <AnimatePresence mode="wait">
        <Onboarding key="onb" onEnter={(s) => { goPhase('app'); navigate(s ?? 'home'); }} />
      </AnimatePresence>
    );
  }

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
