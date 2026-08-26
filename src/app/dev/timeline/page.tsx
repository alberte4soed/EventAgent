"use client";

/* TimelineSpine against fixtures — the spine needs a wedding, a signed-in
   couple and months of seeded tasks to appear in the real app, which makes it
   the one part of Planning that is awkward to look at while changing it.
   Dates are relative to today so the states stay true: one overdue, one soon,
   the marker between them, a short lull and a long one. Sibling of
   /dev/chips and /dev/templates. */
import { useState } from 'react';
import TimelineSpine, { type SpineTask } from '@/kalas/screens/planning/TimelineSpine';
import { buildTimelineBands } from '@/kalas/screens/planning/shared';
import { CalendarClock, Camera, Wallet } from 'lucide-react';

const TODAY = new Date().toISOString().slice(0, 10);

function shift(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TASKS: SpineTask[] = [
  { id: '1', title: 'Sæt budget & gæsteliste', dateISO: shift(-73), done: true, weddingDay: false, overdue: false, Icon: Wallet },
  { id: '2', title: 'Book venue', dateISO: shift(-14), done: false, weddingDay: false, overdue: true },
  { id: '3', title: 'Bestil prøvesmagning', dateISO: shift(1), done: false, weddingDay: false, overdue: false, Icon: CalendarClock },
  { id: '4', title: 'Book fotograf', dateISO: shift(8), done: false, weddingDay: false, overdue: false, Icon: Camera },
  { id: '5', title: 'Save-the-dates', dateISO: shift(168), done: false, weddingDay: false, overdue: false },
  { id: '6', title: 'Invitationer sendt', dateISO: shift(187), done: false, weddingDay: false, overdue: false },
  { id: '7', title: 'Jeres dag', dateISO: shift(206), done: false, weddingDay: true, overdue: false },
];

const UNDATED: SpineTask[] = [
  { id: '8', title: 'Musik / DJ / band', dateISO: null, done: false, weddingDay: false, overdue: false },
];

export default function DevTimelinePage() {
  const [menuId, setMenuId] = useState<string | null>(null);
  const bands = buildTimelineBands(TASKS, TODAY);

  return (
    <div className="theme-kalas min-h-screen bg-canvas p-10 font-sans text-ink">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-line bg-card p-7">
        <TimelineSpine
          bands={bands}
          undated={UNDATED}
          monthLabel={(iso) =>
            new Date(`${iso}T12:00:00`).toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })}
          menuId={menuId}
          onMenu={(id) => setMenuId((m) => (m === id ? null : id))}
          onCloseMenu={() => setMenuId(null)}
          onToggle={() => {}}
          onDateChange={() => {}}
          rowActions={() => ({ onDelete: () => {} })}
        />
      </div>
    </div>
  );
}
