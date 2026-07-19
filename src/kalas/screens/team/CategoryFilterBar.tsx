"use client";

import { Lock } from 'lucide-react';
import { cn } from '../../ui';
import { useLang } from '../../i18n';
import { HUB_CATS, type HubCat } from './shared';

export default function CategoryFilterBar({
  cat,
  onCatChange,
  vendorsLocked = false,
}: {
  cat: HubCat;
  onCatChange: (cat: HubCat) => void;
  vendorsLocked?: boolean;
}) {
  const { t } = useLang();

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
      {HUB_CATS.map((c) => {
        const locked = vendorsLocked && c.id !== 'venue' && c.id !== 'alle';
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onCatChange(c.id)}
            title={locked ? 'Vælg jeres lokation først' : undefined}
            className={cn(
              'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all cursor-pointer',
              cat === c.id
                ? 'bg-[#314523] text-[#f7f5ef]'
                : 'border border-[#e4e0d4] bg-[#f7f5ef] text-[#6c7561] hover:text-[#314523]',
              locked && cat !== c.id && 'opacity-70',
            )}
          >
            {locked && <Lock size={11} className="shrink-0 opacity-70" />}
            {t(c.label)}
          </button>
        );
      })}
    </div>
  );
}
