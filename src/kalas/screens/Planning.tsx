import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw, Plus, Trash2, Check, Search, MoreHorizontal,
  CalendarDays, CornerDownRight, X,
} from 'lucide-react';
import { TODAY, timeline as MOCK_TIMELINE } from '../data';
import { useWedding } from '../useWedding';
import { cn } from '../ui';
import OnboardingHint from '../OnboardingHint';

const AVA_CELEBRATION = 'Godt klaret. Ava har opdateret jeres fremdrift.';

/** A displayable milestone: the DB row projected to a guaranteed date. */
type DisplayTask = { id: string; title: string; dateISO: string; done: boolean; weddingDay: boolean };

// The mock timeline is a proven default plan anchored on its own wedding day.
// We re-anchor every milestone onto the couple's real date, preserving the
// relative lead times (book venue ~12 months out, invitations ~3 weeks, …).
const MOCK_WED_MS = new Date(MOCK_TIMELINE[MOCK_TIMELINE.length - 1].dateISO).getTime();

function defaultMilestones(weddingISO: string) {
  const wed = new Date(weddingISO).getTime();
  return MOCK_TIMELINE.map((t, i) => {
    const offset = new Date(t.dateISO).getTime() - MOCK_WED_MS;
    return {
      title: t.title,
      due_date: new Date(wed + offset).toISOString().slice(0, 10),
      category: i === MOCK_TIMELINE.length - 1 ? 'wedding_day' : null,
      done: false,
      sort: i,
    };
  });
}

function daysDiff(dateISO: string): number {
  const d = new Date(dateISO);
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000);
}

function formatDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-');
  return `${d}.${m}.${y}`;
}

type Status = 'done' | 'overdue' | 'planned' | 'wedding';
function statusOf(t: DisplayTask): Status {
  if (t.done) return 'done';
  if (t.weddingDay) return 'wedding';
  if (daysDiff(t.dateISO) < 0) return 'overdue';
  return 'planned';
}

function statusLabel(t: DisplayTask): string {
  const status = statusOf(t);
  if (status === 'done') return 'Færdig';
  if (status === 'wedding') return 'Dagen';
  if (status === 'overdue') return 'Forsinket';
  const diff = daysDiff(t.dateISO);
  if (diff === 0) return 'I dag';
  if (diff > 0 && diff <= 14) return 'Snart';
  return 'Planlagt';
}

type Filter = 'alle' | 'kommende' | 'færdige';

export default function Planning() {
  const { loading, couple, timelineTasks, addTask, updateTask, deleteTask, seedTasks } = useWedding();
  const daysUntil = couple.dateISO
    ? Math.max(0, Math.round((new Date(couple.dateISO).getTime() - TODAY.getTime()) / 86400000))
    : 0;
  const [filter, setFilter] = useState<Filter>('alle');
  const [query, setQuery] = useState('');
  const [celebration, setCelebration] = useState<{ title: string; msg: string } | null>(null);
  const [addingAfter, setAddingAfter] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate,  setNewDate]  = useState(new Date().toISOString().slice(0, 10));
  const [confirmReset, setConfirmReset] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (loading || seededRef.current) return;
    if (timelineTasks.length === 0 && couple.dateISO) {
      seededRef.current = true;
      void seedTasks(defaultMilestones(couple.dateISO));
    }
  }, [loading, timelineTasks.length, couple.dateISO, seedTasks]);

  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(t);
  }, [confirmReset]);

  const fallbackDate = couple.dateISO ?? new Date().toISOString().slice(0, 10);
  const tasks: DisplayTask[] = timelineTasks
    .map((t) => ({
      id: t.id,
      title: t.title,
      dateISO: t.due_date ?? fallbackDate,
      done: t.done,
      weddingDay: t.category === 'wedding_day',
    }))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  const done = tasks.filter((t) => t.done).length;
  const upcoming = tasks.filter((t) => !t.done).length;

  const counts: Record<Filter, number> = {
    alle: tasks.length,
    kommende: upcoming,
    færdige: done,
  };

  const q = query.trim().toLowerCase();
  const visible = tasks.filter((t) => {
    if (filter === 'kommende' && t.done) return false;
    if (filter === 'færdige' && !t.done) return false;
    if (q && !t.title.toLowerCase().includes(q)) return false;
    return true;
  });

  function handleToggle(t: DisplayTask) {
    const nowDone = !t.done;
    void updateTask(t.id, { done: nowDone });
    if (nowDone) {
      setCelebration({ title: t.title, msg: AVA_CELEBRATION });
      setTimeout(() => setCelebration(null), 3200);
    }
  }
  function handleDelete(id: string) { setMenuId(null); void deleteTask(id); }
  function handleDateChange(id: string, dateISO: string) { void updateTask(id, { due_date: dateISO }); }

  function openAdd(afterId: string) {
    setMenuId(null);
    setAddingAfter(afterId);
    setNewTitle('');
    setNewDate(afterId === 'bottom' ? (couple.dateISO ?? new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10));
    setTimeout(() => newInputRef.current?.focus(), 60);
  }
  function commitAdd() {
    if (!newTitle.trim()) { setAddingAfter(null); return; }
    void addTask({ title: newTitle.trim(), due_date: newDate });
    setAddingAfter(null);
  }
  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    void (async () => {
      await Promise.all(timelineTasks.map((t) => deleteTask(t.id)));
      if (couple.dateISO) await seedTasks(defaultMilestones(couple.dateISO));
    })();
    setConfirmReset(false);
  }

  return (
    <div className="flex min-h-full flex-col gap-6 bg-[#f5f3ee] px-6 py-8 sm:px-9 lg:px-12 lg:py-8">
      {/* Checklist panel — mirrors “Kom godt i gang” */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 rounded-[28px] border border-[#d8d4c7] bg-[#fcfbf7] p-7"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[#6c7561]">
              {couple.dateISO
                ? `${daysUntil} dage til dagen · milepælene frem til brylluppet.`
                : 'Milepælene frem til brylluppet.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="shrink-0 text-sm font-bold text-[#8a9079]">
              {done} af {tasks.length} klaret
            </p>
            <button
              type="button"
              onClick={handleReset}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors cursor-pointer',
                confirmReset
                  ? 'bg-[#b34e37] text-white'
                  : 'border border-[#d9ded9] bg-white text-[#314523]',
              )}
            >
              <RotateCcw size={13} />
              {confirmReset ? 'Sikker?' : 'Nulstil'}
            </button>
            <button
              type="button"
              onClick={() => openAdd('bottom')}
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#173c32] px-3 text-xs font-semibold text-white cursor-pointer"
            >
              <Plus size={13} />
              Tilføj milepæl
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
              placeholder="Søg i milepæle"
              aria-label="Søg i milepæle"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#314523] placeholder:text-[#9a9686] focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Ryd søgning"
                className="text-[#9a9686] hover:text-[#314523] cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>
          {(['alle', 'kommende', 'færdige'] as Filter[]).map((f) => {
            const active = filter === f;
            const label = f === 'alle' ? 'Alle' : f.charAt(0).toUpperCase() + f.slice(1);
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
                {label}
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
                  ? 'Ingen milepæle endnu — tilføj jeres første.'
                  : filter === 'færdige' ? 'Ingen færdige milepæle endnu.'
                  : filter === 'kommende' ? 'Alt er klaret. I er foran planen.'
                  : 'Ingen milepæle matcher din søgning.'}
              </p>
            </div>
          )}

          {visible.map((t) => (
            <React.Fragment key={t.id}>
              <MilestoneRow
                t={t}
                menuOpen={menuId === t.id}
                onMenu={() => setMenuId((m) => (m === t.id ? null : t.id))}
                onCloseMenu={() => setMenuId(null)}
                onToggle={() => handleToggle(t)}
                onDelete={() => handleDelete(t.id)}
                onInsertAfter={() => openAdd(t.id)}
                onDateChange={(d) => handleDateChange(t.id, d)}
              />
              <AnimatePresence>
                {addingAfter === t.id && (
                  <AddRow inputRef={newInputRef} title={newTitle} date={newDate}
                    onTitleChange={setNewTitle} onDateChange={setNewDate}
                    onSave={commitAdd} onCancel={() => setAddingAfter(null)} />
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}

          <AnimatePresence>
            {addingAfter === 'bottom' && (
              <AddRow inputRef={newInputRef} title={newTitle} date={newDate}
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
            Tilføj milepæl
          </button>
        </div>
      </motion.section>

      {/* celebration toast */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            role="status" aria-live="polite"
            className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 w-[min(92vw,420px)]"
          >
            <div className="rounded-[18px] border border-[#d8d4c7] bg-[#fcfbf7] px-6 py-5 shadow-[0_20px_60px_-10px_rgba(49,69,35,0.18)]">
              <p className="font-serif text-lg text-[#314523]">{celebration.title}</p>
              <p className="mt-1.5 text-sm text-[#6c7561]">{celebration.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <OnboardingHint id="planning" />
    </div>
  );
}

/* ── Checklist-style milestone row ────────────────────────────────────── */
function MilestoneRow({ t, menuOpen, onMenu, onCloseMenu, onToggle, onDelete, onInsertAfter, onDateChange }: {
  t: DisplayTask; menuOpen: boolean; onMenu: () => void; onCloseMenu: () => void;
  onToggle: () => void; onDelete: () => void; onInsertAfter: () => void; onDateChange: (dateISO: string) => void;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const status = statusOf(t);
  const done = status === 'done';
  const overdue = status === 'overdue';
  const label = statusLabel(t);

  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-center gap-3 rounded-[18px] border px-5 py-4 sm:gap-4',
        done
          ? 'border-[#d3dcc4] bg-[#eef1e6]'
          : overdue
            ? 'border-[#e8d5c8] bg-[#faf4ef]'
            : 'border-[#e4e0d4] bg-[#f7f5ef]',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        role="checkbox"
        aria-checked={t.done}
        aria-label={t.done ? `Markér '${t.title}' som ikke færdig` : `Markér '${t.title}' som færdig`}
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 cursor-pointer',
          done ? 'bg-[#314523] text-[#f7f5ef]' : 'border-2 border-[#c4bfae] bg-transparent',
        )}
      >
        {done && <Check size={14} strokeWidth={2.5} />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'text-base font-semibold',
            done
              ? 'text-[#59634f] line-through decoration-[#59634f]/40'
              : 'text-[#314523]',
          )}
        >
          {t.title}
        </span>
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker?.()}
          aria-label={`Ændr dato for '${t.title}'`}
          className="relative flex w-fit items-center gap-1.5 text-[13px] text-[#6c7561] hover:text-[#314523] cursor-pointer"
        >
          <CalendarDays size={12} />
          {formatDate(t.dateISO)}
          <input
            ref={dateInputRef}
            type="date"
            value={t.dateISO}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
            tabIndex={-1}
          />
        </button>
      </div>

      <span
        className={cn(
          'text-xs font-bold uppercase tracking-[0.12em]',
          done ? 'text-[#7a9068]'
            : overdue ? 'text-[#b34e37]'
            : status === 'wedding' ? 'text-[#314523]'
            : label === 'Snart' || label === 'I dag' ? 'text-[#8a7d5c]'
            : 'text-[#9a9686]',
        )}
      >
        {label}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={onMenu}
          aria-label={`Handlinger for '${t.title}'`}
          className="flex size-8 items-center justify-center rounded-full text-[#9a9686] transition-colors hover:bg-white/70 hover:text-[#314523] cursor-pointer"
        >
          <MoreHorizontal size={18} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={onCloseMenu} />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-9 z-50 w-[168px] overflow-hidden rounded-[14px] border border-[#d8d4c7] bg-[#fcfbf7] py-1 shadow-[0_16px_40px_-12px_rgba(20,26,19,0.25)]"
              >
                <button type="button" onClick={onInsertAfter}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[#314523] transition-colors hover:bg-[#f0ede5] cursor-pointer">
                  <CornerDownRight size={14} className="text-[#6c7561]" /> Indsæt under
                </button>
                <button type="button" onClick={onDelete}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[#b34e37] transition-colors hover:bg-[#faf4ef] cursor-pointer">
                  <Trash2 size={14} /> Slet milepæl
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Inline add row ───────────────────────────────────────────────────── */
function AddRow({ inputRef, title, date, onTitleChange, onDateChange, onSave, onCancel }: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  title: string; date: string;
  onTitleChange: (v: string) => void; onDateChange: (v: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[#d3dcc4] bg-[#eef1e6] px-5 py-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#c4bfae]">
          <Plus size={14} className="text-[#314523]" />
        </span>
        <input
          ref={inputRef} value={title} onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
          placeholder="Milepælens navn…"
          aria-label="Navn på ny milepæl"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#314523] placeholder:text-[#9a9686] focus:outline-none"
        />
        <input
          type="date" value={date} onChange={(e) => onDateChange(e.target.value)}
          aria-label="Dato for ny milepæl"
          className="rounded-full border border-[#d8d4c7] bg-[#fcfbf7] px-3.5 py-2 text-[13px] text-[#314523] focus:outline-none cursor-pointer"
        />
        <button type="button" onClick={onSave} aria-label="Gem milepæl"
          className="flex h-8 items-center gap-1.5 rounded-full bg-[#314523] px-3 text-xs font-semibold text-[#f7f5ef] cursor-pointer">
          <Check size={13} /> Gem
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm font-medium text-[#6c7561] hover:text-[#314523] cursor-pointer">
          Annuller
        </button>
      </div>
    </motion.div>
  );
}
