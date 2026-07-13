import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw, Plus, Trash2, Check, Search, MoreHorizontal,
  CalendarDays, ListChecks, AlertTriangle, CornerDownRight,
} from 'lucide-react';
import { TODAY, timeline as MOCK_TIMELINE } from '../data';
import { useWedding } from '../useWedding';
import { cn } from '../ui';

const AVA_CELEBRATION = 'Godt klaret. Ava har opdateret jeres fremdrift.';

const MONTHS_DA = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AUG','SEP','OKT','NOV','DEC'];

/* ── Wonder "Timeline Management" palette ─────────────────────────────── */
const C = {
  panel: '#fbfaf6',
  header: '#eeede6',
  line: '#d9d8ce',
  lineSoft: '#e2e0d7',
  ink: '#2d3b22',
  green: '#344524',
  muted: '#697158',
  sub: '#777b6b',
  riskBg: '#f3d8cf',
  riskInk: '#7b4032',
  riskEdge: '#c45a43',
  plannedBg: '#e5ead8',
  plannedInk: '#526044',
  doneBg: '#e7ede0',
  idleBg: '#eeede6',
  idleInk: '#626758',
} as const;

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
const STATUS_META: Record<Status, { label: string; pill: React.CSSProperties; marker: React.CSSProperties; check: string }> = {
  done:    { label: 'Færdig',   pill: { background: C.plannedBg, color: C.green },   marker: { background: C.doneBg,    color: C.green }, check: C.green },
  overdue: { label: 'Forsinket', pill: { background: C.riskBg, color: C.riskInk },   marker: { background: C.riskBg,    color: C.green }, check: C.riskEdge },
  planned: { label: 'Planlagt', pill: { background: C.plannedBg, color: C.plannedInk }, marker: { background: C.plannedBg, color: C.green }, check: '#bfc5b4' },
  wedding: { label: 'Dagen',    pill: { background: C.green, color: '#fff' },         marker: { background: C.green,     color: '#fff' },  check: C.green },
};

type Filter = 'alle' | 'kommende' | 'færdige';

export default function Planning() {
  const { loading, couple, timelineTasks, addTask, updateTask, deleteTask, seedTasks } = useWedding();
  const daysUntil = couple.dateISO
    ? Math.max(0, Math.round((new Date(couple.dateISO).getTime() - TODAY.getTime()) / 86400000))
    : 0;
  const [filter, setFilter] = useState<Filter>('alle');
  const [query, setQuery] = useState('');
  const [celebration, setCelebration] = useState<{ title: string; msg: string } | null>(null);
  const [addingAfter, setAddingAfter] = useState<string | null>(null); // task id or 'bottom'
  const [newTitle, setNewTitle] = useState('');
  const [newDate,  setNewDate]  = useState(new Date().toISOString().slice(0, 10));
  const [confirmReset, setConfirmReset] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const seededRef = useRef(false);

  // First visit with a set wedding date and no milestones → seed the plan once.
  useEffect(() => {
    if (loading || seededRef.current) return;
    if (timelineTasks.length === 0 && couple.dateISO) {
      seededRef.current = true;
      void seedTasks(defaultMilestones(couple.dateISO));
    }
  }, [loading, timelineTasks.length, couple.dateISO, seedTasks]);

  // Auto-cancel the reset confirmation if the user hesitates.
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
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const overdue = tasks.filter((t) => !t.done && !t.weddingDay && daysDiff(t.dateISO) < 0).length;

  const counts: Record<Filter, number> = {
    alle: tasks.length,
    kommende: tasks.filter((t) => !t.done).length,
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
    <div className="flex min-h-screen flex-col px-5 py-6 sm:px-8" style={{ background: '#f6f4ee' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 pb-[18px] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: C.muted }}>Planlægning</span>
          <h1 className="font-serif text-[clamp(1.9rem,4vw,2rem)] leading-[1.1] tracking-[-0.02em]" style={{ color: C.ink }}>Tidslinje</h1>
          <p className="text-[13px]" style={{ color: '#59614c' }}>
            Administrer deadlines og fremdrift på tværs af hele bryllupsplanen.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            onClick={handleReset}
            className={cn(
              'flex h-[42px] items-center gap-2 rounded-xl px-4 text-[13px] font-bold transition-colors cursor-pointer',
              confirmReset ? 'text-white' : 'bg-[#fbfaf6] text-[#38442d]',
            )}
            style={confirmReset ? { background: C.riskEdge } : { border: `1px solid ${C.line}` }}
          >
            <RotateCcw size={16} /> {confirmReset ? 'Sikker? Nulstil alt' : 'Nulstil'}
          </button>
          <button
            onClick={() => openAdd('bottom')}
            className="flex h-[42px] items-center gap-2 rounded-xl px-[17px] text-[13px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
            style={{ background: C.green, boxShadow: '0px 5px 14px rgba(52,69,36,0.18)' }}
          >
            <Plus size={17} /> Tilføj milepæl
          </button>
        </div>
      </div>

      {/* ── Oversight strip ────────────────────────────────────────────── */}
      <div className="mb-3.5 flex flex-col overflow-hidden rounded-xl sm:flex-row" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <Metric label="Milepæle" icon={<ListChecks size={18} />} className="sm:border-r" style={{ borderColor: C.lineSoft }}>
          <div className="flex items-end gap-[7px]">
            <span className="text-[23px] font-bold leading-none" style={{ color: C.ink }}>{tasks.length}</span>
            <span className="text-[11px]" style={{ color: C.muted }}>
              {couple.dateISO ? `${daysUntil} dage til dagen` : 'planlagt'}
            </span>
          </div>
        </Metric>

        <Metric label="Færdige" className="sm:border-r" style={{ borderColor: C.lineSoft }}
          right={<span className="text-xs font-bold" style={{ color: C.green }}>{done} / {tasks.length}</span>}>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#e7e5dc' }}>
            <motion.div className="h-full rounded-full" style={{ background: C.green }}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
          </div>
          <span className="mt-1.5 text-[11px]" style={{ color: C.muted }}>{pct} procent</span>
        </Metric>

        <Metric label="Kræver handling" tone="risk" icon={<AlertTriangle size={18} />}>
          <span className="text-[23px] font-bold leading-none" style={{ color: '#5b3026' }}>{overdue}</span>
          <span className="text-[11px]" style={{ color: C.riskInk }}>
            {overdue === 0 ? 'alt kører efter planen' : `${overdue} forsinket`}
          </span>
        </Metric>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="flex h-[38px] w-full items-center gap-[9px] rounded-[9px] px-3 sm:w-[260px]"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <Search size={16} style={{ color: C.sub }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg i milepæle"
            aria-label="Søg i milepæle"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#38442d] placeholder:text-[#777b6b] focus:outline-none"
          />
        </div>
        {(['alle', 'kommende', 'færdige'] as Filter[]).map((f) => {
          const active = filter === f;
          const label = f === 'alle' ? 'Alle' : f.charAt(0).toUpperCase() + f.slice(1);
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('flex h-[38px] items-center gap-1.5 rounded-[9px] px-[13px] text-xs font-semibold transition-colors cursor-pointer',
                active ? 'text-white' : 'text-[#4e5742]')}
              style={active ? { background: C.green } : { background: C.panel, border: `1px solid #d6d5cb` }}
            >
              {label}
              <span className={cn('text-[11px]', active ? 'text-white/70' : 'text-[#8a8f7c]')}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Register panel ─────────────────────────────────────────────── */}
      <div className="flex flex-col overflow-hidden rounded-xl" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        {/* column header (desktop) */}
        <div className="hidden items-center px-4 py-3 sm:flex" style={{ background: C.header, borderBottom: `1px solid ${C.line}` }}>
          <div className="flex w-[360px] shrink-0 flex-col">
            <span className="text-[13px] font-bold" style={{ color: C.ink }}>Milepæl</span>
            <span className="text-[10px]" style={{ color: C.muted }}>Opgave</span>
          </div>
          <div className="flex flex-1 items-center gap-4 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
            <span className="w-[132px]">Deadline</span>
            <span className="w-[96px]">Status</span>
            <span className="flex-1 text-right">Handling</span>
          </div>
        </div>

        {/* rows */}
        <div className="flex flex-col">
          {visible.length === 0 && (
            <div className="px-4 py-14 text-center">
              <p className="font-serif text-[1.15rem] italic" style={{ color: C.ink }}>
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
              <RegisterRow
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

          {/* inline add trigger */}
          <button
            onClick={() => openAdd('bottom')}
            className="flex items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold transition-colors hover:bg-[#f3f1ea] cursor-pointer"
            style={{ color: C.muted }}
          >
            <Plus size={15} /> Tilføj milepæl
          </button>
        </div>

        {/* footer */}
        <div className="flex h-11 items-center justify-between px-4" style={{ background: C.header }}>
          <span className="text-[11px] font-semibold" style={{ color: '#59614c' }}>
            Viser {visible.length} af {tasks.length} milepæle
          </span>
          <span className="text-[11px]" style={{ color: C.sub }}>{pct}% færdig</span>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 pt-2.5">
        <LegendDot color={C.riskEdge} label="Forsinket" />
        <LegendDot color={C.muted} label="Planlagt" />
        <LegendDot color={C.green} label="Færdig" />
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
            <div className="relative rounded-2xl px-6 py-5 shadow-[0_20px_60px_-10px_rgba(46,51,37,0.22)]"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              {['#C17B5C','#AEB080','#7DAA5A','#C28A90','#7AA4C2'].map((c, i) => (
                <motion.span key={i}
                  className="pointer-events-none absolute h-2 w-2 rounded-full"
                  style={{ background: c, top: -4, left: `${15 + i * 17}%` }}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: [-6, -20, 0], opacity: [1, 1, 0], scale: [1, 1.2, 0.5] }}
                  transition={{ duration: 1.1, delay: i * 0.08, ease: 'easeOut' }}
                />
              ))}
              <p className="font-serif text-[1.05rem] leading-snug" style={{ color: C.ink }}>{celebration.title}</p>
              <p className="mt-1.5 text-[0.82rem] leading-relaxed" style={{ color: C.muted }}>{celebration.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Metric cell ──────────────────────────────────────────────────────── */
function Metric({ label, children, icon, right, tone, className, style }: {
  label: string; children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode;
  tone?: 'risk'; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('flex min-h-[74px] flex-1 flex-col justify-center gap-[3px] border-b px-[18px] py-3 sm:border-b-0', className)}
      style={{ ...(tone === 'risk' ? { background: C.riskBg } : {}), ...style }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: tone === 'risk' ? C.riskInk : C.muted }}>{label}</span>
        {right ?? (icon && <span style={{ color: tone === 'risk' ? '#c98a7c' : '#566146' }}>{icon}</span>)}
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-[5px]">
      <span className="h-[9px] w-[9px] rounded-full" style={{ background: color }} />
      <span className="text-[10px]" style={{ color: C.muted }}>{label}</span>
    </span>
  );
}

/* ── One milestone row ────────────────────────────────────────────────── */
function RegisterRow({ t, menuOpen, onMenu, onCloseMenu, onToggle, onDelete, onInsertAfter, onDateChange }: {
  t: DisplayTask; menuOpen: boolean; onMenu: () => void; onCloseMenu: () => void;
  onToggle: () => void; onDelete: () => void; onInsertAfter: () => void; onDateChange: (dateISO: string) => void;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const d = new Date(t.dateISO);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTHS_DA[d.getMonth()];
  const diff = daysDiff(t.dateISO);
  const status = statusOf(t);
  const meta = STATUS_META[status];

  const subtitle =
    status === 'wedding' ? 'Den store dag'
    : status === 'done' ? 'Færdig'
    : diff < 0 ? `${Math.abs(diff)} dage forsinket`
    : diff === 0 ? 'I dag'
    : `Om ${diff} dage`;

  return (
    <div className="flex min-h-[66px] flex-wrap items-center gap-3 px-4 py-2.5"
      style={{ borderBottom: `1px solid ${C.lineSoft}`, background: status === 'overdue' ? '#fff8f5' : undefined }}>
      {/* date marker */}
      <div className="flex size-[38px] shrink-0 flex-col items-center justify-center rounded-[9px]" style={meta.marker}>
        <span className="font-serif text-lg leading-none">{day}</span>
        <span className="text-[9px] font-bold tracking-[0.08em]" style={{ color: status === 'wedding' ? 'rgba(255,255,255,0.8)' : '#647054' }}>{mon}</span>
      </div>

      {/* checkbox */}
      <button
        onClick={onToggle}
        role="checkbox" aria-checked={t.done}
        aria-label={t.done ? `Markér '${t.title}' som ikke færdig` : `Markér '${t.title}' som færdig`}
        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 cursor-pointer"
        style={{ borderColor: meta.check, background: t.done ? C.green : 'transparent' }}
      >
        {t.done && <Check size={12} color="#fff" strokeWidth={3} />}
      </button>

      {/* title + subtitle */}
      <div className="flex min-w-0 flex-1 flex-col gap-px sm:w-[298px] sm:flex-none">
        <span className={cn('truncate text-[13px] font-bold', t.done && 'line-through')} style={{ color: t.done ? C.muted : C.ink }}>
          {t.title}
        </span>
        <span className="text-[10px]" style={{ color: C.sub }}>{subtitle}</span>
      </div>

      {/* deadline + status + menu */}
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={() => dateInputRef.current?.showPicker?.()}
          aria-label={`Ændr dato for '${t.title}'`}
          className="relative flex h-[30px] w-[132px] items-center gap-1.5 rounded-lg px-2.5 text-[12px] transition-colors hover:bg-[#f3f1ea] cursor-pointer"
          style={{ color: C.ink, border: `1px solid ${C.line}` }}
        >
          <CalendarDays size={13} style={{ color: C.sub }} />
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

        <span className="w-[96px] shrink-0">
          <span className="inline-block rounded-full px-[9px] py-[5px] text-center text-[9px] font-bold uppercase tracking-[0.06em]" style={meta.pill}>
            {meta.label}
          </span>
        </span>

        <div className="relative flex flex-1 justify-end">
          <button
            onClick={onMenu}
            aria-label={`Handlinger for '${t.title}'`}
            className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-[#f0efe8] cursor-pointer"
            style={{ color: C.sub }}
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
                  className="absolute right-0 top-9 z-50 w-[168px] overflow-hidden rounded-xl bg-white py-1 shadow-[0_16px_40px_-12px_rgba(20,26,19,0.4)]"
                  style={{ border: `1px solid ${C.line}` }}
                >
                  <button onClick={onInsertAfter}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#f5f3ec] cursor-pointer" style={{ color: C.ink }}>
                    <CornerDownRight size={14} style={{ color: C.sub }} /> Indsæt under
                  </button>
                  <button onClick={onDelete}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#fbeeea] cursor-pointer" style={{ color: C.riskInk }}>
                    <Trash2 size={14} /> Slet milepæl
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
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
      style={{ borderBottom: `1px solid ${C.lineSoft}`, background: '#f6f8f1' }}
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[9px]" style={{ background: C.plannedBg, color: C.green }}>
          <Plus size={18} />
        </div>
        <input
          ref={inputRef} value={title} onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
          placeholder="Milepælens navn…"
          aria-label="Navn på ny milepæl"
          className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-[13px] font-semibold text-[#2d3b22] placeholder:text-[#9aa08c] focus:outline-none"
          style={{ border: `1px solid ${C.line}` }}
        />
        <input
          type="date" value={date} onChange={(e) => onDateChange(e.target.value)}
          aria-label="Dato for ny milepæl"
          className="rounded-lg bg-white px-3 py-2 text-[12px] text-[#2d3b22] focus:outline-none cursor-pointer"
          style={{ border: `1px solid ${C.line}` }}
        />
        <button onClick={onSave} aria-label="Gem milepæl"
          className="flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-bold text-white transition-transform hover:scale-[1.02] cursor-pointer"
          style={{ background: C.green }}>
          <Check size={15} /> Gem
        </button>
        <button onClick={onCancel}
          className="text-[13px] font-medium transition-colors hover:text-[#2d3b22] cursor-pointer" style={{ color: C.sub }}>
          Annuller
        </button>
      </div>
    </motion.div>
  );
}
