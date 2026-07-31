import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Plus, Search, X } from 'lucide-react';
import { TODAY, timeline as MOCK_TIMELINE } from '../../data';
import { useWedding } from '../../useWedding';
import { cn } from '../../ui';
import { useLang } from '../../i18n';
import TaskRow, { type DisplayTask } from './TaskRow';
import AddRow from './AddRow';
import { isMilestone, nextSort, type Filter, FILTER_LABELS } from './shared';

// The mock timeline is a proven default plan anchored on its own wedding day.
// We re-anchor every milestone onto the couple's real date, preserving the
// relative lead times (book venue ~12 months out, invitations ~3 weeks, …).
const MOCK_WED_MS = new Date(MOCK_TIMELINE[MOCK_TIMELINE.length - 1].dateISO).getTime();

export function defaultMilestones(weddingISO: string) {
  const wed = new Date(weddingISO).getTime();
  return MOCK_TIMELINE.map((t, i) => {
    const offset = new Date(t.dateISO).getTime() - MOCK_WED_MS;
    return {
      title: t.title,
      due_date: new Date(wed + offset).toISOString().slice(0, 10),
      category: i === MOCK_TIMELINE.length - 1 ? 'wedding_day' : null,
      kind: 'milestone' as const,
      done: false,
      sort: i,
    };
  });
}

export default function TimelineTab({ onCelebrate }: { onCelebrate: (title: string) => void }) {
  const { t } = useLang();
  const { couple, timelineTasks, addTask, updateTask, deleteTask, seedTasks, clearTasks } = useWedding();
  const daysUntil = couple.dateISO
    ? Math.max(0, Math.round((new Date(couple.dateISO).getTime() - TODAY.getTime()) / 86400000))
    : 0;

  const [filter, setFilter] = useState<Filter>('alle');
  const [query, setQuery] = useState('');
  const [addingAfter, setAddingAfter] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmReset, setConfirmReset] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  const rows = timelineTasks.filter(isMilestone);

  // Dated milestones first (chronologically), undated ones last by sort — an
  // undated row must never be pinned to the wedding date.
  const tasks: DisplayTask[] = rows
    .map((r) => ({
      id: r.id,
      title: r.title,
      dateISO: r.due_date,
      done: r.done,
      weddingDay: r.category === 'wedding_day',
    }))
    .sort((a, b) => {
      if (a.dateISO && b.dateISO) return a.dateISO.localeCompare(b.dateISO);
      if (a.dateISO) return -1;
      if (b.dateISO) return 1;
      return 0;
    });

  const done = tasks.filter((x) => x.done).length;
  const counts: Record<Filter, number> = {
    alle: tasks.length,
    kommende: tasks.length - done,
    færdige: done,
  };

  const q = query.trim().toLowerCase();
  const visible = tasks.filter((x) => {
    if (filter === 'kommende' && x.done) return false;
    if (filter === 'færdige' && !x.done) return false;
    if (q && !x.title.toLowerCase().includes(q)) return false;
    return true;
  });

  function handleToggle(task: DisplayTask) {
    const nowDone = !task.done;
    void updateTask(task.id, { done: nowDone });
    if (nowDone) onCelebrate(task.title);
  }

  function openAdd(afterId: string) {
    setMenuId(null);
    setAddingAfter(afterId);
    setNewTitle('');
    setNewDate(afterId === 'bottom'
      ? (couple.dateISO ?? new Date().toISOString().slice(0, 10))
      : new Date().toISOString().slice(0, 10));
    setTimeout(() => newInputRef.current?.focus(), 60);
  }

  function commitAdd() {
    if (!newTitle.trim()) { setAddingAfter(null); return; }
    void addTask({ title: newTitle.trim(), due_date: newDate, kind: 'milestone', sort: nextSort(rows) });
    setAddingAfter(null);
  }

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    void (async () => {
      // Scoped to milestones — the checklist on the other tab must survive.
      await clearTasks('milestone');
      if (couple.dateISO) await seedTasks(defaultMilestones(couple.dateISO));
    })();
    setConfirmReset(false);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 rounded-[28px] border border-[#d8d4c7] bg-[#fcfbf7] p-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-[#6c7561]">
          {couple.dateISO
            ? t('{days} dage til dagen · milepælene frem til brylluppet.', { days: daysUntil })
            : t('Milepælene frem til brylluppet.')}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="shrink-0 text-sm font-bold text-[#8a9079]">
            {t('{done} af {total} klaret', { done, total: tasks.length })}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors cursor-pointer',
              confirmReset ? 'bg-[#b34e37] text-white' : 'border border-[#d9ded9] bg-white text-[#314523]',
            )}
          >
            <RotateCcw size={13} />
            {confirmReset ? t('Sikker?') : t('Nulstil')}
          </button>
          <button
            type="button"
            onClick={() => openAdd('bottom')}
            className="flex h-8 items-center gap-1.5 rounded-full bg-[#173c32] px-3 text-xs font-semibold text-white cursor-pointer"
          >
            <Plus size={13} />
            {t('Tilføj milepæl')}
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-11 w-full items-center gap-2.5 rounded-[14px] border border-[#e4e0d4] bg-[#f7f5ef] px-4 sm:w-[260px]">
          <Search size={15} className="shrink-0 text-[#9a9686]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Søg i milepæle')}
            aria-label={t('Søg i milepæle')}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#314523] placeholder:text-[#9a9686] focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('Ryd søgning')}
              className="text-[#9a9686] hover:text-[#314523] cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>
        {(['alle', 'kommende', 'færdige'] as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer',
                active
                  ? 'bg-[#314523] text-[#f7f5ef]'
                  : 'border border-[#e4e0d4] bg-[#f7f5ef] text-[#6c7561] hover:text-[#314523]',
              )}
            >
              {t(FILTER_LABELS[f])}
              <span className={active ? 'text-[#dce3d3]' : 'text-[#9a9686]'}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {visible.length === 0 && (
          <div className="rounded-[18px] border border-[#e4e0d4] bg-[#f7f5ef] px-5 py-10 text-center">
            <p className="font-serif text-lg text-[#314523]">
              {tasks.length === 0
                ? t('Ingen milepæle endnu — tilføj jeres første.')
                : filter === 'færdige' ? t('Ingen færdige milepæle endnu.')
                : filter === 'kommende' ? t('Alt er klaret. I er foran planen.')
                : t('Ingen milepæle matcher din søgning.')}
            </p>
          </div>
        )}

        {visible.map((task) => (
          <React.Fragment key={task.id}>
            <TaskRow
              task={task}
              deleteLabel="Slet milepæl"
              menuOpen={menuId === task.id}
              onMenu={() => setMenuId((m) => (m === task.id ? null : task.id))}
              onCloseMenu={() => setMenuId(null)}
              onToggle={() => handleToggle(task)}
              onDelete={() => { setMenuId(null); void deleteTask(task.id); }}
              onInsertAfter={() => openAdd(task.id)}
              onDateChange={(d) => void updateTask(task.id, { due_date: d })}
            />
            <AnimatePresence>
              {addingAfter === task.id && (
                <AddRow inputRef={newInputRef} title={newTitle} date={newDate}
                  placeholder="Milepælens navn…"
                  onTitleChange={setNewTitle} onDateChange={setNewDate}
                  onSave={commitAdd} onCancel={() => setAddingAfter(null)} />
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}

        <AnimatePresence>
          {addingAfter === 'bottom' && (
            <AddRow inputRef={newInputRef} title={newTitle} date={newDate}
              placeholder="Milepælens navn…"
              onTitleChange={setNewTitle} onDateChange={setNewDate}
              onSave={commitAdd} onCancel={() => setAddingAfter(null)} />
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => openAdd('bottom')}
          className="flex w-full items-center gap-4 rounded-[18px] border border-dashed border-[#d8d4c7] bg-transparent px-5 py-4 text-left text-sm font-semibold text-[#6c7561] transition-colors hover:border-[#c4bfae] hover:text-[#314523] cursor-pointer"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#c4bfae]">
            <Plus size={14} />
          </span>
          {t('Tilføj milepæl')}
        </button>
      </div>
    </motion.section>
  );
}
