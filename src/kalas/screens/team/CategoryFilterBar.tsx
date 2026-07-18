"use client";

import { cn } from '../../ui';
import { useLang } from '../../i18n';
import { HUB_CATS, type HubCat } from './shared';

export default function CategoryFilterBar({
  cat,
  onCatChange,
}: {
  cat: HubCat;
  onCatChange: (cat: HubCat) => void;
}) {
  const { t } = useLang();

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
      {HUB_CATS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onCatChange(c.id)}
          className={cn(
            'h-8 shrink-0 rounded-full px-3 text-xs font-semibold transition-all cursor-pointer',
            cat === c.id
              ? 'bg-[#314523] text-[#f7f5ef]'
              : 'border border-[#e4e0d4] bg-[#f7f5ef] text-[#6c7561] hover:text-[#314523]',
          )}
        >
          {t(c.label)}
        </button>
      ))}
    </div>
  );
}
