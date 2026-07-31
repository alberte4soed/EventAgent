import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Plus, Search, X } from 'lucide-react';
import { useWedding } from '../../useWedding';
import { cn } from '../../ui';
import { useLang } from '../../i18n';
import TaskRow, { type DisplayTask } from './TaskRow';
import AddRow from './AddRow';
import { defaultChecklist } from './checklist-data';
import {
  isCheck, groupByArea, areaLabel, nextSort, areaOf,
  type ChecklistArea, type Filter, FILTER_LABELS, CHECKLIST_AREAS,
} from './shared';

export default function ChecklistTab({ onCelebrate }: { onCelebrate: (title: string) => void }) {
  const { t } = useLang();
  const { timelineTasks, addTask, updateTask, deleteTask, seedTasks, clearTasks } = useWedding();

  const [filter, setFilter] = useState<Filter>('alle');
  const [query, setQuery] = useState('');
  const [addingIn, setAddingIn] = useState<ChecklistArea | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  const rows = timelineTasks.filter(isCheck);
  const done = rows.filter((r) => r.done).length;
  const counts: Record<Filter, number> = {
    alle: rows.length,
    kommende: rows.length - done,
    færdige: done,
  };

  const q = query.trim().toLowerCase();
  const groups = groupByArea(
    rows.filter((r) => {
      if (filter === 'kommende' && r.done) return false;
      if (filter === 'færdige' && !r.done) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    }),
  );

  /** Progress per area is counted over ALL its rows, not the filtered subset —
   *  "3/10" must not change just because a filter is on. */
  function areaProgress(area: ChecklistArea) {
    const all = rows.filter((r) => areaOf(r) === area);
    return { done: all.filter((r) => r.done).length, total: all.length };
  }

  function handleToggle(row: (typeof rows)[number]) {
    const nowDone = !row.done;
    void updateTask(row.id, { done: nowDone });
    if (!nowDone) return;
    // At ~70 items a toast per tick is noise — only celebrate a whole area.
    const area = areaOf(row);
    const siblings = rows.filter((r) => areaOf(r) === area);
    const remaining = siblings.filter((r) => !r.done && r.id !== row.id).length;
    if (remaining === 0 && siblings.length > 1) {
      onCelebrate(t('{area} er klaret', { area: t(areaLabel(area)) }));
    }
  }

  function openAdd(area: ChecklistArea) {
    setMenuId(null);
    setAddingIn(area);
    setNewTitle('');
    setTimeout(() => newInputRef.current?.focus(), 60);
  }

  function commitAdd() {
    if (!addingIn || !newTitle.trim()) { setAddingIn(null); return; }
    void addTask({
      title: newTitle.trim(),
      due_date: null,
      category: addingIn,
      kind: 'check',
      sort: nextSort(rows.filter((r) => areaOf(r) === addingIn)),
    });
    setAddingIn(null);
  }

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    void (async () => {
      // Scoped to check items — the timeline on the other tab must survive.
      await clearTasks('check');
      await seedTasks(defaultChecklist());
    })();
    setConfirmReset(false);
  }

  const toDisplay = (r: (typeof rows)[number]): DisplayTask => ({
    id: r.id, title: r.title, dateISO: r.due_date, done: r.done, weddingDay: false,
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 rounded-[28px] border border-[#d8d4c7] bg-[#fcfbf7] p-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-[#6c7561]">
          {t('De mange småting — samlet i bunker, så I kan tage ét område ad gangen.')}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="shrink-0 text-sm font-bold text-[#8a9079]">
            {t('{done} af {total} klaret', { done, total: rows.length })}
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
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-11 w-full items-center gap-2.5 rounded-[14px] border border-[#e4e0d4] bg-[#f7f5ef] px-4 sm:w-[260px]">
          <Search size={15} className="shrink-0 text-[#9a9686]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Søg i tjeklisten')}
            aria-label={t('Søg i tjeklisten')}
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

      {groups.length === 0 && (
        <div className="rounded-[18px] border border-[#e4e0d4] bg-[#f7f5ef] px-5 py-10 text-center">
          <p className="font-serif text-lg text-[#314523]">
            {rows.length === 0
              ? t('Tjeklisten er tom — tryk Nulstil for at hente standardlisten.')
              : filter === 'færdige' ? t('Ingen afkrydsede punkter endnu.')
              : filter === 'kommende' ? t('Alt er krydset af. Flot arbejde.')
              : t('Ingen punkter matcher din søgning.')}
          </p>
        </div>
      )}

      {/* One block per area */}
      {groups.map(({ area, items }) => {
        const progress = areaProgress(area);
        const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
        const Icon = CHECKLIST_AREAS.find((a) => a.id === area)?.Icon;
        return (
          <section key={area} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {Icon && <Icon size={16} strokeWidth={2} className="shrink-0 text-[#8a9079]" />}
              <h2 className="font-serif text-lg text-[#314523]">{t(areaLabel(area))}</h2>
              <span className="text-xs font-bold text-[#9a9686]">
                {progress.done}/{progress.total}
              </span>
              <div className="h-1 min-w-[64px] flex-1 overflow-hidden rounded-full bg-[#e4e0d4]">
                <div className="h-full rounded-full bg-[#8a9079] transition-[width] duration-300" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((row) => (
                <TaskRow
                  key={row.id}
                  task={toDisplay(row)}
                  deleteLabel="Slet punkt"
                  menuOpen={menuId === row.id}
                  onMenu={() => setMenuId((m) => (m === row.id ? null : row.id))}
                  onCloseMenu={() => setMenuId(null)}
                  onToggle={() => handleToggle(row)}
                  onDelete={() => { setMenuId(null); void deleteTask(row.id); }}
                  onDateChange={(d) => void updateTask(row.id, { due_date: d })}
                />
              ))}

              <AnimatePresence>
                {addingIn === area && (
                  <AddRow inputRef={newInputRef} title={newTitle}
                    placeholder="Hvad skal huskes?"
                    onTitleChange={setNewTitle}
                    onSave={commitAdd} onCancel={() => setAddingIn(null)} />
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => openAdd(area)}
                className="flex w-full items-center gap-4 rounded-[18px] border border-dashed border-[#d8d4c7] bg-transparent px-5 py-3 text-left text-sm font-semibold text-[#6c7561] transition-colors hover:border-[#c4bfae] hover:text-[#314523] cursor-pointer"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#c4bfae]">
                  <Plus size={14} />
                </span>
                {t('Tilføj punkt')}
              </button>
            </div>
          </section>
        );
      })}
    </motion.section>
  );
}
