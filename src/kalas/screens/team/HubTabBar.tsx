"use client";

import { motion } from 'motion/react';
import { cn } from '../../ui';
import { useLang } from '../../i18n';
import { HUB_TABS, type HubTab } from './shared';

export default function HubTabBar({
  tab,
  badges,
  onChange,
}: {
  tab: HubTab;
  badges: Partial<Record<HubTab, number>>;
  onChange: (tab: HubTab) => void;
}) {
  const { t } = useLang();

  const labels: Record<HubTab, string> = {
    explore: t('Explore'),
    shortlist: t('Shortlist'),
    booked: t('Booked'),
  };

  return (
    <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur-md rule-b">
      <div className="flex items-end gap-6 overflow-x-auto hide-scrollbar px-6 pt-5 sm:gap-8 sm:px-9 lg:px-12">
        {HUB_TABS.map(({ id }) => {
          const active = tab === id;
          const badge = badges[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="relative shrink-0 cursor-pointer pb-4 group"
            >
              <span
                className={cn(
                  'font-serif text-[clamp(1.2rem,2vw,1.6rem)] leading-none transition-colors',
                  active ? 'text-ink' : 'text-muted/50 group-hover:text-ink/60',
                )}
              >
                {labels[id]}
                {badge ? (
                  <span className="ml-1.5 align-middle font-sans text-[0.7rem] tabular-nums text-muted">
                    · {badge}
                  </span>
                ) : null}
              </span>
              {active && (
                <motion.span
                  layoutId="hub-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-ink"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
