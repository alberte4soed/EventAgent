"use client";

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Bell, Calendar, Check, ChevronRight, ArrowRight, Clock,
} from 'lucide-react';
import { useWedding } from '../useWedding';
import type { ScreenId } from '../Shell';
import type { NavigateTarget } from '../lib/hub-nav';
import { navigateToHub } from '../lib/hub-nav';
import OnboardingHint from '../OnboardingHint';
import { useLang } from '../i18n';
import type { JourneyStageKey } from '@/lib/journey';
import type { ReplyProposalRow, TimelineTaskRow, VenueRow } from '@/lib/db/types';
import { daysUntilWedding } from '@/lib/wedding-date';

const STAGE_SCREEN: Record<JourneyStageKey, NavigateTarget> = {
  basics: 'ava',
  venue: 'team',
  vendors: 'team',
  invites: 'invites',
};

type ApprovalItem = {
  id: string;
  category: string;
  title: string;
  meta: string;
  screen: NavigateTarget;
  hubTab?: 'shortlist' | 'explore' | 'inbox' | 'booked';
};

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Godnat';
  if (h < 10) return 'Godmorgen';
  if (h < 12) return 'Godformiddag';
  if (h < 18) return 'Goddag';
  return 'Godaften';
}

function daysUntil(dateISO: string | null): number | null {
  if (!dateISO) return null;
  const d = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function formatShortDate(iso: string, locale: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

function formatLongDate(iso: string, locale: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatTimelineLabel(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const diff = daysUntil(iso);
  if (diff === 0) return locale.startsWith('da') ? 'I dag' : 'Today';
  if (diff === 1) return locale.startsWith('da') ? 'I morgen' : 'Tomorrow';
  return formatShortDate(iso, locale);
}

function buildApprovalItems(
  proposals: ReplyProposalRow[],
  venues: VenueRow[],
  guestsMissingContact: number,
  likedVenueCount: number,
  hasChosenVenue: boolean,
  t: (s: string, vars?: Record<string, string | number>) => string,
): ApprovalItem[] {
  const items: ApprovalItem[] = [];

  if (!hasChosenVenue && likedVenueCount > 0) {
    items.push({
      id: 'venue-shortlist',
      category: 'VENUE',
      title: t('Vælg mellem {n} forslag', { n: likedVenueCount }),
      meta: t('Ava har sammenlignet pris, kapacitet og rejsetid'),
      screen: 'team',
      hubTab: 'shortlist',
    });
  }

  for (const p of proposals) {
    const venue = venues.find((v) => v.id === p.venue_id);
    const cat = (venue?.category ?? 'vendor').toUpperCase();
    items.push({
      id: p.id,
      category: cat === 'VENUE' ? 'VENUE' : cat,
      title: t('Godkend svar til {name}', { name: venue?.name ?? t('Leverandør') }),
      meta: t('Ava har skrevet et svar klar til jer'),
      screen: 'ava',
    });
  }

  if (guestsMissingContact > 0) {
    items.push({
      id: 'guests-contact',
      category: 'GUESTS',
      title: t('Gennemgå {n} manglende kontakter', { n: guestsMissingContact }),
      meta: t('Invitationer er blokeret indtil listen er komplet'),
      screen: 'guests',
    });
  }

  return items.slice(0, 5);
}

function buildTimelinePath(
  tasks: TimelineTaskRow[],
  journey: { key: JourneyStageKey; label: string; hint: string; status: string }[],
  locale: string,
  t: (s: string) => string,
): { id: string; dateLabel: string; title: string; meta: string; state: 'current' | 'next' | 'future'; screen: NavigateTarget }[] {
  const sorted = [...tasks]
    .filter((task) => task.due_date)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1));

  if (sorted.length > 0) {
    const firstOpen = sorted.findIndex((task) => !task.done);
    return sorted.slice(0, 4).map((task, i) => ({
      id: task.id,
      dateLabel: formatTimelineLabel(task.due_date, locale),
      title: task.title,
      meta: task.done ? t('Færdig') : task.category ?? t('Milepæl'),
      state: task.done ? 'future' as const : i === firstOpen ? 'current' as const : i === firstOpen + 1 ? 'next' as const : 'future' as const,
      screen: 'planning' as ScreenId,
    }));
  }

  const active = journey.filter((s) => s.status === 'active' || s.status === 'complete').slice(0, 4);
  return active.map((s, i) => ({
    id: s.key,
    dateLabel: i === 0 ? (locale.startsWith('da') ? 'Nu' : 'Now') : '—',
    title: s.label,
    meta: s.hint,
    state: i === 0 ? 'current' as const : i === 1 ? 'next' as const : 'future' as const,
    screen: STAGE_SCREEN[s.key],
  }));
}

export default function Home({ onNavigate }: { onNavigate: (s: NavigateTarget) => void }) {
  const {
    couple, event, journey, proposals, venues, guests, timelineTasks,
  } = useWedding();
  const { t, lang } = useLang();
  const locale = lang === 'en' ? 'en-US' : 'da-DK';

  const pending = proposals.filter((p) => p.status === 'proposed');
  const days = daysUntilWedding(event);
  const firstName = couple.a || t('Jeres bryllup');
  const likedVenues = venues.filter((v) => v.category === 'venue' && v.swipe_status === 'liked');
  const hasChosenVenue = Boolean(event?.chosen_venue_id);
  const guestsMissingContact = guests.filter((g) => !g.email?.trim()).length;

  const approvalItems = useMemo(
    () => buildApprovalItems(pending, venues, guestsMissingContact, likedVenues.length, hasChosenVenue, t),
    [pending, venues, guestsMissingContact, likedVenues.length, hasChosenVenue, t],
  );

  const timelinePath = useMemo(
    () => buildTimelinePath(timelineTasks, journey, locale, t),
    [timelineTasks, journey, locale, t],
  );

  const totalTasks = timelineTasks.length;
  const doneTasks = timelineTasks.filter((task) => task.done).length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const nextTask = [...timelineTasks]
    .filter((task) => !task.done && task.due_date)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))[0];

  const nextMilestoneDays = nextTask?.due_date ? daysUntil(nextTask.due_date) : null;

  const summary = approvalItems.length > 0
    ? t('{n} beslutninger venter på jer. Resten bevæger sig fremad.', { n: approvalItems.length })
    : t('Alt er ryddet. Ava arbejder videre i baggrunden og siger til, når der er nyt.');

  return (
    <div className="min-h-screen bg-[#f5f3ee] px-6 py-7 sm:px-9 lg:py-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b34e37]">
            {t('Bryllups command center')}
          </p>
          <h1 className="mt-1 font-serif text-[clamp(1.75rem,4vw,2.125rem)] font-semibold tracking-[-0.02em] text-[#173c32]">
            {t(greetingKey())}, {firstName}.
          </h1>
          <p className="mt-1.5 text-sm text-[#53675f]">{summary}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label={t('Notifikationer')}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-[#d9ded9] bg-white text-[#173c32]"
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ava')}
            className="flex h-[42px] items-center gap-2 rounded-[10px] bg-[#173c32] px-4 text-[13px] font-bold text-white"
          >
            <span className="rounded border border-dashed border-white/50 px-1 py-0.5 text-[10px]">Ava</span>
            {t('Spørg Ava')}
          </button>
        </div>
      </motion.header>

      {/* Overview cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="mt-6 grid gap-[18px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_278px]"
      >
        {/* Countdown */}
        <div className="flex min-h-[210px] flex-col justify-between rounded-[18px] bg-[#173c32] p-6 shadow-[0_10px_30px_rgba(23,60,50,0.16)]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#bfd1c8]">
              {t('Til den store dag')}
            </p>
            <Calendar size={20} className="text-[#f0a58f]" />
          </div>
          <div className="flex items-end gap-3">
            <span className="font-serif text-[clamp(3rem,8vw,4.75rem)] font-semibold leading-none tracking-[-0.03em] text-white">
              {days ?? '—'}
            </span>
            <span className="pb-2 text-base font-semibold text-[#dde8e2]">{t('dage')}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/12 pt-3.5">
            <span className="text-xs text-[#dde8e2]">
              {event?.event_date ? formatLongDate(event.event_date, locale) : couple.dateLabel}
            </span>
            {couple.region && (
              <span className="text-xs font-semibold text-[#f0a58f]">{couple.region}</span>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="flex min-h-[210px] flex-col justify-between rounded-[18px] border border-[#d9ded9] bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6a7b74]">
                {t('Planlægningsfremdrift')}
              </p>
              <p className="mt-1 font-serif text-[2.5rem] font-semibold leading-none text-[#173c32]">
                {progressPct}%
              </p>
            </div>
            <span className="rounded-full bg-[#e8f2ed] px-2.5 py-1 text-[11px] font-bold text-[#236b53]">
              {progressPct >= 30 ? t('På sporet') : t('Kom godt i gang')}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#e9ece8]">
            <div className="h-2.5 rounded-full bg-[#e66b4e]" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#53675f]">
              {totalTasks > 0
                ? t('{done} af {total} opgaver færdige', { done: doneTasks, total: totalTasks })
                : t('Tidslinjen sættes op automatisk')}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('planning')}
              className="font-bold text-[#b34e37] hover:opacity-80"
            >
              {t('Se tidslinje')}
            </button>
          </div>
        </div>

        {/* Next milestone */}
        <div className="flex min-h-[210px] flex-col justify-between rounded-[18px] bg-[#e9c9bc] p-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#713628]">
              {t('Næste milepæl')}
            </p>
            <Clock size={19} className="text-[#713628]" />
          </div>
          {nextTask ? (
            <div>
              <p className="font-serif text-[2rem] font-semibold text-[#43271f]">
                {nextTask.due_date ? formatShortDate(nextTask.due_date, locale) : '—'}
              </p>
              <p className="mt-1 text-[15px] font-bold text-[#43271f]">{nextTask.title}</p>
              {nextMilestoneDays != null && (
                <p className="mt-1 text-xs text-[#713628]">
                  {nextMilestoneDays === 0
                    ? t('I dag')
                    : t('{n} dage tilbage', { n: Math.max(0, nextMilestoneDays) })}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="font-serif text-[1.5rem] font-semibold text-[#43271f]">{t('I gang')}</p>
              <p className="mt-1 text-sm text-[#713628]">
                {journey.find((s) => s.status === 'active')?.label ?? t('Planlæg med Ava')}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => onNavigate(nextTask ? 'planning' : 'ava')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#43271f]"
          >
            {nextTask ? t('Åbn tidslinje') : t('Tal med Ava')}
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* Timeline + approval queue */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mt-[18px] grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_380px]"
      >
        {/* Path timeline */}
        <section className="rounded-[18px] border border-[#d9ded9] bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#173c32]">
                {t('Jeres vej til brylluppet')}
              </h2>
              <p className="mt-1 text-[13px] text-[#61736b]">
                {t('De næste vigtige øjeblikke, i rækkefølge.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('planning')}
              className="text-xs font-bold text-[#b34e37]"
            >
              {t('Fuld tidslinje')}
            </button>
          </div>

          <div className="mt-[18px]">
            {timelinePath.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.screen)}
                className="flex w-full items-center gap-4 border-b border-[#e6e9e5] py-3.5 text-left last:border-b-0 hover:bg-[#fafaf8] transition-colors"
              >
                <TimelineMarker state={item.state} index={index + 1} />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#b34e37]">
                      {item.dateLabel}
                    </p>
                    <p className="truncate text-sm font-bold text-[#20352c]">{item.title}</p>
                    <p className="truncate text-xs text-[#6a7b74]">{item.meta}</p>
                  </div>
                  <ChevronRight size={17} className="shrink-0 text-[#91a098]" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Approval queue */}
        <section className="flex flex-col rounded-[18px] bg-[#20352c] p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-white">{t('Godkendelseskø')}</h2>
              <p className="mt-1 text-[13px] text-[#bdd0c7]">
                {t('Jeres beslutninger holder planlægningen i gang.')}
              </p>
            </div>
            {approvalItems.length > 0 && (
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#e66b4e] text-[13px] font-bold text-white">
                {approvalItems.length}
              </span>
            )}
          </div>

          <div className="mt-[18px] flex flex-col gap-2.5">
            {approvalItems.length === 0 ? (
              <div className="rounded-xl bg-white/10 px-4 py-5 text-sm text-[#bdd0c7]">
                {t('Ingen afventende beslutninger — nyd roen.')}
              </div>
            ) : (
              approvalItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.hubTab) navigateToHub(item.hubTab);
                    onNavigate(item.screen);
                  }}
                  className="rounded-xl bg-white p-[15px] text-left transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-[0.14em] text-[#b34e37]">
                      {item.category}
                    </span>
                    <ChevronRight size={15} className="text-[#6a7b74]" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#20352c]">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-[#61736b]">{item.meta}</p>
                </button>
              ))
            )}
          </div>

          {approvalItems.length > 0 && (
            <div className="mt-[18px] flex items-center justify-between">
              <span className="text-xs text-[#bdd0c7]">
                {t('Ca. {n} min at klare', { n: Math.max(2, approvalItems.length * 2) })}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('ava')}
                className="flex items-center gap-1.5 rounded-[9px] bg-[#e66b4e] px-3 py-2 text-xs font-bold text-white"
              >
                {t('Gennemgå alle')}
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </section>
      </motion.div>

      <OnboardingHint id="home" />
    </div>
  );
}

function TimelineMarker({ state, index }: { state: 'current' | 'next' | 'future'; index: number }) {
  if (state === 'current') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e66b4e] text-white">
        <Check size={14} />
      </span>
    );
  }
  if (state === 'next') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#173c32] bg-white text-[11px] font-bold text-[#173c32]">
        {index}
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef0ed] text-[11px] font-bold text-[#6a7b74]">
      {index}
    </span>
  );
}
