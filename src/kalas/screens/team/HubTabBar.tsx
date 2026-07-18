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
    inbox: t('Inbox'),
    booked: t('Booked'),
  };

  return (
    <div className="flex gap-1 overflow-x-auto hide-scrollbar border-b border-[#e0ddd2]">
      {HUB_TABS.map(({ id }) => {
        const badge = badges[id];
        const label = labels[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'relative shrink-0 px-5 py-3 text-sm transition-colors cursor-pointer',
              tab === id ? 'text-[#314523] font-semibold' : 'text-[#6c7561] hover:text-[#314523]',
            )}
          >
            {label}
            {badge ? <span className="ml-1 tabular-nums text-[#8a9079]">· {badge}</span> : null}
            {tab === id && (
              <motion.span
                layoutId="hub-tab"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#314523]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
