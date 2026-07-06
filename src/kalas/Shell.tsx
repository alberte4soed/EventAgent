import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, MessageCircle, Heart, MapPin, Building2,
  Wallet, Users, Globe, Mail, ListChecks, LayoutDashboard,
  LayoutGrid, X, Settings, Inbox,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { daysUntil } from '@/lib/dashboard';
import { useWedding } from './useWedding';
import { cn } from './ui';
import { useLang } from './i18n';

export type ScreenId =
  | 'home' | 'ava' | 'inspiration'
  | 'venues' | 'vendors' | 'inbox'
  | 'budget' | 'guests' | 'website' | 'invites' | 'planning' | 'seating';

type NavItem = { id: ScreenId; label: string; icon: LucideIcon; group: 'main' | 'plan' };

const NAV: NavItem[] = [
  { id: 'home',        label: 'Hjem',          icon: Home,          group: 'main' },
  { id: 'ava',         label: 'Ava',           icon: MessageCircle, group: 'main' },
  { id: 'inspiration', label: 'Inspiration',   icon: Heart,         group: 'main' },
  { id: 'venues',      label: 'Venues',        icon: MapPin,        group: 'plan' },
  { id: 'vendors',     label: 'Leverandører',  icon: Building2,     group: 'plan' },
  { id: 'inbox',       label: 'Henvendelser',  icon: Inbox,         group: 'plan' },
  { id: 'budget',      label: 'Budget',        icon: Wallet,        group: 'plan' },
  { id: 'guests',      label: 'Gæster',        icon: Users,         group: 'plan' },
  { id: 'website',     label: 'Hjemmeside',    icon: Globe,         group: 'plan' },
  { id: 'invites',     label: 'Invitationer',  icon: Mail,          group: 'plan' },
  { id: 'planning',    label: 'Tidslinje',     icon: ListChecks,      group: 'plan' },
  { id: 'seating',     label: 'Bordplan',      icon: LayoutDashboard, group: 'plan' },
];

const MOBILE_TABS: ScreenId[] = ['home', 'ava', 'inspiration', 'venues'];

function Wordmark() {
  return (
    <span className="text-[1.45rem] leading-none text-ink lowercase"
      style={{ fontFamily: 'var(--font-logo)', fontWeight: 500, letterSpacing: '0.02em' }}>
      kalas
    </span>
  );
}

function Initials() {
  const { couple } = useWedding();
  const initials =
    `${couple.a?.[0] ?? ''}${couple.b?.[0] ?? ''}` ||
    couple.email?.[0]?.toUpperCase() ||
    'K';
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-[0.7rem] font-medium tracking-wide text-canvas">
      {initials}
    </div>
  );
}

/** Sidebar identity: the real couple, their real countdown. */
function CoupleRow({ onClick }: { onClick: () => void }) {
  const { t } = useLang();
  const { couple, loading } = useWedding();
  const days = daysUntil(couple.dateISO);
  const names = couple.b ? `${couple.a} & ${couple.b}` : couple.a || t('Jeres bryllup');
  const subline = days != null && days >= 0 ? t('{n} dage tilbage', { n: days }) : couple.dateLabel;

  if (loading) {
    return (
      <div className="rule flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-shell" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3 w-24 rounded-full bg-shell" />
          <div className="h-2.5 w-16 rounded-full bg-shell" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="rule flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-card cursor-pointer"
    >
      <Initials />
      <div className="min-w-0">
        <div className="truncate font-serif text-[0.95rem] text-ink">{names}</div>
        {subline && <div className="truncate text-[0.7rem] text-muted">{subline}</div>}
      </div>
    </button>
  );
}

export default function Shell({
  current,
  onNavigate,
  pendingCount,
  avaBadge,
  children,
}: {
  current: ScreenId;
  onNavigate: (s: ScreenId) => void;
  pendingCount: number;
  avaBadge: number;
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = (s: ScreenId) => { setMoreOpen(false); onNavigate(s); };
  const moreActive = !MOBILE_TABS.includes(current);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="rule-r fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-canvas px-7 py-8 lg:flex">
        <Wordmark />

        <nav className="mt-10 flex-1 overflow-y-auto">
          {NAV.filter((n) => n.group === 'main').map((n) => (
            <NavRow key={n.id} item={n} active={current === n.id} onClick={() => navigate(n.id)}
              badge={n.id === 'home' ? pendingCount : undefined}
              avaPulse={n.id === 'ava' && avaBadge > 0} />
          ))}
          <p className="eyebrow mt-6 pb-2 pl-3">{t('Planlægning')}</p>
          {NAV.filter((n) => n.group === 'plan').map((n) => (
            <NavRow key={n.id} item={n} active={current === n.id} onClick={() => navigate(n.id)} />
          ))}
        </nav>

        <div className="mt-4 flex items-center gap-2">
          <CoupleRow onClick={() => navigate('home')} />
          {/* Leaves the SPA — settings (Gmail + log ud) is a Next.js route. */}
          <a href="/settings" aria-label={t('Indstillinger')}
            className="rule flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-muted transition-colors hover:bg-card hover:text-ink">
            <Settings size={17} strokeWidth={1.6} />
          </a>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────── */}
      <header className="rule-b sticky top-0 z-30 flex items-center justify-between bg-canvas/90 px-5 py-4 backdrop-blur-md lg:hidden">
        <Wordmark />
        <Initials />
      </header>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="lg:pl-[248px]">
        <div className="min-h-screen pb-28 lg:pb-0">{children}</div>
      </main>

      {/* ── Floating Ava button ─────────────────────────────────────── */}
      {current !== 'ava' && (
        <motion.button
          key="ava-fab"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          onClick={() => navigate('ava')}
          aria-label={avaBadge > 0 ? t('Tal med Ava — {n} nye beskeder', { n: avaBadge }) : t('Tal med Ava')}
          className="fixed bottom-36 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-canvas shadow-[0_8px_24px_rgba(46,51,37,0.22)] hover:scale-105 active:scale-95 transition-transform cursor-pointer lg:bottom-10 lg:right-10">
          <MessageCircle size={22} strokeWidth={1.6} />
          {avaBadge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-terracotta)] opacity-70" />
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-terracotta)] text-[0.55rem] font-bold text-canvas">{avaBadge}</span>
            </span>
          )}
        </motion.button>
      )}

      {/* ── Mobile bottom nav ───────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="mx-auto mb-4 flex max-w-sm items-center justify-between gap-1 rounded-full bg-card/95 px-2 py-2 shadow-[0_8px_30px_rgba(46,51,37,0.10)] backdrop-blur-xl rule">
          {MOBILE_TABS.map((id) => {
            const item = NAV.find((n) => n.id === id)!;
            const Icon = item.icon;
            const active = current === id && !moreOpen;
            return (
              <button key={id} onClick={() => navigate(id)} aria-label={t(item.label)}
                className="relative flex flex-1 flex-col items-center gap-1 rounded-full py-2 cursor-pointer">
                {active && (
                  <motion.span layoutId="kalas-tab" className="absolute inset-0 rounded-full bg-sage-tint"
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }} />
                )}
                <Icon size={19} strokeWidth={1.6} className={cn('relative z-10', active ? 'text-ink' : 'text-muted')} />
                {id === 'ava' && avaBadge > 0 && (
                  <span className="absolute top-1 right-[calc(50%-16px)] z-10 h-2 w-2 rounded-full bg-[var(--color-terracotta)]" />
                )}
              </button>
            );
          })}
          {/* Mere */}
          <button onClick={() => setMoreOpen((v) => !v)} aria-label={t('Flere sider')} aria-expanded={moreOpen}
            className="relative flex flex-1 flex-col items-center gap-1 rounded-full py-2 cursor-pointer">
            {(moreOpen || moreActive) && (
              <motion.span layoutId="kalas-tab" className="absolute inset-0 rounded-full bg-sage-tint"
                transition={{ type: 'spring', stiffness: 320, damping: 30 }} />
            )}
            <LayoutGrid size={19} strokeWidth={1.6}
              className={cn('relative z-10', moreOpen || moreActive ? 'text-ink' : 'text-muted')} />
          </button>
        </div>
      </nav>

      {/* ── Mobile "Mere" sheet ─────────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-canvas px-6 pt-5 pb-24 lg:hidden"
              role="dialog" aria-label={t('Alle sider')}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="eyebrow">{t('Planlægning')}</p>
                <button onClick={() => setMoreOpen(false)} aria-label={t('Luk')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-shell text-muted hover:text-ink cursor-pointer">
                  <X size={15} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {NAV.filter((n) => n.group === 'plan' || n.id === 'inspiration').map((n) => {
                  const Icon = n.icon;
                  const active = current === n.id;
                  return (
                    <button key={n.id} onClick={() => navigate(n.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-2xl px-2 py-4 transition-colors cursor-pointer',
                        active ? 'bg-sage-tint text-ink' : 'bg-card text-ink-soft hover:bg-shell',
                      )}>
                      <Icon size={20} strokeWidth={1.6} />
                      <span className="text-[0.72rem] font-medium">{t(n.label)}</span>
                    </button>
                  );
                })}
                <a href="/settings"
                  className="flex flex-col items-center gap-2 rounded-2xl bg-card px-2 py-4 text-ink-soft transition-colors hover:bg-shell">
                  <Settings size={20} strokeWidth={1.6} />
                  <span className="text-[0.72rem] font-medium">{t('Indstillinger')}</span>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavRow({ item, active, onClick, badge, avaPulse }: {
  item: NavItem; active: boolean; onClick: () => void; badge?: number; avaPulse?: boolean;
}) {
  const { t } = useLang();
  const Icon = item.icon;
  return (
    <button onClick={onClick}
      className={cn('group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 cursor-pointer',
        active ? 'text-ink' : 'text-ink-soft hover:text-ink')}>
      {active && (
        <motion.span layoutId="kalas-nav" className="absolute inset-0 rounded-xl bg-card"
          transition={{ type: 'spring', stiffness: 360, damping: 32 }} />
      )}
      <span className="relative z-10 shrink-0">
        <Icon size={17} strokeWidth={1.6} />
        {avaPulse && !active && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-terracotta)] opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-terracotta)]" />
          </span>
        )}
      </span>
      <span className="relative z-10 text-[0.88rem]">{t(item.label)}</span>
      {badge ? (
        <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-[0.65rem] font-medium text-canvas">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
