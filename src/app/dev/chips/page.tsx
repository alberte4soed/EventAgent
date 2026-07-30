"use client";

import { useState } from 'react';
import CategoryFilterBar from '@/kalas/screens/team/CategoryFilterBar';
import type { HubCat } from '@/kalas/screens/team/shared';

export default function DevChipsPage() {
  const [cat, setCat] = useState<HubCat>('venue');
  const [locked, setLocked] = useState(false);

  return (
    <div className="theme-kalas min-h-screen bg-canvas px-8 py-12 text-ink">
      <p className="eyebrow mb-6">Dev · CategoryFilterBar (variant C)</p>

      <div className="w-full">
        <CategoryFilterBar cat={cat} onCatChange={setCat} vendorsLocked={locked} />
      </div>

      <div className="mt-10 flex items-center gap-4 text-sm text-ink-soft">
        <span>Valgt: <strong className="text-ink">{cat}</strong></span>
        <button
          onClick={() => setLocked((v) => !v)}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 hover:bg-shell"
        >
          {locked ? 'Lås op' : 'Lås leverandører'}
        </button>
      </div>
    </div>
  );
}
