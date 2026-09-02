"use client";

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  MapPin, Flower2, Music, Camera, UtensilsCrossed,
} from 'lucide-react';
import { CheckDot, taskRowTone, doneLabelClass } from '../ui';
import { useWedding } from '../useWedding';
import type { NavigateTarget } from '../lib/hub-nav';
import { navigateToHub } from '../lib/hub-nav';
import { useLang } from '../i18n';
import { daysUntilWedding } from '@/lib/wedding-date';
import type { HubCat } from './team/shared';
import HeroPhoto from './home/HeroPhoto';

const HERO_IMG =
  'https://cdn.wonder.so/images/019d9110-e1f2-74f3-85e8-c89f82be5a63/6d0cada0901a800c9f43a2cf68a9d52f6cf2620687565337240b2d069d261834.jpg';
const VENUE_IMG =
  'https://cdn.wonder.so/images/019d9110-e1f2-74f3-85e8-c89f82be5a63/9c6724b9dd201927b422364b58caeef1463b9c321cb5eaca024140a917889110.jpg';

type CheckStatus = 'completed' | 'in_progress' | 'todo';

type ChecklistItem = {
  id: string;
  label: string;
  status: CheckStatus;
  screen?: NavigateTarget;
  hubTab?: 'explore' | 'shortlist';
  hubCat?: HubCat;
};

function formatLongDate(iso: string, locale: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function kr(n: number): string {
  return n.toLocaleString('da-DK');
}

export default function Home({ onNavigate }: { onNavigate: (s: NavigateTarget) => void }) {
  const {
    couple, event, journey, venues, guests, budgetItems, weddingSite,
  } = useWedding();
  const { t, lang } = useLang();
  const locale = lang === 'en' ? 'en-US' : 'da-DK';

  const days = daysUntilWedding(event);
  const likedVenues = venues.filter((v) => v.category === 'venue' && v.swipe_status === 'liked');
  const hasChosenVenue = Boolean(event?.chosen_venue_id);
  const guestsMissingContact = guests.filter((g) => !g.email?.trim()).length;
  const guestsConfirmed = guests.filter((g) => g.rsvp === 'ja').length;
  const bookedVendors = venues.filter((v) => v.category !== 'venue' && v.booked_at).length;

  const budgetTotal = couple.budgetTotal || 0;
  const budgetCommitted = budgetItems.reduce((sum, item) => sum + (item.planned_amount ?? 0), 0);
  const budgetPct = budgetTotal > 0 ? Math.round((budgetCommitted / budgetTotal) * 100) : 0;

  const coupleLabel = couple.b && couple.a
    ? `${couple.a} & ${couple.b}`
    : couple.a || t('Jeres bryllup');

  const dateLine = event?.event_date
    ? `${formatLongDate(event.event_date, locale)}${couple.region ? ` · ${couple.region}` : ''}`
    : couple.dateLabel + (couple.region ? ` · ${couple.region}` : '');

  const basicsDone = Boolean(event?.event_date && event?.budget);
  const venueStage = journey.find((s) => s.key === 'venue');
  const vendorsStage = journey.find((s) => s.key === 'vendors');
  const invitesStage = journey.find((s) => s.key === 'invites');

  const checklist = useMemo((): ChecklistItem[] => {
    const items: ChecklistItem[] = [
      {
        id: 'basics',
        label: t('Angiv dato og budget'),
        status: basicsDone ? 'completed' : 'in_progress',
        // Date and budget are set by asking Ava — there is no form for them.
        screen: 'ava',
      },
      {
        id: 'venues',
        label: t('Shortlist jeres venues'),
        status: hasChosenVenue || likedVenues.length >= 3
          ? 'completed'
          : likedVenues.length > 0 || venueStage?.status === 'active'
            ? 'in_progress'
            : 'todo',
        screen: 'team',
        hubTab: likedVenues.length > 0 ? 'shortlist' : 'explore',
        hubCat: 'venue',
      },
      {
        id: 'guests',
        label: t('Lav gæstelisten'),
        status: guests.length >= 10
          ? 'completed'
          : guests.length > 0
            ? 'in_progress'
            : 'todo',
        screen: 'guests',
      },
      {
        id: 'vendors',
        label: t('Book jeres leverandører'),
        status: bookedVendors >= 2
          ? 'completed'
          : bookedVendors > 0 || vendorsStage?.status === 'active'
            ? 'in_progress'
            : 'todo',
        screen: 'team',
        hubTab: 'explore',
        hubCat: 'fotografi',
      },
      {
        id: 'invites',
        label: t('Send save the dates'),
        status: invitesStage?.status === 'complete'
          ? 'completed'
          : invitesStage?.status === 'active'
            ? 'in_progress'
            : 'todo',
        screen: 'invites',
      },
    ];
    return items;
  }, [
    t, basicsDone, hasChosenVenue, likedVenues.length, venueStage?.status,
    guests.length, bookedVendors, vendorsStage?.status, invitesStage?.status,
  ]);

  const checklistDone = checklist.filter((c) => c.status === 'completed').length;

  const vendorTiles = [
    {
      id: 'florist' as const,
      label: t('Blomster'),
      meta: venues.filter((v) => v.category === 'florist').length > 0
        ? t('{n} fundet', { n: venues.filter((v) => v.category === 'florist').length })
        : t('Florister i nærheden'),
      icon: Flower2,
      hubCat: 'blomster' as HubCat,
    },
    {
      id: 'musician' as const,
      label: t('Musik'),
      meta: t('DJ\'s og bands'),
      icon: Music,
      hubCat: 'musik' as HubCat,
    },
    {
      id: 'photographer' as const,
      label: t('Foto'),
      meta: venues.filter((v) => v.category === 'photographer').length > 0
        ? t('{n} fundet', { n: venues.filter((v) => v.category === 'photographer').length })
        : t('Fotografer'),
      icon: Camera,
      hubCat: 'fotografi' as HubCat,
    },
    {
      id: 'caterer' as const,
      label: t('Catering'),
      meta: t('Menuer og kage'),
      icon: UtensilsCrossed,
      hubCat: 'catering' as HubCat,
    },
  ];

  const goHub = (tab: 'explore' | 'shortlist', cat?: HubCat) => {
    navigateToHub(tab, cat);
    onNavigate('team');
  };

  const openChecklist = (item: ChecklistItem) => {
    if (item.hubTab) navigateToHub(item.hubTab, item.hubCat);
    if (item.screen) onNavigate(item.screen);
  };

  return (
    <div className="flex min-h-full flex-col gap-10 bg-[#f4f5f3] px-6 py-8 sm:px-9 lg:px-12 lg:py-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="flex flex-col gap-7"
      >
        <div className="flex w-full flex-col gap-8 rounded-[28px] border border-[#dcdfdb] bg-[#e6e9e6] p-7 lg:flex-row">
          <HeroPhoto fallback={HERO_IMG} alt={coupleLabel} />
          <div className="flex flex-1 flex-col justify-center gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7d938a]">
              {t('Brylluppet for')}
            </p>
            <h1 className="font-serif text-[clamp(2.5rem,6vw,3.75rem)] font-semibold leading-[1.05] text-[#24413a]">
              {coupleLabel}
            </h1>
            <p className="text-base text-[#46574f]">{dateLine}</p>
            <div className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[#24413a] px-5 py-2">
              <span className="font-serif text-xl font-semibold text-[#f8f9f8]">
                {days ?? '-'}
              </span>
              <span className="text-sm font-semibold text-[#dbe5e0]">{t('dage tilbage')}</span>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-5 rounded-[28px] border border-[#dcdfdb] bg-[#ffffff] p-7">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-2xl font-semibold text-[#24413a]">
                {t('Kom godt i gang')}
              </h2>
              <p className="text-sm text-[#5f6b66]">
                {t('De første skridt for at sætte planlægningen i gang.')}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-[#7d938a]">
              {t('{done} af {total} klaret', { done: checklistDone, total: checklist.length })}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {checklist.map((item) => (
              <ChecklistRow
                key={item.id}
                label={item.label}
                status={item.status}
                statusLabel={
                  item.status === 'completed'
                    ? t('Færdig')
                    : item.status === 'in_progress'
                      ? t('I gang')
                      : t('Mangler')
                }
                onClick={() => openChecklist(item)}
              />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Discovery */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex flex-col gap-5 lg:flex-row"
      >
        <button
          type="button"
          onClick={() => goHub('explore', 'venue')}
          className="relative flex min-h-[280px] flex-1 flex-col justify-end overflow-hidden rounded-[26px] bg-cover bg-center p-7 text-left"
          style={{ backgroundImage: `url('${VENUE_IMG}')` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(20,32,16,0.15)_0%,rgba(20,32,16,0.82)_100%)]" />
          <div className="relative flex flex-col gap-2">
            <h3 className="font-serif text-3xl font-semibold leading-tight text-[#f8f9f8]">
              {t('Find jeres venue')}
            </h3>
            <p className="max-w-[420px] text-sm leading-relaxed text-[#e6ebe0]">
              {t('Steder der matcher gæsteantal, stemning, placering og budget.')}
            </p>
          </div>
          <span className="relative mt-4 inline-flex h-8 w-fit items-center gap-1.5 rounded-full bg-[#f8f9f8] px-3 text-xs font-semibold text-[#24413a]">
            {t('Udforsk venues')}
            <MapPin size={13} />
          </span>
        </button>

        <div className="flex flex-1 flex-col gap-6 rounded-[26px] border border-[#dcdfdb] bg-[#ffffff] p-7">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-2">
              <h3 className="font-serif text-3xl font-semibold text-[#24413a]">
                {t('Find leverandører')}
              </h3>
              <p className="text-sm text-[#5f6b66]">
                {t('Saml holdet der bringer dagen til live.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => goHub('explore', 'fotografi')}
              className="shrink-0 text-sm font-bold text-[#24413a] hover:opacity-70"
            >
              {t('Se alle →')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {vendorTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => goHub('explore', tile.hubCat)}
                  className="flex flex-col gap-3 rounded-[18px] border border-[#e6e9e5] bg-[#eceeeb] p-4 text-left transition-colors hover:bg-[#e8e4da]"
                >
                  <Icon size={20} className="text-[#35544a]" strokeWidth={1.8} />
                  <div>
                    <p className="text-sm font-bold text-[#24413a]">{tile.label}</p>
                    <p className="text-[11px] text-[#5f6b66]">{tile.meta}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Overview */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="flex flex-col gap-5"
      >
        <div className="flex items-end justify-between border-b border-[#e2e6e2] pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-[28px] font-semibold text-[#24413a]">
              {t('Over hele planlægningen')}
            </h2>
            <p className="text-sm text-[#5f6b66]">
              {t('Et roligt overblik over alle hjørner af brylluppet.')}
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            label={t('Budget')}
            stat={`${budgetPct}%`}
            detail={
              budgetTotal > 0
                ? t('kr {spent} af kr {total} fordelt', { spent: kr(budgetCommitted), total: kr(budgetTotal) })
                : t('Angiv budget for at se fordeling')
            }
            link={t('Åbn budget →')}
            onClick={() => onNavigate('budget')}
          />
          <OverviewCard
            label={t('Gæster')}
            stat={String(guests.length || couple.guests || 0)}
            detail={
              guests.length > 0
                ? t('{confirmed} bekræftet · {missing} mangler kontakt', {
                    confirmed: guestsConfirmed,
                    missing: guestsMissingContact,
                  })
                : t('Tilføj jeres første gæster')
            }
            link={t('Åbn gæster →')}
            onClick={() => onNavigate('guests')}
          />
          <OverviewCard
            label={t('Venues')}
            stat={String(likedVenues.length)}
            detail={
              likedVenues.length > 0
                ? t('på shortlisten til gennemgang')
                : t('Start med at udforske steder')
            }
            link={t('Åbn venues →')}
            onClick={() => goHub(likedVenues.length > 0 ? 'shortlist' : 'explore', 'venue')}
          />
          <OverviewCard
            label={t('Hjemmeside')}
            stat={weddingSite?.published ? t('Live') : t('Kladde')}
            detail={
              weddingSite?.published
                ? t('Jeres bryllupsside er publiceret')
                : t('Vælg et tema og publicér')
            }
            link={t('Åbn hjemmeside →')}
            onClick={() => onNavigate('website')}
          />
        </div>
      </motion.section>

      <p className="pb-4 text-center text-[13px] text-[#a6b0aa]">
        {t('Planlagt med omtanke af {names}, guidet af Ava.', { names: coupleLabel })}
      </p>
    </div>
  );
}

function ChecklistRow({
  label,
  status,
  statusLabel,
  onClick,
}: {
  label: string;
  status: CheckStatus;
  statusLabel: string;
  onClick: () => void;
}) {
  const done = status === 'completed';
  const active = status === 'in_progress';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-[18px] border px-5 py-4 text-left transition-colors hover:opacity-95 ${taskRowTone(
        done ? 'done' : 'default',
      )}`}
    >
      <CheckDot done={done} />
      <span
        className={`flex-1 text-base font-semibold ${done ? doneLabelClass : 'text-[#24413a]'}`}
      >
        {label}
      </span>
      <span
        className={`text-xs font-bold uppercase tracking-[0.12em] ${
          done ? 'text-[#5f7d70]' : active ? 'text-[#8a7d5c]' : 'text-[#9a9686]'
        }`}
      >
        {statusLabel}
      </span>
    </button>
  );
}

function OverviewCard({
  label,
  stat,
  detail,
  link,
  onClick,
}: {
  label: string;
  stat: string;
  detail: string;
  link: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[200px] flex-1 flex-col gap-4 rounded-[18px] border border-[#d9ded9] bg-white p-6 text-left transition-shadow hover:shadow-[0_8px_24px_rgba(36,65,58,0.06)]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a9992]">{label}</p>
      <p className="font-serif text-[40px] font-semibold leading-none tracking-[-0.02em] text-[#12332b]">
        {stat}
      </p>
      <p className="flex-1 text-[13px] leading-snug text-[#7a8981]">{detail}</p>
      <span className="text-[13px] font-semibold text-[#b34e37]">{link}</span>
    </button>
  );
}
