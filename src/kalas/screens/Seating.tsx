import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Plus, X, Minus, Check, ChevronDown, Trash2, Sparkles, GripVertical } from 'lucide-react';
import { Eyebrow, Pill, Chip, cn } from '../ui';
import OnboardingHint from '../OnboardingHint';
import { useLang } from '../i18n';
import { useWedding } from '../useWedding';

/* ── Types ─────────────────────────────────────────────────────────── */
type Shape = 'round' | 'rect' | 'horseshoe';

type TableDef = {
  id: string;
  name: string;
  shape: Shape;
  capacity: number;
  guestIds: string[];
};

type Guest = { id: string; name: string; group: string };

/* ── Shape config ─────────────────────────────────────────────────── */
const SHAPE_META: Record<Shape, { label: string; defaultCap: number; desc: string }> = {
  round:      { label: 'Rundt bord',  defaultCap: 8,  desc: 'Typisk 6–12 gæster' },
  rect:       { label: 'Langbord',    defaultCap: 12, desc: 'Typisk 8–20 gæster' },
  horseshoe:  { label: 'Hestesko',    defaultCap: 20, desc: 'Typisk 14–30 gæster' },
};

/* ── Guest groups + roster ─────────────────────────────────────────── */
const GROUP_COLORS: Record<string, string> = {
  'Emmas familie':      '#6A8C5A',
  'Frederiks familie':  '#9B7040',
  'Venner':             '#4A7A9B',
  'Emmas kolleger':     '#8A5A6A',
  'Frederiks kolleger': '#5A7A5A',
  'Brudepar':           '#314523',
};

// Stable colour for any group label (real guest sides fall outside the map).
const GROUP_PALETTE = ['#6A8C5A', '#9B7040', '#4A7A9B', '#8A5A6A', '#5A7A5A', '#314523', '#7A6A9B'];
function colorFor(group: string): string {
  if (GROUP_COLORS[group]) return GROUP_COLORS[group];
  let h = 0;
  for (let i = 0; i < group.length; i++) h = (h * 31 + group.charCodeAt(i)) >>> 0;
  return GROUP_PALETTE[h % GROUP_PALETTE.length];
}

const ALL_GUESTS: Guest[] = [
  { id: 'b1',  name: 'Emma',          group: 'Brudepar' },
  { id: 'b2',  name: 'Frederik',      group: 'Brudepar' },
  { id: 'ef1', name: 'Kirsten H.',    group: 'Emmas familie' },
  { id: 'ef2', name: 'Steen H.',      group: 'Emmas familie' },
  { id: 'ef3', name: 'Louise H.',     group: 'Emmas familie' },
  { id: 'ef4', name: 'Peter H.',      group: 'Emmas familie' },
  { id: 'ef5', name: 'Mia A.',        group: 'Emmas familie' },
  { id: 'ef6', name: 'Lars A.',       group: 'Emmas familie' },
  { id: 'ef7', name: 'Sofia L.',      group: 'Emmas familie' },
  { id: 'ef8', name: 'Thomas L.',     group: 'Emmas familie' },
  { id: 'ff1', name: 'Birgit N.',     group: 'Frederiks familie' },
  { id: 'ff2', name: 'Jens N.',       group: 'Frederiks familie' },
  { id: 'ff3', name: 'Marie P.',      group: 'Frederiks familie' },
  { id: 'ff4', name: 'Ole P.',        group: 'Frederiks familie' },
  { id: 'ff5', name: 'Trine R.',      group: 'Frederiks familie' },
  { id: 'ff6', name: 'Klaus R.',      group: 'Frederiks familie' },
  { id: 'v1',  name: 'Julie W.',      group: 'Venner' },
  { id: 'v2',  name: 'Mikkel W.',     group: 'Venner' },
  { id: 'v3',  name: 'Sara X.',       group: 'Venner' },
  { id: 'v4',  name: 'Jonas X.',      group: 'Venner' },
  { id: 'v5',  name: 'Camilla Y.',    group: 'Venner' },
  { id: 'v6',  name: 'Andreas Y.',    group: 'Venner' },
  { id: 'v7',  name: 'Ida Z.',        group: 'Venner' },
  { id: 'v8',  name: 'Tobias Z.',     group: 'Venner' },
  { id: 'ek1', name: 'Rikke Ah.',     group: 'Emmas kolleger' },
  { id: 'ek2', name: 'Simon Ah.',     group: 'Emmas kolleger' },
  { id: 'ek3', name: 'Louise Ai.',    group: 'Emmas kolleger' },
  { id: 'ek4', name: 'Christian Ai.', group: 'Emmas kolleger' },
  { id: 'fk1', name: 'Birthe An.',    group: 'Frederiks kolleger' },
  { id: 'fk2', name: 'Preben An.',    group: 'Frederiks kolleger' },
  { id: 'fk3', name: 'Gitte Ao.',     group: 'Frederiks kolleger' },
  { id: 'fk4', name: 'Carsten Ao.',   group: 'Frederiks kolleger' },
];

/* ── Initial state ─────────────────────────────────────────────────── */
const INIT_TABLES: TableDef[] = [
  { id: 'head', name: 'Brudebordet', shape: 'rect',  capacity: 10, guestIds: [] },
  { id: 't1',   name: 'Bord 1',      shape: 'round', capacity: 8,  guestIds: [] },
  { id: 't2',   name: 'Bord 2',      shape: 'round', capacity: 8,  guestIds: [] },
  { id: 't3',   name: 'Bord 3',      shape: 'round', capacity: 8,  guestIds: [] },
];

/* ── Floor plan layout ─────────────────────────────────────────────── */
// Max 4 regular tables per row; head table always at top center
const ROW_XS   = [80, 215, 425, 560];     // x positions for 4-column grid
const ROW_YS   = [150, 260, 365];          // y positions for 3 rows
const VIEW_W   = 640;
const VIEW_H   = 410;

function tablePositions(tables: TableDef[]) {
  const regular = tables.filter((t) => t.id !== 'head');
  return regular.map((t, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const rowCount = Math.min(4, regular.length - row * 4);
    // center fewer tables in the row
    const totalRowW = ROW_XS[rowCount - 1] - ROW_XS[0];
    const offsetX = (VIEW_W - totalRowW - ROW_XS[0] * 2) / 2;
    return { id: t.id, cx: ROW_XS[col] + Math.max(0, offsetX), cy: ROW_YS[Math.min(row, 2)] };
  });
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */
export default function Seating() {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const { loading, guests, seatingPlan, saveSeating } = useWedding();
  const [tables, setTables]     = useState<TableDef[]>(INIT_TABLES);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [activeId, setActiveId] = useState<string>('t1');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Per-instance id counter (avoids a module-global that collides on remount).
  const idRef = useRef(10);
  const mkId = () => `t${idRef.current++}`;

  // Seat the real guest list; fall back to the demo roster only when the
  // couple hasn't added anyone yet.
  const pool: Guest[] = guests.length
    ? guests.map((g) => ({ id: g.id, name: g.name, group: g.side || 'Gæster' }))
    : ALL_GUESTS;

  // Hydrate the saved plan once, then autosave (debounced) as it changes.
  const readyRef = useRef(false);
  useEffect(() => {
    if (readyRef.current || loading) return;
    readyRef.current = true;
    const d = (seatingPlan?.data ?? {}) as { tables?: TableDef[]; positions?: Record<string, { x: number; y: number }>; activeId?: string };
    if (d.tables) setTables(d.tables);
    if (d.positions) setPositions(d.positions);
    if (d.activeId) setActiveId(d.activeId);
  }, [loading, seatingPlan]);

  const planData = useMemo(() => ({ tables, positions, activeId }), [tables, positions, activeId]);
  useEffect(() => {
    if (!readyRef.current) return;
    const t = setTimeout(() => { void saveSeating(planData); }, 800);
    return () => clearTimeout(t);
  }, [planData, saveSeating]);

  const moveTable = (id: string, x: number, y: number) =>
    setPositions((prev) => ({ ...prev, [id]: { x, y } }));

  const assignedIds = new Set(tables.flatMap((t) => t.guestIds));
  const unassigned  = pool.filter((g) => !assignedIds.has(g.id));
  const totalSeated = assignedIds.size;
  const activeTable = tables.find((t) => t.id === activeId);

  // A drag is one gesture: the window listeners below close over this render's
  // `tables`/`activeId`, which is exactly the state at pointer-down.
  const hasRoom = (id: string | null): boolean => {
    if (!id) return false;
    const tb = tables.find((t) => t.id === id);
    return !!tb && tb.guestIds.length < tb.capacity;
  };

  /* ── Table mutations ─────────────────────────────────────────────── */
  const addTable = (shape: Shape) => {
    const num = tables.filter((t) => t.id !== 'head').length + 1;
    setTables((prev) => [
      ...prev,
      { id: mkId(), name: `Bord ${num}`, shape, capacity: SHAPE_META[shape].defaultCap, guestIds: [] },
    ]);
  };

  const removeTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) setActiveId(tables.find((t) => t.id !== id)?.id ?? '');
  };

  const setShape = (id: string, shape: Shape) => {
    setTables((prev) => prev.map((t) =>
      t.id === id ? { ...t, shape, capacity: SHAPE_META[shape].defaultCap } : t
    ));
  };

  const setCapacity = (id: string, delta: number) => {
    setTables((prev) => prev.map((t) =>
      t.id === id ? { ...t, capacity: Math.max(2, Math.min(40, t.capacity + delta)) } : t
    ));
  };

  // Assign to a specific table (drag drop). Ignores full/duplicate.
  const assignToTable = (tableId: string, guestId: string) => {
    setTables((prev) => prev.map((tbl) =>
      tbl.id === tableId && !tbl.guestIds.includes(guestId) && tbl.guestIds.length < tbl.capacity
        ? { ...tbl, guestIds: [...tbl.guestIds, guestId] }
        : tbl
    ));
  };

  // Click / keyboard fallback: assign to the currently selected table.
  const assignToActive = (guestId: string) => {
    if (hasRoom(activeId)) assignToTable(activeId, guestId);
  };

  const unassignGuest = (tableId: string, guestId: string) => {
    setTables((prev) => prev.map((t) =>
      t.id === tableId ? { ...t, guestIds: t.guestIds.filter((id) => id !== guestId) } : t
    ));
  };

  /* ── Drag a guest from the pool onto a table on the floor plan ─────── */
  const [dragGuest, setDragGuest] = useState<Guest | null>(null);
  const [hoverTableId, setHoverTableId] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const tableUnderPoint = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-table-id]');
    return el?.getAttribute('data-table-id') ?? null;
  };

  const startGuestDrag = (guest: Guest, e: React.PointerEvent) => {
    if (assignedIds.has(guest.id)) return;
    const sx = e.clientX, sy = e.clientY;
    let dragging = false;
    const move = (ev: PointerEvent) => {
      if (!dragging) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; // click vs drag
        dragging = true;
        setDragGuest(guest);
      }
      setGhostPos({ x: ev.clientX, y: ev.clientY });
      const id = tableUnderPoint(ev.clientX, ev.clientY);
      setHoverTableId(hasRoom(id) ? id : null);
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (dragging) {
        const id = tableUnderPoint(ev.clientX, ev.clientY);
        if (hasRoom(id)) assignToTable(id as string, guest.id);
      } else {
        assignToActive(guest.id); // treated as a tap → click fallback
      }
      setDragGuest(null); setHoverTableId(null); setGhostPos(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /* Ava auto-seat: keep groups together — prefer tables that already hold
     the same group, then the emptiest table; add round tables if needed. */
  const autoSeat = () => {
    setTables((prev) => {
      const next = prev.map((t) => ({ ...t, guestIds: [...t.guestIds] }));
      const seated = new Set(next.flatMap((t) => t.guestIds));
      const guestGroup = Object.fromEntries(pool.map((g) => [g.id, g.group]));

      for (const g of pool) {
        if (seated.has(g.id)) continue;
        let target = next
          .filter((t) => t.guestIds.length < t.capacity)
          .sort((a, b) => {
            const aGrp = a.guestIds.some((id) => guestGroup[id] === g.group) ? 1 : 0;
            const bGrp = b.guestIds.some((id) => guestGroup[id] === g.group) ? 1 : 0;
            if (aGrp !== bGrp) return bGrp - aGrp;
            return (b.capacity - b.guestIds.length) - (a.capacity - a.guestIds.length);
          })[0];
        if (!target) {
          const num = next.filter((t) => t.id !== 'head').length + 1;
          target = { id: mkId(), name: `Bord ${num}`, shape: 'round', capacity: 8, guestIds: [] };
          next.push(target);
        }
        target.guestIds.push(g.id);
        seated.add(g.id);
      }
      return next;
    });
  };

  /* ── Groups of guests by group label ──────────────────────────────── */
  const groups = Array.from(new Set(pool.map((g) => g.group))).map((grp) => ({
    name: grp,
    color: colorFor(grp),
    guests: pool.filter((g) => g.group === grp),
  }));

  const pct = pool.length ? Math.round((totalSeated / pool.length) * 100) : 0;

  return (
    <div className="pb-24">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-6 py-8 sm:px-9 lg:px-12 lg:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[clamp(2rem,4vw,2.4rem)] leading-[1.1] tracking-[-0.02em] text-[#314523]">
              {t('Bordplan')}
            </h1>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#6c7561]">
              {t('Træk en gæst fra listen ud på et bord — eller vælg et bord og tryk på gæsten. Træk bordene rundt, som salen står.')}
            </p>
          </div>
          {unassigned.length > 0 && (
            <Pill variant="solid" onClick={autoSeat} className="shrink-0">
              <Sparkles size={13} /> {t('Lad Ava placere resten ({n})', { n: unassigned.length })}
            </Pill>
          )}
        </div>

        {/* Stats + progress */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <StatTile label={t('Placeret')} value={`${totalSeated} / ${pool.length}`} />
          <StatTile label={t('Borde')} value={tables.length} />
          <StatTile label={t('Total kapacitet')} value={tables.reduce((a, tb) => a + tb.capacity, 0)} />
          <div className="ml-auto w-full max-w-xs self-center">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="eyebrow text-[0.62rem]">{t('Placeret')}</span>
              <span className="text-[0.74rem] text-muted">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-shell">
              <motion.div animate={{ width: `${pct}%` }}
                transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-sage" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Plan (left) + guest pool (right, sticky on desktop) ───────── */}
      <div className="px-6 sm:px-9 lg:px-12 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:items-start">
        <div className="min-w-0">
          {/* Add table bar */}
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <Eyebrow className="mr-1">{t('Tilføj bord')}</Eyebrow>
            {(Object.entries(SHAPE_META) as [Shape, typeof SHAPE_META[Shape]][]).map(([shape, meta]) => (
              <button key={shape} onClick={() => addTable(shape)}
                className="flex min-h-[40px] items-center gap-2 rounded-full rule bg-card px-4 py-2 text-[0.82rem] font-medium text-ink-soft hover:bg-shell hover:text-ink transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40">
                <Plus size={13} />
                <ShapeIcon shape={shape} size={14} />
                {t(meta.label)}
              </button>
            ))}
          </div>

          {/* Floor plan */}
          <FloorPlan tables={tables} activeId={activeId} onSelect={setActiveId}
            positions={positions} onMove={moveTable}
            dragging={Boolean(dragGuest)} hoverTableId={hoverTableId} />
          <div className="mt-3 flex flex-wrap gap-4">
            {(Object.entries(SHAPE_META) as [Shape, typeof SHAPE_META[Shape]][]).map(([shape, meta]) => (
              <div key={shape} className="flex items-center gap-1.5">
                <ShapeIcon shape={shape} size={13} className="text-muted" />
                <span className="text-[0.72rem] text-muted">{t(meta.label)}</span>
              </div>
            ))}
            <div className="ml-auto text-[0.72rem] text-muted">{t('Klik for at vælge · træk for at flytte bordet')}</div>
          </div>

          {/* Table cards */}
          <div className="mt-10">
            <Eyebrow className="mb-5">{t('Borde · {n} i alt', { n: tables.length })}</Eyebrow>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tables.map((tb) => (
                <TableCard
                  key={tb.id}
                  table={tb}
                  guests={pool}
                  isActive={activeId === tb.id}
                  isExpanded={expanded === tb.id}
                  isDropTarget={hoverTableId === tb.id}
                  onSelect={() => { setActiveId(tb.id); setExpanded(tb.id); }}
                  onToggleExpand={() => setExpanded(expanded === tb.id ? null : tb.id)}
                  onShapeChange={(s) => setShape(tb.id, s)}
                  onCapacityChange={(d) => setCapacity(tb.id, d)}
                  onRemoveGuest={(gId) => unassignGuest(tb.id, gId)}
                  onDelete={tb.id !== 'head' ? () => removeTable(tb.id) : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Guest pool */}
        <div className="mt-10 lg:mt-0 lg:sticky lg:top-6">
          <div className="rule rounded-2xl overflow-hidden">
            <div className="bg-card px-5 py-4 rule-b">
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>{t('Gæsteliste')}</Eyebrow>
                <Chip tone={unassigned.length ? 'neutral' : 'success'}>
                  {t('{n} uplacerede', { n: unassigned.length })}
                </Chip>
              </div>
              <p className="mt-1.5 text-[0.8rem] leading-relaxed text-muted">
                {activeTable && activeTable.guestIds.length >= activeTable.capacity
                  ? t('{name} er fuldt — træk til et andet bord', { name: t(activeTable.name) })
                  : t('Træk en gæst ud på bordplanen — eller tryk for at sætte ved {name}', { name: t(activeTable?.name ?? 'det valgte bord') })}
              </p>
            </div>
            <div className="max-h-[62vh] overflow-y-auto divide-y divide-[var(--color-line)]">
              {groups.map((grp) => (
                <GuestGroup
                  key={grp.name}
                  group={grp}
                  assignedIds={assignedIds}
                  activeTable={activeTable}
                  reduce={Boolean(reduce)}
                  onGuestPointerDown={startGuestDrag}
                  onAssignActive={assignToActive}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating drag ghost */}
      {dragGuest && ghostPos && (
        <div aria-hidden
          style={{ position: 'fixed', left: ghostPos.x, top: ghostPos.y, transform: 'translate(-50%, -150%)', pointerEvents: 'none', zIndex: 60 }}
          className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[0.82rem] text-canvas shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)]">
          <span className="h-2 w-2 rounded-full" style={{ background: colorFor(dragGuest.group) }} />
          {dragGuest.name}
        </div>
      )}

      <OnboardingHint id="seating" />
    </div>
  );
}

/* ── Floor plan — tables are draggable ───────────────────────────────── */
function FloorPlan({
  tables, activeId, onSelect, positions, onMove, dragging = false, hoverTableId = null,
}: {
  tables: TableDef[]; activeId: string; onSelect: (id: string) => void;
  positions: Record<string, { x: number; y: number }>;
  onMove: (id: string, x: number, y: number) => void;
  dragging?: boolean;
  hoverTableId?: string | null;
}) {
  const { t } = useLang();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const computed = tablePositions(tables);
  const posMap: Record<string, { cx: number; cy: number }> = Object.fromEntries(
    computed.map((p) => [p.id, { cx: positions[p.id]?.x ?? p.cx, cy: positions[p.id]?.y ?? p.cy }])
  );
  const headPos = { cx: positions['head']?.x ?? VIEW_W / 2, cy: positions['head']?.y ?? 50 };

  /* Convert a pointer event to viewBox coordinates */
  const toSvg = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
    };
  };

  const startDrag = (id: string, cx: number, cy: number) => (e: React.PointerEvent) => {
    onSelect(id);
    const p = toSvg(e);
    dragRef.current = { id, dx: cx - p.x, dy: cy - p.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handleMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toSvg(e);
    const isHead = d.id === 'head';
    const padX = isHead ? 130 : 45;
    const x = Math.max(padX, Math.min(VIEW_W - padX, p.x + d.dx));
    const y = Math.max(isHead ? 42 : 55, Math.min(VIEW_H - 50, p.y + d.dy));
    onMove(d.id, x, y);
  };

  const endDrag = () => { dragRef.current = null; };

  return (
    <div className="rule rounded-2xl bg-[#f7f5f0] overflow-hidden">
      <svg ref={svgRef} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full"
        style={{ maxHeight: 380, touchAction: 'none' }}
        onPointerMove={handleMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
        {/* Room boundary */}
        <rect x="10" y="10" width={VIEW_W - 20} height={VIEW_H - 20} rx="16"
          fill="#f7f5f0" stroke="#dedad2" strokeWidth="1.5" />

        {/* Dance floor */}
        <rect x="252" y="172" width="136" height="96" rx="12"
          fill="#edeae0" stroke="#d4d0c6" strokeWidth="1" strokeDasharray="6 4" />
        <text x="320" y="225" fill="#b4af9e" fontSize="8" textAnchor="middle"
          fontFamily="Hanken Grotesk, sans-serif" letterSpacing="2">{t('DANSEGULV')}</text>

        {/* Entrance line */}
        <line x1="270" y1={VIEW_H - 13} x2="370" y2={VIEW_H - 13}
          stroke="#d0ccc0" strokeWidth="2.5" strokeLinecap="round" />
        <text x="320" y={VIEW_H - 2} fill="#c4c0b4" fontSize="7.5" textAnchor="middle"
          fontFamily="Hanken Grotesk, sans-serif" letterSpacing="2">{t('INDGANG')}</text>

        {/* Head table */}
        {(() => {
          const head = tables.find((t) => t.id === 'head');
          if (!head) return null;
          const isActive = activeId === 'head';
          const filled   = head.guestIds.length;
          const cap      = head.capacity;
          const isHover  = hoverTableId === 'head';
          const canDrop  = dragging && filled < cap;
          const { cx, cy } = headPos;
          return (
            <g data-table-id="head" className="cursor-grab active:cursor-grabbing"
              onPointerDown={startDrag('head', cx, cy)}>
              {(isActive || isHover) && <rect x={cx - 127} y={cy - 26} width="254" height="52" rx="26"
                fill="none" stroke="#314523" strokeWidth={isHover ? 3 : 2} opacity={isHover ? 0.9 : 0.35} />}
              {canDrop && !isHover && <rect x={cx - 127} y={cy - 26} width="254" height="52" rx="26"
                fill="none" stroke="#314523" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.4" />}
              <rect x={cx - 120} y={cy - 22} width="240" height="44" rx="22"
                fill={isActive ? '#314523' : '#31452320'}
                stroke="#314523" strokeWidth={isActive ? 0 : 1.5} />
              {/* Seat count indicator */}
              <text x={cx} y={cy - 5} fill={isActive ? '#f7f5efcc' : '#31452399'}
                fontSize="8" textAnchor="middle"
                fontFamily="Hanken Grotesk, sans-serif" letterSpacing="2">{t('BRUDEBORDET')}</text>
              <text x={cx} y={cy + 11} fill={isActive ? '#f7f5ef80' : '#31452360'}
                fontSize="8" textAnchor="middle" fontFamily="Hanken Grotesk, sans-serif">
                {t('{filled}/{cap} gæster', { filled, cap })}
              </text>
            </g>
          );
        })()}

        {/* Regular tables */}
        {tables.filter((tbl) => tbl.id !== 'head').map((tbl) => {
          const pos = posMap[tbl.id];
          if (!pos) return null;
          const { cx, cy } = pos;
          const isActive   = activeId === tbl.id;
          const fillPct    = tbl.guestIds.length / tbl.capacity;
          const col        = '#314523';
          const bgAlpha    = isActive ? 'cc' : '22';
          const strokeAlpha = isActive ? '' : '66';
          const isHover    = hoverTableId === tbl.id;
          const canDrop    = dragging && tbl.guestIds.length < tbl.capacity;

          return (
            <g key={tbl.id} data-table-id={tbl.id} className="cursor-grab active:cursor-grabbing"
              onPointerDown={startDrag(tbl.id, cx, cy)}>
              {/* Drop-target ring while dragging a guest */}
              {isHover && <TableShape shape={tbl.shape} cx={cx} cy={cy} r={36} fill="none"
                stroke={col} strokeWidth={3} opacity={0.9} />}
              {canDrop && !isHover && <TableShape shape={tbl.shape} cx={cx} cy={cy} r={34} fill="none"
                stroke={col} strokeWidth={1.5} opacity={0.4} />}
              {/* Active glow ring */}
              {isActive && !isHover && <TableShape shape={tbl.shape} cx={cx} cy={cy} r={32} fill="none"
                stroke={col} strokeWidth={2} opacity={0.3} />}

              {/* Table body */}
              <TableShape shape={tbl.shape} cx={cx} cy={cy} r={22}
                fill={`${col}${bgAlpha}`}
                stroke={`${col}${strokeAlpha}`} strokeWidth={1.5} />

              {/* Fill overlay */}
              {fillPct > 0 && (
                <TableShape shape={tbl.shape} cx={cx} cy={cy} r={22}
                  fill={col} opacity={fillPct * 0.35} />
              )}

              {/* Seat dots */}
              {Array.from({ length: Math.min(tbl.capacity, 12) }).map((_, i) => {
                const n     = Math.min(tbl.capacity, 12);
                const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
                const dR    = tbl.shape === 'round' ? 30 : tbl.shape === 'rect' ? 28 : 26;
                const filled = i < (tbl.guestIds.length / tbl.capacity) * n;
                return (
                  <circle key={i}
                    cx={cx + Math.cos(angle) * dR}
                    cy={cy + Math.sin(angle) * dR}
                    r={3}
                    fill={filled ? col : 'none'}
                    stroke={col} strokeWidth={0.8}
                    opacity={filled ? 0.8 : 0.3} />
                );
              })}

              {/* Number label */}
              <text x={cx} y={cy + 4}
                fill={isActive ? '#f7f5efdd' : '#31452399'}
                fontSize="9.5" textAnchor="middle" fontWeight="600"
                fontFamily="Hanken Grotesk, sans-serif">
                {tbl.name.replace('Bord ', '')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── SVG table shape renderer ────────────────────────────────────────── */
function TableShape({
  shape, cx, cy, r, fill, stroke, strokeWidth, opacity,
}: {
  shape: Shape; cx: number; cy: number; r: number;
  fill?: string; stroke?: string; strokeWidth?: number; opacity?: number;
}) {
  const p = { fill, stroke, strokeWidth, opacity };
  if (shape === 'round') {
    return <circle cx={cx} cy={cy} r={r} {...p} />;
  }
  if (shape === 'rect') {
    return <rect x={cx - r * 1.8} y={cy - r * 0.72} width={r * 3.6} height={r * 1.44} rx={r * 0.36} {...p} />;
  }
  // horseshoe
  const ri = r * 0.42;
  const d = [
    `M ${cx - r} ${cy - r * 0.3}`,
    `L ${cx - r} ${cy + ri}`,
    `A ${r} ${r} 0 0 0 ${cx + r} ${cy + ri}`,
    `L ${cx + r} ${cy - r * 0.3}`,
    `L ${cx + r - ri * 1.6} ${cy - r * 0.3}`,
    `A ${ri * 1.6} ${ri * 1.6} 0 0 1 ${cx - r + ri * 1.6} ${cy - r * 0.3}`,
    'Z',
  ].join(' ');
  return <path d={d} {...p} />;
}

/* ── Table card ──────────────────────────────────────────────────────── */
function TableCard({
  table, guests, isActive, isExpanded, isDropTarget = false,
  onSelect, onToggleExpand, onShapeChange, onCapacityChange, onRemoveGuest, onDelete,
}: {
  table: TableDef;
  guests: Guest[];
  isActive: boolean;
  isExpanded: boolean;
  isDropTarget?: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onShapeChange: (s: Shape) => void;
  onCapacityChange: (delta: number) => void;
  onRemoveGuest: (id: string) => void;
  onDelete?: () => void;
}) {
  const { t } = useLang();
  const filled   = table.guestIds.length;
  const cap      = table.capacity;
  const isFull   = filled >= cap;
  const tableGuests = table.guestIds.map((id) => guests.find((g) => g.id === id)).filter(Boolean) as Guest[];
  const isHead   = table.id === 'head';

  return (
    <motion.div layout
      className={cn('rule rounded-2xl overflow-hidden transition-all duration-200',
        isDropTarget ? 'ring-2 ring-sage-strong ring-offset-2 ring-offset-canvas'
          : isActive && 'ring-2 ring-ink ring-offset-2 ring-offset-canvas')}>

      {/* Card header — click to select */}
      <div
        className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-card/30 transition-colors"
        onClick={onSelect}>
        {/* Shape + fill visual */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card">
            <ShapeIcon shape={table.shape} size={18} className="text-ink-soft" />
          </div>
          {/* mini fill bar */}
          <div className="h-1 w-9 overflow-hidden rounded-full bg-shell">
            <div className="h-full rounded-full bg-ink transition-all duration-500"
              style={{ width: `${(filled / cap) * 100}%` }} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[1.05rem] text-ink truncate">{t(table.name)}</span>
            {isFull && <Chip tone="sage">{t('Fuld')}</Chip>}
          </div>
          <div className="mt-1 text-[0.72rem] text-muted">{t(SHAPE_META[table.shape].label)}</div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={cn('font-serif text-[1.25rem] leading-none',
            isFull ? 'text-sage' : filled === 0 ? 'text-muted' : 'text-ink')}>
            {filled}<span className="text-[0.75rem] text-muted">/{cap}</span>
          </span>
          <span className={cn('text-muted transition-transform duration-200 cursor-pointer',
            isExpanded && 'rotate-180')}
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
            <ChevronDown size={16} />
          </span>
        </div>
      </div>

      {/* Expanded controls + guest list */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden">
            <div className="rule-t">

              {/* Shape selector */}
              {!isHead && (
                <div className="flex items-center gap-2 px-4 py-3 rule-b">
                  <span className="eyebrow mr-2">{t('Form')}</span>
                  {(['round', 'rect', 'horseshoe'] as Shape[]).map((s) => (
                    <button key={s} onClick={() => onShapeChange(s)}
                      className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.76rem] transition-all cursor-pointer rule',
                        table.shape === s ? 'bg-ink text-canvas' : 'bg-card text-ink-soft hover:text-ink')}>
                      <ShapeIcon shape={s} size={12} />
                      {t(SHAPE_META[s].label)}
                    </button>
                  ))}
                </div>
              )}

              {/* Capacity stepper */}
              <div className="flex items-center gap-3 px-4 py-3 rule-b">
                <span className="eyebrow flex-1">{t('Sæder')}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onCapacityChange(-1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full rule hover:bg-card transition-colors cursor-pointer">
                    <Minus size={13} />
                  </button>
                  <span className="w-8 text-center font-serif text-[1.1rem] text-ink">{cap}</span>
                  <button onClick={() => onCapacityChange(1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full rule hover:bg-card transition-colors cursor-pointer">
                    <Plus size={13} />
                  </button>
                </div>
                <span className="text-[0.72rem] text-muted">{t(SHAPE_META[table.shape].desc)}</span>
              </div>

              {/* Guest list */}
              <div className="divide-y divide-[var(--color-line)]">
                {tableGuests.length > 0 ? tableGuests.map((g) => (
                  <div key={g.id} className="group flex items-center gap-2.5 px-4 py-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.58rem] font-medium text-canvas"
                      style={{ background: colorFor(g.group) }}>
                      {g.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="flex-1 text-[0.86rem] text-ink">{g.name}</span>
                    <span className="text-[0.68rem] text-muted opacity-0 group-hover:opacity-100 transition-opacity">{g.group}</span>
                    <button onClick={() => onRemoveGuest(g.id)}
                      className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-full text-muted hover:text-ink hover:bg-card transition-all cursor-pointer">
                      <X size={11} />
                    </button>
                  </div>
                )) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-[0.82rem] text-muted italic">
                      {isActive ? t('Klik på gæster nedenfor for at placere dem her') : t('Vælg bordet for at tilføje gæster')}
                    </p>
                  </div>
                )}
              </div>

              {/* Empty seats indicator */}
              {cap - filled > 0 && (
                <div className="flex items-center gap-1.5 px-4 py-2.5 rule-t">
                  {Array.from({ length: cap - filled }).map((_, i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-shell" />
                  ))}
                  <span className="ml-1 text-[0.7rem] text-muted">
                    {cap - filled === 1
                      ? t('{n} ledig plads', { n: cap - filled })
                      : t('{n} ledige pladser', { n: cap - filled })}
                  </span>
                </div>
              )}

              {/* Delete table */}
              {onDelete && (
                <button onClick={onDelete}
                  className="flex w-full items-center gap-2 px-4 py-3 rule-t text-[0.78rem] text-muted hover:text-clay hover:bg-[#fff5f5] transition-colors cursor-pointer">
                  <Trash2 size={13} /> {t('Fjern bord')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Guest group section ─────────────────────────────────────────────── */
function GuestGroup({
  group, assignedIds, activeTable, reduce, onGuestPointerDown, onAssignActive,
}: {
  group: { name: string; color: string; guests: Guest[] };
  assignedIds: Set<string>;
  activeTable: TableDef | undefined;
  reduce: boolean;
  onGuestPointerDown: (guest: Guest, e: React.PointerEvent) => void;
  onAssignActive: (id: string) => void;
}) {
  const { t } = useLang();
  const [collapsed, setCollapsed] = useState(false);
  const activeName = activeTable ? t(activeTable.name) : t('det valgte bord');

  return (
    <div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-card/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: group.color }} />
        <span className="flex-1 text-left font-serif text-[0.98rem] text-ink">{group.name}</span>
        <span className="text-[0.72rem] text-muted">
          {t('{placed}/{total} placeret', {
            placed: group.guests.filter((g) => assignedIds.has(g.id)).length,
            total: group.guests.length,
          })}
        </span>
        <span className={cn('text-muted transition-transform duration-200', collapsed && 'rotate-180')}>
          <ChevronDown size={14} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.22 }}
            className="overflow-hidden">
            <div className="flex flex-wrap gap-2 px-5 pb-4">
              {group.guests.map((g) => {
                const placed = assignedIds.has(g.id);
                if (placed) {
                  return (
                    <span key={g.id}
                      className="relative flex min-h-[36px] items-center gap-1.5 rounded-full bg-sage-tint px-3.5 py-2 text-[0.82rem] text-ink-soft">
                      <Check size={11} className="shrink-0 text-sage" />
                      {g.name}
                    </span>
                  );
                }
                return (
                  <motion.button
                    key={g.id}
                    whileTap={reduce ? undefined : { scale: 0.94 }}
                    onPointerDown={(e) => onGuestPointerDown(g, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAssignActive(g.id); }
                    }}
                    aria-label={t('Placér {name} ved {table}', { name: g.name, table: activeName })}
                    style={{ touchAction: 'none' }}
                    className="relative flex min-h-[36px] touch-none items-center gap-1.5 rounded-full rule bg-canvas px-3 py-2 text-[0.82rem] text-ink transition-colors hover:bg-card cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40">
                    <GripVertical size={12} className="shrink-0 text-muted" />
                    {g.name}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Stat tile ───────────────────────────────────────────────────────── */
function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rule rounded-2xl bg-card px-5 py-3">
      <p className="eyebrow">{label}</p>
      <p className="mt-0.5 font-serif text-[1.5rem] leading-none text-ink">{value}</p>
    </div>
  );
}

/* ── Shape icon (reusable) ───────────────────────────────────────────── */
function ShapeIcon({ shape, size = 18, className }: { shape: Shape; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      className={className} xmlns="http://www.w3.org/2000/svg">
      {shape === 'round' && (
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      )}
      {shape === 'rect' && (
        <rect x="1.5" y="6" width="17" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
      )}
      {shape === 'horseshoe' && (
        <path d="M4 4 L4 11 A6 6 0 0 0 16 11 L16 4"
          stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
