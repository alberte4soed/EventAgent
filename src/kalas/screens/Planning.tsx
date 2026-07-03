import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Plus, Trash2, Check } from 'lucide-react';
import { couple, daysUntil, TODAY, type Task } from '../data';
import { useKalas } from '../store';
import { Eyebrow, cn } from '../ui';

const AVA_CELEBRATION: Record<string, string> = {
  't3':  'Venue booket. Det er det sværeste skridt — nu ruller det.',
  't5':  'Fotografen er på plads. Ava noterer det i jeres brief.',
  't6':  'Catering aftalt. Ava holder øje med eventuelle ændringer.',
  't9':  'Invitationer afsendt. Ava venter på RSVP og giver besked.',
  't11': 'Tøj aftalt. Et stort tjek på listen.',
  default: 'Godt klaret. Ava har opdateret jeres fremdrift.',
};

const MONTHS_DA = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AUG','SEP','OKT','NOV','DEC'];

function daysDiff(dateISO: string): number {
  const d = new Date(dateISO);
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000);
}

function formatDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-');
  return `${d}.${m}.${y}`;
}

type Filter = 'alle' | 'kommende' | 'færdige';

const EMPTY_COPY: Record<Filter, string> = {
  alle: 'Ingen milepæle endnu — tilføj jeres første nedenfor.',
  kommende: 'Alt er klaret. I er foran planen.',
  færdige: 'Ingen færdige milepæle endnu — det første tjek føles godt.',
};

export default function Planning() {
  const { tasks, setTasks, doneIds, toggleDone, resetTimeline } = useKalas();
  const [filter, setFilter] = useState<Filter>('alle');
  const [celebration, setCelebration] = useState<{ title: string; msg: string } | null>(null);
  const [addingAfter, setAddingAfter] = useState<string | null>(null); // task id or 'bottom'
  const [newTitle, setNewTitle] = useState('');
  const [newDate,  setNewDate]  = useState(new Date().toISOString().slice(0, 10));
  const [confirmReset, setConfirmReset] = useState(false);
  const newInputRef = useRef<HTMLInputElement>(null);

  // Auto-cancel the reset confirmation if the user hesitates.
  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(t);
  }, [confirmReset]);

  const done = tasks.filter((t) => doneIds.has(t.id)).length;
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const filtered = tasks.filter((t) => {
    const isDone = doneIds.has(t.id);
    if (filter === 'kommende') return !isDone;
    if (filter === 'færdige')  return isDone;
    return true;
  });

  function handleToggle(t: Task) {
    const nowDone = toggleDone(t.id);
    if (nowDone) {
      const msg = AVA_CELEBRATION[t.id] ?? AVA_CELEBRATION.default;
      setCelebration({ title: t.title, msg });
      setTimeout(() => setCelebration(null), 3200);
    }
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleDateChange(id: string, dateISO: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, dateISO } : t)));
  }

  function openAdd(afterId: string) {
    setAddingAfter(afterId);
    setNewTitle('');
    setNewDate(new Date().toISOString().slice(0, 10));
    setTimeout(() => newInputRef.current?.focus(), 60);
  }

  function commitAdd() {
    if (!newTitle.trim()) { setAddingAfter(null); return; }
    const newTask: Task = {
      id: `t_${Date.now()}`,
      title: newTitle.trim(),
      description: '',
      dateISO: newDate,
      status: 'active',
      owner: 'couple',
    };
    setTasks((prev) => {
      if (addingAfter === 'bottom') return [...prev, newTask];
      const idx = prev.findIndex((t) => t.id === addingAfter);
      const next = [...prev];
      next.splice(idx + 1, 0, newTask);
      return next;
    });
    setAddingAfter(null);
  }

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetTimeline();
    setConfirmReset(false);
  }

  // Group by year
  const byYear: Record<number, Task[]> = {};
  for (const t of filtered) {
    const y = parseInt(t.dateISO.split('-')[0]);
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(t);
  }
  const years = Object.keys(byYear).map(Number).sort();

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
      <Eyebrow>Tidslinje</Eyebrow>
      <h1 className="display mt-4 text-[clamp(2.5rem,5vw,4rem)] text-ink leading-[1.1]">
        Jeres rejse mod <span className="italic">dagen</span>
      </h1>
      <p className="mt-4 max-w-xl text-ink-soft leading-relaxed">
        Tilpas hver milepæl — ret datoer, marker som færdig, slet det I ikke skal bruge. Tidslinjen er jeres, ikke en skabelon.
      </p>

      {/* action buttons */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={handleReset}
          className={cn(
            'flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.78rem] font-medium uppercase tracking-widest transition-colors cursor-pointer',
            confirmReset
              ? 'bg-[var(--color-terracotta)] text-canvas'
              : 'border border-[var(--color-line)] text-ink hover:bg-shell',
          )}>
          <RotateCcw size={13} /> {confirmReset ? 'Sikker? Alt nulstilles' : 'Nulstil'}
        </button>
        <button onClick={() => openAdd('bottom')}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.78rem] font-medium uppercase tracking-widest text-canvas hover:opacity-90 transition-opacity cursor-pointer"
          style={{ background: 'var(--color-terracotta)' }}>
          <Plus size={13} /> Tilføj milepæl
        </button>
      </div>

      {/* stats row */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 border-t border-b border-[var(--color-line)]">
        {[
          { label: 'Bryllupsdag', value: couple.dateLabel },
          { label: 'Dage til', value: String(daysUntil) },
          { label: 'Milepæle', value: String(tasks.length) },
          { label: 'Færdige', value: `${done} / ${tasks.length}`, accent: done < tasks.length },
        ].map((s, i) => (
          <div key={i} className={cn('py-5 px-4', i < 3 && 'sm:border-r border-[var(--color-line)]', i % 2 === 0 && 'border-r sm:border-r')}>
            <p className="eyebrow text-[0.65rem] text-muted mb-2">{s.label}</p>
            <p className={cn('font-serif text-[1.4rem] leading-none', s.accent ? 'text-[var(--color-terracotta)]' : 'text-ink')}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* progress */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <span className="eyebrow text-[0.65rem] text-muted">Fremdrift</span>
          <span className="text-[0.78rem] text-muted">{pct}%</span>
        </div>
        <div className="h-px bg-[var(--color-line)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-ink"
          />
        </div>
      </div>

      {/* filter tabs */}
      <div className="mt-8 flex gap-2">
        {(['alle', 'kommende', 'færdige'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-5 py-2 text-[0.72rem] font-medium uppercase tracking-widest transition-colors cursor-pointer',
              filter === f
                ? 'bg-ink text-canvas'
                : 'border border-[var(--color-line)] text-ink hover:bg-shell'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* empty state */}
      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="font-serif text-[1.3rem] text-ink italic">{EMPTY_COPY[filter]}</p>
          {filter !== 'alle' && (
            <button onClick={() => setFilter('alle')}
              className="mt-3 text-[0.78rem] text-muted hover:text-ink underline-offset-2 hover:underline transition-colors cursor-pointer">
              Vis alle milepæle
            </button>
          )}
        </div>
      )}

      {/* timeline by year */}
      <div className="mt-10 space-y-12">
        {years.map((year) => (
          <div key={year}>
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-serif text-[3rem] leading-none text-ink">{year}</span>
              <span className="eyebrow text-[0.65rem] text-muted">{byYear[year].length} milepæle</span>
            </div>

            <div className="relative">
              <div className="absolute left-[46px] top-0 bottom-0 w-px bg-[var(--color-line)]" />
              <ol className="space-y-0">
                {byYear[year].map((t, i) => (
                  <React.Fragment key={t.id}>
                    <TimelineRow t={t} i={i}
                      isDone={doneIds.has(t.id)}
                      onToggle={() => handleToggle(t)}
                      onDelete={() => handleDelete(t.id)}
                      onInsertAfter={() => openAdd(t.id)}
                      onDateChange={(d) => handleDateChange(t.id, d)} />
                    <AnimatePresence>
                      {addingAfter === t.id && (
                        <AddRow inputRef={newInputRef} title={newTitle} date={newDate}
                          onTitleChange={setNewTitle} onDateChange={setNewDate}
                          onSave={commitAdd} onCancel={() => setAddingAfter(null)} />
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

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
            <div className="relative rule rounded-2xl bg-card px-6 py-5 shadow-[0_20px_60px_-10px_rgba(46,51,37,0.22)]">
              {/* confetti dots */}
              {['#C17B5C','#AEB080','#7DAA5A','#C28A90','#7AA4C2'].map((c, i) => (
                <motion.span key={i}
                  className="pointer-events-none absolute h-2 w-2 rounded-full"
                  style={{ background: c, top: -4, left: `${15 + i * 17}%` }}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: [-6, -20, 0], opacity: [1, 1, 0], scale: [1, 1.2, 0.5] }}
                  transition={{ duration: 1.1, delay: i * 0.08, ease: 'easeOut' }}
                />
              ))}
              <p className="font-serif text-[1.05rem] text-ink leading-snug">{celebration.title}</p>
              <p className="mt-1.5 text-[0.82rem] text-muted leading-relaxed">{celebration.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bottom add */}
      <AnimatePresence>
        {addingAfter === 'bottom' && (
          <AddRow inputRef={newInputRef} title={newTitle} date={newDate}
            onTitleChange={setNewTitle} onDateChange={setNewDate}
            onSave={commitAdd} onCancel={() => setAddingAfter(null)} />
        )}
      </AnimatePresence>
      <div className="mt-8 border-t border-b border-[var(--color-line)] py-5 text-center">
        <button onClick={() => openAdd('bottom')}
          className="flex items-center gap-2 mx-auto text-[0.72rem] uppercase tracking-widest text-muted hover:text-ink transition-colors cursor-pointer">
          <Plus size={12} /> Tilføj milepæl
        </button>
      </div>
    </div>
  );
}

function TimelineRow({ t, i, isDone, onToggle, onDelete, onInsertAfter, onDateChange }: {
  t: Task; i: number; isDone: boolean;
  onToggle: () => void; onDelete: () => void; onInsertAfter: () => void;
  onDateChange: (dateISO: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const diff = daysDiff(t.dateISO);
  const d = new Date(t.dateISO);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTHS_DA[d.getMonth()];

  const isWeddingDay = t.id === 't14';
  const isOverdue = diff < 0 && !isDone;
  const isUpcoming = diff >= 0 && !isDone && !isWeddingDay;

  const dotBg = isWeddingDay
    ? 'bg-ink text-canvas'
    : isDone
    ? 'bg-[#e8ddd9] text-ink-soft'
    : isOverdue
    ? 'bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta)]'
    : 'bg-shell text-ink-soft';

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(i * 0.04, 0.25) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex gap-5 border-b border-[var(--color-line)] py-6"
    >
      {/* date badge */}
      <div className={cn('relative z-10 flex shrink-0 flex-col items-center justify-center rounded-full w-[52px] h-[52px] text-center', dotBg)}>
        <span className="text-[1rem] font-serif leading-none">{day}</span>
        <span className="text-[0.55rem] uppercase tracking-wider mt-0.5">{mon}</span>
      </div>

      {/* content */}
      <div className="flex flex-1 items-start justify-between gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <button onClick={onToggle}
              role="checkbox" aria-checked={isDone}
              aria-label={isDone ? `Markér '${t.title}' som ikke færdig` : `Markér '${t.title}' som færdig`}
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all cursor-pointer hover:scale-110',
                isDone ? 'border-ink-soft bg-transparent' : 'border-[var(--color-line)] hover:border-ink-soft'
              )}>
              {isDone && (
                <span className="flex h-full w-full items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-soft" />
                </span>
              )}
            </button>
            <h3 className={cn(
              'font-serif text-[1.15rem] text-ink leading-snug',
              isDone && 'line-through text-muted'
            )}>
              {t.title}
            </h3>
          </div>
          {t.description && <p className="mt-1.5 ml-8 text-[0.82rem] text-muted leading-relaxed">{t.description}</p>}
          {/* row actions — always visible on touch, hover-revealed on desktop */}
          <div className={cn('mt-2 ml-8 flex items-center gap-4', !hovered && 'sm:hidden')}>
            <button onClick={onInsertAfter}
              className="flex items-center gap-1 py-1 text-[0.72rem] text-muted hover:text-ink transition-colors cursor-pointer">
              <Plus size={10} /> Indsæt under
            </button>
            <button onClick={onDelete} aria-label={`Slet '${t.title}'`}
              className="flex items-center gap-1 py-1 text-[0.72rem] text-muted hover:text-[var(--color-terracotta)] transition-colors cursor-pointer">
              <Trash2 size={10} /> Slet
            </button>
          </div>
        </div>

        {/* right: date + status */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            aria-label={`Ændr dato for '${t.title}'`}
            className="relative rounded-full border border-[var(--color-line)] px-3 py-1 text-[0.72rem] text-ink hover:border-ink hover:bg-shell transition-colors cursor-pointer"
          >
            {formatDate(t.dateISO)}
            <input
              ref={dateInputRef}
              type="date"
              value={t.dateISO}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
              tabIndex={-1}
            />
          </button>
          {!isDone && isOverdue && (
            <span className="hidden sm:inline-block rounded-full bg-[var(--color-terracotta-tint)] px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--color-terracotta)] whitespace-nowrap">
              {Math.abs(diff)} dage forsinket
            </span>
          )}
          {!isDone && isUpcoming && diff <= 60 && (
            <span className="hidden sm:inline-block rounded-full bg-shell px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-ink-soft whitespace-nowrap">
              Om {diff} dage
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function AddRow({ inputRef, title, date, onTitleChange, onDateChange, onSave, onCancel }: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  title: string; date: string;
  onTitleChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
      className="overflow-hidden border-b border-[var(--color-line)]"
    >
      <div className="flex gap-5 py-4 pl-4 sm:pl-[72px]">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <input ref={inputRef} value={title} onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
            placeholder="Milepælens navn…"
            aria-label="Navn på ny milepæl"
            className="flex-1 min-w-0 font-serif text-[1.05rem] text-ink bg-transparent border-b border-[var(--color-line)] pb-0.5 focus:outline-none focus:border-ink placeholder:text-muted"
          />
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)}
            aria-label="Dato for ny milepæl"
            className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[0.72rem] text-ink bg-transparent focus:outline-none focus:border-ink cursor-pointer"
          />
          <button onClick={onSave} aria-label="Gem milepæl"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
            <Check size={13} />
          </button>
          <button onClick={onCancel}
            className="text-[0.72rem] text-muted hover:text-ink transition-colors cursor-pointer">
            Annuller
          </button>
        </div>
      </div>
    </motion.li>
  );
}
