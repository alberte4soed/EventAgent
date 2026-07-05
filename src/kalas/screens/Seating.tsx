import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Minus, Check, Download, Share2, ChevronDown, Trash2 } from 'lucide-react';
import { Eyebrow, Pill, cn } from '../ui';
import OnboardingHint from '../OnboardingHint';
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
  'Brudepar':           '#3A4F37',
};

// Stable colour for any group label (real guest sides fall outside the map).
const GROUP_PALETTE = ['#6A8C5A', '#9B7040', '#4A7A9B', '#8A5A6A', '#5A7A5A', '#3A4F37', '#7A6A9B'];
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
let nextId = 10;
const mkId = () => `t${nextId++}`;

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
  const { loading, guests, seatingPlan, saveSeating } = useWedding();
  const [tables, setTables]     = useState<TableDef[]>(INIT_TABLES);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [activeId, setActiveId] = useState<string>('t1');

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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  const assignedIds = new Set(tables.flatMap((t) => t.guestIds));
  const unassigned  = pool.filter((g) => !assignedIds.has(g.id));
  const totalSeated = assignedIds.size;
  const activeTable = tables.find((t) => t.id === activeId);

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

  const assignGuest = (guestId: string) => {
    if (!activeId) return;
    const t = tables.find((t) => t.id === activeId);
    if (!t || t.guestIds.length >= t.capacity) return;
    setTables((prev) => prev.map((tbl) =>
      tbl.id === activeId ? { ...tbl, guestIds: [...tbl.guestIds, guestId] } : tbl
    ));
  };

  const unassignGuest = (tableId: string, guestId: string) => {
    setTables((prev) => prev.map((t) =>
      t.id === tableId ? { ...t, guestIds: t.guestIds.filter((id) => id !== guestId) } : t
    ));
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

  return (
    <div className="pb-24">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
        <Eyebrow>Bordplan</Eyebrow>
        <h1 className="display mt-4 text-[clamp(2.5rem,5vw,4rem)] text-ink">
          Byg jeres <span className="italic">opstilling.</span>
        </h1>
        <p className="mt-4 max-w-lg text-ink-soft leading-relaxed">
          Vælg bordform og kapacitet — tilføj borde efter behov, og placer jeres gæster
          ved at vælge et bord og klikke på gæsterne nedenfor.
        </p>

        {/* Stats */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="rule rounded-2xl bg-card px-5 py-3">
            <p className="eyebrow">Placeret</p>
            <p className="mt-0.5 font-serif text-[1.5rem] leading-none text-ink">{totalSeated} / {pool.length}</p>
          </div>
          <div className="rule rounded-2xl bg-card px-5 py-3">
            <p className="eyebrow">Borde</p>
            <p className="mt-0.5 font-serif text-[1.5rem] leading-none text-ink">{tables.length}</p>
          </div>
          <div className="rule rounded-2xl bg-card px-5 py-3">
            <p className="eyebrow">Total kapacitet</p>
            <p className="mt-0.5 font-serif text-[1.5rem] leading-none text-ink">{tables.reduce((a, t) => a + t.capacity, 0)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 self-start">
            {unassigned.length > 0 && (
              <button onClick={autoSeat}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-canvas hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: 'var(--color-terracotta)' }}>
                Lad Ava placere resten ({unassigned.length})
              </button>
            )}
            <button onClick={() => setExported(true)}
              className="flex items-center gap-2 rounded-full rule px-4 py-2.5 text-[0.78rem] text-ink-soft hover:text-ink hover:bg-card transition-all cursor-pointer">
              <Download size={14} /> {exported ? 'Eksporteret' : 'Eksportér PDF'}
            </button>
            <button className="flex items-center gap-2 rounded-full rule px-4 py-2.5 text-[0.78rem] text-ink-soft hover:text-ink hover:bg-card transition-all cursor-pointer">
              <Share2 size={14} /> Del med venue
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5 max-w-md">
          <div className="flex justify-between items-center mb-1.5">
            <span className="eyebrow text-[0.62rem]">Placeret</span>
            <span className="text-[0.74rem] text-muted">{Math.round((totalSeated / pool.length) * 100)}%</span>
          </div>
          <div className="h-1 rounded-full bg-shell overflow-hidden">
            <motion.div animate={{ width: `${(totalSeated / pool.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }} className="h-full rounded-full bg-sage" />
          </div>
        </div>
      </div>

      {/* ── Add table bar ────────────────────────────────────────────── */}
      <div className="px-6 sm:px-10 lg:px-16 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow className="mr-1">Tilføj bord</Eyebrow>
          {(Object.entries(SHAPE_META) as [Shape, typeof SHAPE_META[Shape]][]).map(([shape, meta]) => (
            <button key={shape} onClick={() => addTable(shape)}
              className="flex items-center gap-2 rounded-full rule bg-card px-4 py-2 text-[0.82rem] font-medium text-ink-soft hover:text-ink hover:bg-shell transition-all cursor-pointer">
              <Plus size={13} />
              <ShapeIcon shape={shape} size={14} />
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Floor plan ──────────────────────────────────────────────── */}
      <div className="px-6 sm:px-10 lg:px-16 mb-10">
        <FloorPlan tables={tables} activeId={activeId} onSelect={setActiveId}
          positions={positions} onMove={moveTable} />
        {/* Shape legend */}
        <div className="mt-3 flex flex-wrap gap-4">
          {(Object.entries(SHAPE_META) as [Shape, typeof SHAPE_META[Shape]][]).map(([shape, meta]) => (
            <div key={shape} className="flex items-center gap-1.5">
              <ShapeIcon shape={shape} size={13} className="text-muted" />
              <span className="text-[0.72rem] text-muted">{meta.label}</span>
            </div>
          ))}
          <div className="ml-auto text-[0.72rem] text-muted">Klik for at vælge · træk for at flytte bordet</div>
        </div>
      </div>

      {/* ── Table cards ─────────────────────────────────────────────── */}
      <div className="px-6 sm:px-10 lg:px-16 mb-12">
        <Eyebrow className="mb-5">Borde · {tables.length} i alt</Eyebrow>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              guests={pool}
              isActive={activeId === t.id}
              isExpanded={expanded === t.id}
              onSelect={() => { setActiveId(t.id); setExpanded(t.id); }}
              onToggleExpand={() => setExpanded(expanded === t.id ? null : t.id)}
              onShapeChange={(s) => setShape(t.id, s)}
              onCapacityChange={(d) => setCapacity(t.id, d)}
              onRemoveGuest={(gId) => unassignGuest(t.id, gId)}
              onDelete={t.id !== 'head' ? () => removeTable(t.id) : undefined}
            />
          ))}
        </div>
      </div>

      {/* ── Guest pool ──────────────────────────────────────────────── */}
      <div className="px-6 sm:px-10 lg:px-16">
        <div className="rule rounded-2xl overflow-hidden">
          {/* Pool header */}
          <div className="flex items-center justify-between bg-card px-6 py-4 rule-b">
            <div>
              <Eyebrow>Gæsteliste</Eyebrow>
              {activeTable && activeTable.guestIds.length >= activeTable.capacity ? (
                <p className="mt-1 font-serif text-[1.05rem] text-ink">
                  <span className="italic">{activeTable.name}</span> er fuldt —
                  vælg et andet bord ovenfor
                </p>
              ) : (
                <p className="mt-1 font-serif text-[1.05rem] text-ink">
                  Klik på en gæst for at placere dem ved{' '}
                  <span className="italic">{activeTable?.name ?? 'det valgte bord'}</span>
                  {activeTable && (
                    <span className="ml-2 inline-block rounded-full bg-sage-tint px-2.5 py-0.5 text-[0.68rem] font-sans font-semibold not-italic align-middle text-ink">
                      {activeTable.capacity - activeTable.guestIds.length} ledige pladser
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="eyebrow">Uplacerede</p>
              <p className="mt-0.5 font-serif text-[1.5rem] leading-none text-ink">{unassigned.length}</p>
            </div>
          </div>

          {/* Groups */}
          <div className="divide-y divide-[var(--color-line)]">
            {groups.map((grp) => (
              <GuestGroup
                key={grp.name}
                group={grp}
                assignedIds={assignedIds}
                activeTable={activeTable}
                onAssign={assignGuest}
              />
            ))}
          </div>
        </div>
      </div>
      <OnboardingHint id="seating" />
    </div>
  );
}

/* ── Floor plan — tables are draggable ───────────────────────────────── */
function FloorPlan({
  tables, activeId, onSelect, positions, onMove,
}: {
  tables: TableDef[]; activeId: string; onSelect: (id: string) => void;
  positions: Record<string, { x: number; y: number }>;
  onMove: (id: string, x: number, y: number) => void;
}) {
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
          fontFamily="Hanken Grotesk, sans-serif" letterSpacing="2">DANSEGULV</text>

        {/* Entrance line */}
        <line x1="270" y1={VIEW_H - 13} x2="370" y2={VIEW_H - 13}
          stroke="#d0ccc0" strokeWidth="2.5" strokeLinecap="round" />
        <text x="320" y={VIEW_H - 2} fill="#c4c0b4" fontSize="7.5" textAnchor="middle"
          fontFamily="Hanken Grotesk, sans-serif" letterSpacing="2">INDGANG</text>

        {/* Head table */}
        {(() => {
          const head = tables.find((t) => t.id === 'head');
          if (!head) return null;
          const isActive = activeId === 'head';
          const filled   = head.guestIds.length;
          const cap      = head.capacity;
          const { cx, cy } = headPos;
          return (
            <g className="cursor-grab active:cursor-grabbing"
              onPointerDown={startDrag('head', cx, cy)}>
              {isActive && <rect x={cx - 127} y={cy - 26} width="254" height="52" rx="26"
                fill="none" stroke="#3A4F37" strokeWidth="2" opacity="0.35" />}
              <rect x={cx - 120} y={cy - 22} width="240" height="44" rx="22"
                fill={isActive ? '#3A4F37' : '#3a4f3720'}
                stroke="#3A4F37" strokeWidth={isActive ? 0 : 1.5} />
              {/* Seat count indicator */}
              <text x={cx} y={cy - 5} fill={isActive ? '#f3f1e6cc' : '#3a4f3799'}
                fontSize="8" textAnchor="middle"
                fontFamily="Hanken Grotesk, sans-serif" letterSpacing="2">BRUDEBORDET</text>
              <text x={cx} y={cy + 11} fill={isActive ? '#f3f1e680' : '#3a4f3760'}
                fontSize="8" textAnchor="middle" fontFamily="Hanken Grotesk, sans-serif">
                {filled}/{cap} gæster
              </text>
            </g>
          );
        })()}

        {/* Regular tables */}
        {tables.filter((t) => t.id !== 'head').map((t) => {
          const pos = posMap[t.id];
          if (!pos) return null;
          const { cx, cy } = pos;
          const isActive   = activeId === t.id;
          const fillPct    = t.guestIds.length / t.capacity;
          const col        = '#3A4F37';
          const bgAlpha    = isActive ? 'cc' : '22';
          const strokeAlpha = isActive ? '' : '66';

          return (
            <g key={t.id} className="cursor-grab active:cursor-grabbing"
              onPointerDown={startDrag(t.id, cx, cy)}>
              {/* Active glow ring */}
              {isActive && <TableShape shape={t.shape} cx={cx} cy={cy} r={32} fill="none"
                stroke={col} strokeWidth={2} opacity={0.3} />}

              {/* Table body */}
              <TableShape shape={t.shape} cx={cx} cy={cy} r={22}
                fill={`${col}${bgAlpha}`}
                stroke={`${col}${strokeAlpha}`} strokeWidth={1.5} />

              {/* Fill overlay */}
              {fillPct > 0 && (
                <TableShape shape={t.shape} cx={cx} cy={cy} r={22}
                  fill={col} opacity={fillPct * 0.35} />
              )}

              {/* Seat dots */}
              {Array.from({ length: Math.min(t.capacity, 12) }).map((_, i) => {
                const n     = Math.min(t.capacity, 12);
                const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
                const dR    = t.shape === 'round' ? 30 : t.shape === 'rect' ? 28 : 26;
                const filled = i < (t.guestIds.length / t.capacity) * n;
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
                fill={isActive ? '#f3f1e6dd' : '#3a4f3799'}
                fontSize="9.5" textAnchor="middle" fontWeight="600"
                fontFamily="Hanken Grotesk, sans-serif">
                {t.name.replace('Bord ', '')}
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
  table, guests, isActive, isExpanded,
  onSelect, onToggleExpand, onShapeChange, onCapacityChange, onRemoveGuest, onDelete,
}: {
  table: TableDef;
  guests: Guest[];
  isActive: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onShapeChange: (s: Shape) => void;
  onCapacityChange: (delta: number) => void;
  onRemoveGuest: (id: string) => void;
  onDelete?: () => void;
}) {
  const filled   = table.guestIds.length;
  const cap      = table.capacity;
  const isFull   = filled >= cap;
  const tableGuests = table.guestIds.map((id) => guests.find((g) => g.id === id)).filter(Boolean) as Guest[];
  const isHead   = table.id === 'head';

  return (
    <motion.div layout
      className={cn('rule rounded-2xl overflow-hidden transition-all duration-200',
        isActive && 'ring-2 ring-ink ring-offset-2 ring-offset-canvas')}>

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
            <span className="font-serif text-[1.05rem] text-ink truncate">{table.name}</span>
            {isFull && <span className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-sage">Fuld</span>}
          </div>
          <div className="mt-1 text-[0.72rem] text-muted">{SHAPE_META[table.shape].label}</div>
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
                  <span className="eyebrow mr-2">Form</span>
                  {(['round', 'rect', 'horseshoe'] as Shape[]).map((s) => (
                    <button key={s} onClick={() => onShapeChange(s)}
                      className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.76rem] transition-all cursor-pointer rule',
                        table.shape === s ? 'bg-ink text-canvas' : 'bg-card text-ink-soft hover:text-ink')}>
                      <ShapeIcon shape={s} size={12} />
                      {SHAPE_META[s].label}
                    </button>
                  ))}
                </div>
              )}

              {/* Capacity stepper */}
              <div className="flex items-center gap-3 px-4 py-3 rule-b">
                <span className="eyebrow flex-1">Sæder</span>
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
                <span className="text-[0.72rem] text-muted">{SHAPE_META[table.shape].desc}</span>
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
                      {isActive ? 'Klik på gæster nedenfor for at placere dem her' : 'Vælg bordet for at tilføje gæster'}
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
                  <span className="ml-1 text-[0.7rem] text-muted">{cap - filled} ledig {cap - filled === 1 ? 'plads' : 'pladser'}</span>
                </div>
              )}

              {/* Delete table */}
              {onDelete && (
                <button onClick={onDelete}
                  className="flex w-full items-center gap-2 px-4 py-3 rule-t text-[0.78rem] text-muted hover:text-clay hover:bg-[#fff5f5] transition-colors cursor-pointer">
                  <Trash2 size={13} /> Fjern bord
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
  group, assignedIds, activeTable, onAssign,
}: {
  group: { name: string; color: string; guests: Guest[] };
  assignedIds: Set<string>;
  activeTable: TableDef | undefined;
  onAssign: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const canAssign = activeTable && activeTable.guestIds.length < activeTable.capacity;

  return (
    <div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-3 px-6 py-3.5 cursor-pointer hover:bg-card/30 transition-colors">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: group.color }} />
        <span className="flex-1 text-left font-serif text-[0.98rem] text-ink">{group.name}</span>
        <span className="text-[0.72rem] text-muted">
          {group.guests.filter((g) => assignedIds.has(g.id)).length}/{group.guests.length} placeret
        </span>
        <span className={cn('text-muted transition-transform duration-200', collapsed && 'rotate-180')}>
          <ChevronDown size={14} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden">
            <div className="flex flex-wrap gap-2 px-6 pb-4">
              {group.guests.map((g) => {
                const placed = assignedIds.has(g.id);
                return (
                  <motion.button
                    key={g.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => !placed && canAssign && onAssign(g.id)}
                    disabled={placed || !canAssign}
                    className={cn(
                      'relative flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.82rem] transition-all cursor-pointer',
                      placed
                        ? 'bg-sage-tint text-ink-soft cursor-default'
                        : canAssign
                          ? 'rule bg-canvas text-ink hover:bg-card hover:shadow-sm'
                          : 'rule bg-canvas text-muted cursor-not-allowed opacity-50',
                    )}>
                    {placed && <Check size={11} className="text-sage shrink-0" />}
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
