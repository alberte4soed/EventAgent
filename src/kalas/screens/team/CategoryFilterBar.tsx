"use client";

import { Search, X } from 'lucide-react';
import { cn } from '../../ui';
import { useLang } from '../../i18n';
import { HUB_CATS, type HubCat } from './shared';

export default function CategoryFilterBar({
  query,
  cat,
  onQueryChange,
  onCatChange,
}: {
  query: string;
  cat: HubCat;
  onQueryChange: (q: string) => void;
  onCatChange: (cat: HubCat) => void;
}) {
  const { t } = useLang();

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-3 rounded-2xl rule bg-card px-4 py-3">
        <Search size={16} className="shrink-0 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('Find venues, leverandører, tilbud…')}
          className="flex-1 bg-transparent text-[0.92rem] text-ink placeholder:text-muted focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="shrink-0 text-muted hover:text-ink transition-colors cursor-pointer"
            aria-label={t('Luk')}
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
        {HUB_CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCatChange(c.id)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-[0.72rem] font-medium transition-all cursor-pointer',
              cat === c.id
                ? 'bg-ink text-canvas'
                : 'rule bg-card text-ink-soft hover:text-ink hover:bg-shell',
            )}
          >
            {t(c.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
