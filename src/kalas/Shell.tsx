import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, UsersRound,
  Wallet, Users, Globe, Mail, ListChecks, LayoutDashboard,
  LayoutGrid, X, Settings, Gift, PanelLeftClose, PanelLeft,
  Bell, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { couple } from './data';
import { cn } from './ui';
import { useLang } from './i18n';

export type ScreenId =
  | 'home' | 'ava' | 'team'
  | 'budget' | 'guests' | 'website' | 'registry' | 'invites' | 'planning' | 'seating';

type NavItem = { id: ScreenId; label: string; icon: LucideIcon; group: 'main' | 'plan' };

const NAV: NavItem[] = [
  { id: 'home',        label: 'Hjem',          icon: Home,          group: 'main' },
  { id: 'planning',    label: 'Tidslinje',     icon: ListChecks,    group: 'main' },
  { id: 'team',        label: 'Venue & leverandører', icon: UsersRound,  group: 'plan' },
  { id: 'budget',      label: 'Budget',        icon: Wallet,        group: 'plan' },
  { id: 'guests',      label: 'Gæster',        icon: Users,         group: 'plan' },
  { id: 'website',     label: 'Hjemmeside',    icon: Globe,         group: 'plan' },
  { id: 'registry',    label: 'Ønskeliste',    icon: Gift,          group: 'plan' },
  { id: 'invites',     label: 'Invitationer',  icon: Mail,          group: 'plan' },
  { id: 'seating',     label: 'Bordplan',      icon: LayoutDashboard, group: 'plan' },
];

const MOBILE_TABS: ScreenId[] = ['home', 'planning', 'team'];

const SIDEBAR_W = 224;
const SIDEBAR_RAIL_W = 72;
const DRAWER_W = 448;

const shellTransition = { type: 'spring' as const, stiffness: 380, damping: 36 };

/** Page cream — main content surface */
const PAGE_BG = '#f5f3ee';
/** Soft mint chrome behind sidebar + header (slightly greener than page cream) */
const CHROME_BG = '#f0f1ec';
/** Soft green wash from top-left (sits behind sidebar + header as one layer) */
const CHROME_WASH =
  'radial-gradient(ellipse 520px 380px at 0% 0%, rgba(31,77,64,0.16) 0%, rgba(31,77,64,0.07) 42%, transparent 72%)';

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span
      className={cn(
        'text-[1.75rem] leading-none lowercase',
        light ? 'text-[#fffdf7]' : 'text-[#314523]',
      )}
      style={{ fontFamily: 'var(--font-logo)', fontWeight: 600, letterSpacing: '-0.02em' }}
    >
      kalas
    </span>
  );
}

function Initials({ light = false }: { light?: boolean }) {
  const a = couple.a?.[0] ?? '';
  const b = couple.b?.[0] ?? '';
  return (
    <div
      className={cn(
        'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold tracking-wide',
        light ? 'bg-[#e66b4e] text-white' : 'bg-ink text-canvas',
      )}
    >
      {a}{b ? `+${b}` : ''}
    </div>
  );
}

export default function Shell({
  current,
  onNavigate,
  pendingCount,
  avaBadge,
  avaOpen,
  onAvaOpen,
  avaDrawer,
  children,
}: {
  current: ScreenId;
  onNavigate: (s: ScreenId) => void;
  pendingCount: number;
  avaBadge: number;
  avaOpen: boolean;
  onAvaOpen: () => void;
  avaDrawer: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (avaOpen) setSidebarCollapsed(true);
  }, [avaOpen]);

  const sidebarRail = sidebarCollapsed;
  const navigate = (s: ScreenId) => { setMoreOpen(false); onNavigate(s); };
  const moreActive = !MOBILE_TABS.includes(current);

  return (
    <div className="flex h-dvh overflow-hidden text-ink" style={{ backgroundColor: CHROME_BG }}>
      {/*
        Shared chrome frame: sidebar + header sit in one relative plane so a
        single top-left wash can span both (Miceops-style). Main content is
        solid so it clips the wash below the header.
      */}
      <div className="relative flex min-h-0 min-w-0 flex-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: CHROME_WASH }}
        />

        {/* ── Desktop sidebar (transparent over shared wash) ──────────── */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarRail ? SIDEBAR_RAIL_W : SIDEBAR_W }}
          transition={shellTransition}
          className="relative z-10 hidden h-full shrink-0 overflow-hidden lg:block"
        >
          <div className={cn(
            'flex h-full min-h-0 flex-col py-5',
            sidebarRail ? 'px-2.5' : 'px-4',
          )}>
            <div className={cn(
              'shrink-0',
              sidebarRail ? 'flex flex-col items-center gap-2 px-1 pb-2' : 'flex h-16 items-center justify-between px-3',
            )}>
              {sidebarRail ? (
                <>
                  <div className="flex w-full justify-end">
                    <button
                      type="button"
                      onClick={() => setSidebarCollapsed(false)}
                      aria-label={t('Vis menu')}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#6c7561] transition-colors hover:bg-[#314523]/8 hover:text-[#314523] cursor-pointer"
                    >
                      <PanelLeft size={18} strokeWidth={1.6} />
                    </button>
                  </div>
                  <span className="font-serif text-[1.35rem] leading-none text-[#314523]" aria-hidden>K</span>
                </>
              ) : (
                <>
                  <Wordmark />
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(true)}
                    aria-label={t('Skjul menu')}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#6c7561] transition-colors hover:bg-[#314523]/8 hover:text-[#314523] cursor-pointer"
                  >
                    <PanelLeftClose size={18} strokeWidth={1.6} />
                  </button>
                </>
              )}
            </div>

            <nav className={cn('min-h-0 flex-1 overflow-y-auto', sidebarRail ? 'pt-1' : 'mt-1 pt-[18px]')}>
              {NAV.filter((n) => n.group === 'main').map((n) => (
                <NavRow key={n.id} item={n} active={current === n.id} onClick={() => navigate(n.id)}
                  badge={n.id === 'home' ? pendingCount : undefined}
                  collapsed={sidebarRail}
                />
              ))}
              {!sidebarRail && (
                <p className="mt-6 pb-2 pl-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a9079]">
                  {t('Planlægning')}
                </p>
              )}
              {sidebarRail && <div className="mx-auto my-3 h-px w-8 bg-[#d8d4c7]" />}
              {NAV.filter((n) => n.group === 'plan').map((n) => (
                <NavRow key={n.id} item={n} active={current === n.id} onClick={() => navigate(n.id)}
                  collapsed={sidebarRail}
                />
              ))}
            </nav>

            <div className={cn(
              'mt-4 shrink-0 border-t border-[#e0ddd2] pt-4',
              sidebarRail ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2',
            )}>
              {sidebarRail ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('home')}
                    aria-label={`${couple.a}${couple.b ? ` & ${couple.b}` : ''}`}
                    className="cursor-pointer transition-opacity hover:opacity-90"
                  >
                    <Initials />
                  </button>
                  <a href="/settings" aria-label={t('Indstillinger')}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#6c7561] transition-colors hover:bg-[#314523]/8 hover:text-[#314523]">
                    <Settings size={17} strokeWidth={1.6} />
                  </a>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('home')}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <Initials />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-[#314523]">
                        {couple.a}{couple.b ? ` & ${couple.b}` : ''}
                      </div>
                      <div className="truncate text-[11px] text-[#6c7561]">{couple.dateLabel}</div>
                    </div>
                  </button>
                  <a href="/settings" aria-label={t('Indstillinger')}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#6c7561] transition-colors hover:bg-[#314523]/8 hover:text-[#314523]">
                    <Settings size={17} strokeWidth={1.6} />
                  </a>
                </>
              )}
            </div>
          </div>
        </motion.aside>

        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Header shares the same wash layer as the sidebar (no own bg) */}
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 px-4 lg:h-[56px] lg:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="lg:hidden"><Wordmark /></span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label={t('Notifikationer')}
                className="flex size-8 items-center justify-center rounded-full border border-[#d8d4c7] text-[#6c7561] transition-colors hover:bg-[#314523]/6 hover:text-[#314523] cursor-pointer"
              >
                <Bell size={15} />
              </button>
              <button
                type="button"
                onClick={onAvaOpen}
                aria-label={avaBadge > 0 ? t('Tal med Ava — {n} nye beskeder', { n: avaBadge }) : t('Spørg Ava')}
                className="relative flex h-8 items-center gap-1.5 rounded-full bg-[#314523] px-3 text-xs font-semibold text-[#fffdf7] transition-opacity hover:opacity-90 cursor-pointer"
              >
                <Sparkles size={13} />
                <span className="hidden sm:inline">{t('Spørg Ava')}</span>
                {avaBadge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#e66b4e] px-0.5 text-[0.5rem] font-bold text-white">
                    {avaBadge}
                  </span>
                )}
              </button>
              <a
                href="/settings"
                aria-label={t('Indstillinger')}
                className="flex size-8 items-center justify-center rounded-full border border-[#d8d4c7] text-[#6c7561] transition-colors hover:bg-[#314523]/6 hover:text-[#314523]"
              >
                <Settings size={15} strokeWidth={1.6} />
              </a>
              <span className="lg:hidden"><Initials /></span>
            </div>
          </header>

          {/* Solid page surface — covers the wash below the header */}
          <div className="flex min-h-0 flex-1 pl-2.5 lg:pl-3">
            <main
              className="min-w-0 flex-1 overflow-y-auto rounded-tl-[20px] border border-[#e0ddd2] border-b-0 border-r-0 pb-28 lg:pb-0"
              style={{ backgroundColor: PAGE_BG }}
            >
              <div className="min-h-full">{children}</div>
            </main>

            <motion.aside
              initial={false}
              animate={{ width: avaOpen ? DRAWER_W : 0 }}
              transition={shellTransition}
              className="h-full shrink-0 overflow-hidden border-l border-[#d9ded9]"
              style={{ backgroundColor: PAGE_BG }}
              role={avaOpen ? 'dialog' : undefined}
              aria-label={t('Tal med Ava')}
              aria-hidden={!avaOpen}
            >
              <div className="flex h-full w-[min(100vw,28rem)] flex-col">
                {avaOpen ? avaDrawer : null}
              </div>
            </motion.aside>
          </div>
        </div>
      </div>

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
                {NAV.filter((n) => n.group === 'plan' || (n.group === 'main' && !MOBILE_TABS.includes(n.id))).map((n) => {
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

function NavRow({ item, active, onClick, badge, collapsed = false }: {
  item: NavItem; active: boolean; onClick: () => void; badge?: number; collapsed?: boolean;
}) {
  const { t } = useLang();
  const Icon = item.icon;
  return (
    <button onClick={onClick} aria-label={t(item.label)} title={collapsed ? t(item.label) : undefined}
      data-tour={item.id}
      className={cn(
        'group relative mb-1.5 flex w-full items-center rounded-[10px] text-left transition-colors duration-200 cursor-pointer',
        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
        active
          ? 'bg-white/70 text-[#314523] shadow-sm'
          : 'text-[#59634f] hover:bg-[#314523]/[0.06] hover:text-[#314523]',
      )}>
      <span className="relative z-10 shrink-0">
        <Icon size={18} strokeWidth={2} />
        {collapsed && badge ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e66b4e] px-0.5 text-[0.55rem] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </span>
      {!collapsed && (
        <>
          <span className="relative z-10 text-sm font-semibold">{t(item.label)}</span>
          {badge ? (
            <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e66b4e] px-1.5 text-[0.65rem] font-bold text-white">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
}
