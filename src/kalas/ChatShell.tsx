import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, MessageCircle, Monitor, PanelLeft, Settings, Sparkles, X,
} from 'lucide-react';
import {
  NAV, Wordmark, LangFlagMenu, PAGE_BG, CHROME_BG, CHROME_WASH, type ScreenId,
} from './Shell';
import { cn } from './ui';
import { useLang } from './i18n';

/*
 * Chat mode: the sidebar disappears and Ava drives the app. The chat column
 * is always visible; the "stage" next to it renders whichever screen Ava (or
 * the user, via the pages menu) pulls up. On mobile the two become switchable
 * views, and agent navigation flips to the stage automatically.
 */

export default function ChatShell({
  current,
  onNavigate,
  onExit,
  stageSignal,
  chat,
  children,
}: {
  current: ScreenId;
  onNavigate: (s: ScreenId) => void;
  onExit: () => void;
  /** Increments every time the agent navigates — flips mobile to the stage. */
  stageSignal: number;
  chat: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const [mobileView, setMobileView] = useState<'chat' | 'stage'>('chat');

  // Agent-driven navigation should be seen: switch the mobile view to the
  // stage whenever a ui action lands (desktop shows both, so no-op there).
  const lastSignal = useRef(stageSignal);
  useEffect(() => {
    if (stageSignal !== lastSignal.current) {
      lastSignal.current = stageSignal;
      setMobileView('stage');
    }
  }, [stageSignal]);

  const currentLabel = NAV.find((n) => n.id === current)?.label ?? '';

  return (
    <div className="flex h-dvh flex-col overflow-hidden text-ink" style={{ backgroundColor: CHROME_BG }}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: CHROME_WASH }}
        />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-3 px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Wordmark />
            <span className="hidden items-center gap-1.5 rounded-full bg-[#314523]/8 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#314523] sm:flex">
              <Sparkles size={11} />
              {t('Chat-tilstand')}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PagesMenu current={current} onNavigate={onNavigate} />
            <LangFlagMenu />
            <a
              href="/settings"
              aria-label={t('Indstillinger')}
              className="flex size-8 items-center justify-center rounded-full border border-[#d8d4c7] text-[#6c7561] transition-colors hover:bg-[#314523]/6 hover:text-[#314523]"
            >
              <Settings size={15} strokeWidth={1.6} />
            </a>
            <button
              type="button"
              onClick={onExit}
              aria-label={t('Klassisk visning')}
              title={t('Klassisk visning')}
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#314523] px-3 text-xs font-semibold text-[#fffdf7] transition-opacity hover:opacity-90 cursor-pointer"
            >
              <PanelLeft size={13} />
              <span className="hidden sm:inline">{t('Klassisk visning')}</span>
            </button>
          </div>
        </header>

        {/* ── Body: chat column + stage ──────────────────────────────── */}
        <div className="relative z-10 flex min-h-0 flex-1">
          {/* Chat column — always mounted so the stream survives view flips */}
          <section
            aria-label={t('Tal med Ava')}
            className={cn(
              'h-full min-h-0 flex-col',
              // Mobile: full width, toggled; desktop: fixed column, always on.
              mobileView === 'chat' ? 'flex w-full' : 'hidden',
              'lg:flex lg:w-[400px] lg:shrink-0 xl:w-[448px]',
            )}
          >
            <div className="flex h-full w-full min-h-0 flex-col pb-[76px] lg:pb-0">
              {chat}
            </div>
          </section>

          {/* Stage — the page Ava pulled up */}
          <section
            aria-label={t('Skærm')}
            className={cn(
              'min-h-0 min-w-0 flex-1 flex-col pl-0 lg:flex lg:pl-3',
              mobileView === 'stage' ? 'flex w-full' : 'hidden',
            )}
          >
            <main
              className="relative min-w-0 flex-1 overflow-y-auto rounded-tl-[20px] border border-[#e0ddd2] border-b-0 border-r-0 pb-28 lg:pb-0"
              style={{ backgroundColor: PAGE_BG }}
            >
              {/* Stage strip: what Ava is showing right now */}
              <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#e0ddd2]/70 bg-[#f5f3ee]/92 px-5 py-2 backdrop-blur-sm">
                <Monitor size={13} className="text-[#8a9079]" />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={current}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.16 }}
                    className="text-[0.72rem] font-semibold text-[#59634f]"
                  >
                    {t('Viser: {page}', { page: t(currentLabel) })}
                  </motion.span>
                </AnimatePresence>
                <span className="ml-auto hidden text-[0.68rem] italic text-[#8a9992] md:block">
                  {t('Ava styrer skærmen — sig hvad I vil se.')}
                </span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="min-h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </section>
        </div>
      </div>

      {/* ── Mobile chat/stage switch ─────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="mx-auto mb-4 flex w-fit items-center gap-1 rounded-full bg-card/95 p-1.5 shadow-[0_8px_30px_rgba(46,51,37,0.10)] backdrop-blur-xl rule">
          {(
            [
              { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
              { id: 'stage' as const, label: 'Skærm', icon: Monitor },
            ]
          ).map(({ id, label, icon: Icon }) => {
            const active = mobileView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMobileView(id)}
                aria-pressed={active}
                className="relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.8rem] font-semibold cursor-pointer"
              >
                {active && (
                  <motion.span
                    layoutId="kalas-chatmode-tab"
                    className="absolute inset-0 rounded-full bg-sage-tint"
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  />
                )}
                <Icon size={15} strokeWidth={1.8} className={cn('relative z-10', active ? 'text-ink' : 'text-muted')} />
                <span className={cn('relative z-10', active ? 'text-ink' : 'text-muted')}>{t(label)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** Compact page picker — the user's escape hatch while the sidebar is gone. */
function PagesMenu({ current, onNavigate }: { current: ScreenId; onNavigate: (s: ScreenId) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t('Alle sider')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#d8d4c7] text-[#6c7561] transition-colors hover:bg-[#314523]/6 hover:text-[#314523]"
      >
        {open ? <X size={15} /> : <LayoutGrid size={15} strokeWidth={1.6} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="menu"
            aria-label={t('Alle sider')}
            className="absolute right-0 top-[calc(100%+6px)] z-50 grid w-[264px] grid-cols-2 gap-1 overflow-hidden rounded-xl border border-[#d8d4c7] bg-[#fcfbf7] p-1.5 shadow-[0_12px_32px_-12px_rgba(46,51,37,0.28)]"
          >
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = current === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  onClick={() => { setOpen(false); onNavigate(n.id); }}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[0.78rem] font-medium transition-colors',
                    active ? 'bg-[#314523]/8 text-[#314523]' : 'text-[#59634f] hover:bg-[#314523]/[0.06]',
                  )}
                >
                  <Icon size={14} strokeWidth={1.8} className="shrink-0" />
                  <span className="truncate">{t(n.label)}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
