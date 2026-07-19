import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, ChevronDown, ArrowRight, Check, Pencil } from 'lucide-react';
import { budgetLines, type BudgetLine } from '../data';
import { Eyebrow, Chip, cn } from '../ui';
import AnimateNumber from '../AnimateNumber';
import OnboardingHint from '../OnboardingHint';
import { useWedding } from '../useWedding';
import { useLang } from '../i18n';

/* ── Benchmark fordeling (dansk gennemsnit) ──────────────────────────── */
const BENCHMARK_DIST = [
  { label: 'Venue & leje',         pct: 33, id: 'venue'    },
  { label: 'Mad & drikke',         pct: 27, id: 'catering' },
  { label: 'Foto & film',          pct: 11, id: 'photo'    },
  { label: 'Blomster & dekoration',pct:  9, id: 'florals'  },
  { label: 'Tøj & beauty',         pct:  8, id: 'attire'   },
  { label: 'Musik & underholdning',pct:  7, id: 'music'    },
  { label: 'Invitationer & andet', pct:  5, id: 'misc'     },
];

const DK_AVG_PER_GUEST = 1850; // kr pr gæst, dansk gennemsnit

const kr = (n: number) => new Intl.NumberFormat('da-DK').format(Math.round(n));

const PAYMENTS: { label: string; when: string; amount: number | null; paid: boolean }[] = [
  { label: 'Depositum · Foto & film',       when: 'Nov 2025', amount: 18500, paid: true  },
  { label: 'Depositum · Tøj & beauty',      when: 'Jan 2026', amount: 9200,  paid: true  },
  { label: 'Save-the-dates',                when: 'Jan 2026', amount: 1400,  paid: true  },
  { label: 'Venue · depositum',             when: 'Mar 2026', amount: 20000, paid: false },
  { label: 'Blomster & dekoration',         when: 'Jun 2026', amount: null,  paid: false },
  { label: 'Finale antal til catering',     when: 'Aug 2026', amount: null,  paid: false },
  { label: 'Foto & film · restbetaling',    when: 'Aug 2026', amount: 5500,  paid: false },
  { label: 'Venue & catering · restbetaling', when: 'Sep 2026', amount: null, paid: false },
];

export default function Budget() {
  const { t } = useLang();
  const { couple, budgetItems, saveBudgetItem, deleteBudgetItem, updateEvent } = useWedding();
  const [estimatorDone, setEstimatorDone] = useState(false);
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [estGuests, setEstGuests] = useState(couple.guests);
  const [estTotal,  setEstTotal]  = useState(couple.budgetTotal);

  const dkSuggested = Math.round(estGuests * DK_AVG_PER_GUEST / 10000) * 10000;
  const diff = estTotal - dkSuggested;

  const total = couple.budgetTotal || estTotal;
  const [lines, setLines] = useState<BudgetLine[]>(budgetLines);
  const [amounts, setAmounts] = useState<Record<string, number>>(
    () => Object.fromEntries(budgetLines.map((b) => [b.id, Math.round((total * b.pct) / 100)])),
  );

  // Once anything is persisted, `budget_items` is the source of truth for which
  // categories exist and what they're called — so removing or renaming a
  // standard category sticks. `budgetLines` only supplies the pct/hint defaults.
  useEffect(() => {
    if (budgetItems.length === 0) return;
    const stdById = new Map(budgetLines.map((l) => [l.id, l]));
    const nextLines: BudgetLine[] = budgetItems.map((i) => {
      const std = stdById.get(i.category);
      return { id: i.category, label: i.label, pct: std?.pct ?? 0, spent: i.paid_amount, hint: std?.hint ?? '' };
    });
    setLines(nextLines);
    setAmounts((prev) => {
      const next = { ...prev };
      for (const i of budgetItems) next[i.category] = i.planned_amount;
      return next;
    });
    setEstimatorDone(true);
  }, [budgetItems]);

  // First mutation while nothing is persisted seeds the whole current list, so
  // budget_items becomes authoritative in one batch (no partial state that the
  // reconcile above would then treat as "the only categories").
  const seededRef = useRef(false);
  const seedAll = async (ls: BudgetLine[], amts: Record<string, number>) => {
    if (seededRef.current) return;
    seededRef.current = true;
    await Promise.all(
      ls.map((l, idx) =>
        saveBudgetItem({ category: l.id, label: l.label, planned_amount: amts[l.id] ?? 0, paid_amount: l.spent, sort: idx })
      )
    );
  };

  const persist = (id: string, amount: number) => {
    if (budgetItems.length === 0) {
      void seedAll(lines, { ...amounts, [id]: amount });
      return;
    }
    const line = lines.find((l) => l.id === id);
    void saveBudgetItem({ category: id, label: line?.label ?? id, planned_amount: amount });
  };

  async function applyEstimate() {
    const newAmounts = Object.fromEntries(
      BENCHMARK_DIST.map((d) => [d.id, Math.round((estTotal * d.pct) / 100)])
    );
    // Merge so custom categories the couple added keep their amounts.
    setAmounts((prev) => ({ ...prev, ...newAmounts }));
    setEstimatorDone(true);
    setEstimatorOpen(false);
    seededRef.current = true; // the benchmark set below becomes the persisted base
    await updateEvent({ budget: String(estTotal), guest_count: estGuests });
    await Promise.all(
      BENCHMARK_DIST.map((d) =>
        saveBudgetItem({ category: d.id, label: d.label, planned_amount: newAmounts[d.id], sort: BENCHMARK_DIST.indexOf(d) })
      )
    );
  }
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const allocated = useMemo(() => Object.values(amounts).reduce((a, b) => a + b, 0), [amounts]);
  const remaining = total - allocated;
  const spent = lines.reduce((a, b) => a + b.spent, 0);

  const setAmount = (id: string, v: number) => setAmounts((a) => ({ ...a, [id]: v }));

  const addLine = () => {
    const label = newLabel.trim();
    if (!label) return;
    const id = `custom-${Date.now()}`;
    const newLine: BudgetLine = { id, label, pct: 0, spent: 0, hint: '' };
    setLines((prev) => [...prev, newLine]);
    setAmounts((prev) => ({ ...prev, [id]: 0 }));
    setNewLabel('');
    setAddingNew(false);
    if (budgetItems.length === 0) void seedAll([...lines, newLine], { ...amounts, [id]: 0 });
    else void saveBudgetItem({ category: id, label, planned_amount: 0 });
  };

  const removeLine = (id: string) => {
    const remaining = lines.filter((b) => b.id !== id);
    setLines(remaining);
    setAmounts((prev) => { const next = { ...prev }; delete next[id]; return next; });
    if (editingId === id) setEditingId(null);
    // When nothing is persisted yet, seed everything *except* the removed line
    // so the removal sticks; otherwise delete the persisted row.
    if (budgetItems.length === 0) void seedAll(remaining, amounts);
    else void deleteBudgetItem(id);
  };

  const startEditLabel = (id: string, label: string) => { setEditingId(id); setEditLabel(label); };
  const commitEditLabel = () => {
    const id = editingId;
    if (!id) return;
    const label = editLabel.trim();
    setEditingId(null);
    if (!label) return;
    const renamed = lines.map((b) => (b.id === id ? { ...b, label } : b));
    setLines(renamed);
    if (budgetItems.length === 0) void seedAll(renamed, amounts);
    else void saveBudgetItem({ category: id, label, planned_amount: amounts[id] ?? 0 });
  };

  const startAdding = () => { setAddingNew(true); setTimeout(() => inputRef.current?.focus(), 50); };

  return (
    <div className="px-6 py-8 sm:px-9 lg:px-12 lg:py-8">
      {/* ── Budget estimator ──────────────────────────────────────────── */}
      <div className="rule rounded-2xl overflow-hidden">
        <button onClick={() => setEstimatorOpen(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 bg-card hover:bg-shell transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-serif text-[1.05rem] text-ink">
              {estimatorDone ? <>{t('Budget estimeret')} <Check size={15} className="text-success" /></> : t('Estimér jeres budget')}
            </span>
            {!estimatorDone && (
              <span className="rounded-full bg-sage-tint px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink">
                {t('Ava anbefaler')}
              </span>
            )}
          </div>
          <motion.span animate={{ rotate: estimatorOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-muted" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {estimatorOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2 rule-t space-y-6">
                {/* Inputs */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="eyebrow block mb-3">{t('Antal gæster')}</label>
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-[2rem] text-ink tabular-nums w-14">{estGuests}</span>
                      <input type="range" min={20} max={300} step={5} value={estGuests}
                        onChange={e => setEstGuests(Number(e.target.value))}
                        className="kalas-range flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="eyebrow block mb-3">{t('Samlet budget')}</label>
                    <div className="flex items-center gap-2 rule rounded-xl bg-shell px-4 py-2.5">
                      <input type="number" value={estTotal} step={5000} min={0}
                        onChange={e => setEstTotal(Math.max(0, Number(e.target.value)))}
                        className="flex-1 bg-transparent font-serif text-[1.3rem] text-ink focus:outline-none tabular-nums w-0 min-w-0"
                      />
                      <span className="text-[0.8rem] text-muted shrink-0">kr</span>
                    </div>
                  </div>
                </div>

                {/* Dansk gennemsnit */}
                <div className={cn('rounded-xl px-4 py-3 text-[0.82rem] leading-relaxed',
                  diff > 20000 ? 'bg-sage-tint text-ink' : diff < -20000 ? 'bg-[#f9edea] text-red-800' : 'bg-shell text-ink')}>
                  {diff > 20000
                    ? t('Dansk gennemsnit for {guests} gæster er {avg} kr — I er {diff} over. God buffer til uforudsete udgifter.', { guests: estGuests, avg: kr(dkSuggested), diff: kr(diff) })
                    : diff < -20000
                    ? t('Dansk gennemsnit for {guests} gæster er {avg} kr — I er {diff} under. Ava vil prioritere hårdt.', { guests: estGuests, avg: kr(dkSuggested), diff: kr(Math.abs(diff)) })
                    : t('Dansk gennemsnit for {guests} gæster er {avg} kr — I er tæt på gennemsnittet. God balance.', { guests: estGuests, avg: kr(dkSuggested) })
                  }
                </div>

                <button onClick={applyEstimate}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-semibold uppercase tracking-[0.12em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                  {t('Fordel budgettet automatisk')} <ArrowRight size={13} />
                </button>
                <p className="text-[0.72rem] text-muted -mt-2">
                  {t('Fordelingen lander i kategorierne nedenfor — I kan justere alt bagefter.')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Totals strip */}
      <div className="mt-10 grid gap-px overflow-hidden rounded-3xl rule bg-[var(--color-line)] sm:grid-cols-3">
        <Stat label="Samlet budget" value={total} tone="total" />
        <Stat label="Fordelt" value={allocated} tone="allocated" />
        <Stat label={remaining < 0 ? 'Over budget' : 'Tilbage at fordele'} value={Math.abs(remaining)} tone={remaining < 0 ? 'over' : 'remaining'} />
      </div>

      <p className="mt-4 text-[0.82rem] text-muted">
        {t('Betalt indtil videre:')} <span className="text-ink">{kr(spent)} kr</span> · {t('Ava advarer, hvis I rammer loftet.')}
      </p>

      {/* Stacked allocation bar */}
      <div className="mt-8 flex h-3 overflow-hidden rounded-full bg-shell">
        {lines.map((b, i) => (
          <motion.div key={b.id}
            initial={{ width: 0 }} animate={{ width: `${((amounts[b.id] ?? 0) / total) * 100}%` }}
            transition={{ duration: 0.5 }}
            style={{ background: `hsl(${74 + i * 8} ${22 - i}% ${42 + i * 4}%)` }}
            title={t(b.label)}
          />
        ))}
      </div>
      {/* Legend — so the bar actually reads */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {lines.map((b, i) => (
          <span key={b.id} className="flex items-center gap-1.5 text-[0.72rem] text-muted">
            <span className="h-2 w-2 rounded-full shrink-0"
              style={{ background: `hsl(${74 + i * 8} ${22 - i}% ${42 + i * 4}%)` }} />
            {t(b.label)} · {Math.round(((amounts[b.id] ?? 0) / total) * 100)}%
          </span>
        ))}
      </div>

      {/* Editable lines */}
      <div className="mt-10 divide-y divide-[var(--color-line)]">
        {lines.map((b) => (
          <motion.div key={b.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="py-5">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                {editingId === b.id ? (
                  <input
                    autoFocus
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={commitEditLabel}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEditLabel();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    aria-label={t('Omdøb {label}', { label: t(b.label) })}
                    className="min-w-0 flex-1 bg-transparent font-serif text-[1.2rem] text-ink focus:outline-none border-b border-[var(--color-line-strong)] pb-0.5"
                  />
                ) : (
                  <button onClick={() => startEditLabel(b.id, b.label)}
                    className="group flex items-center gap-1.5 text-left cursor-pointer" title={t('Omdøb kategori')}>
                    <span className="font-serif text-[1.2rem] text-ink">{t(b.label)}</span>
                    <Pencil size={12} className="text-muted/0 group-hover:text-muted transition-colors" />
                  </button>
                )}
                {b.spent > 0 && <Chip tone="success">{t('{amount} kr betalt', { amount: kr(b.spent) })}</Chip>}
              </div>
              <div className="flex items-baseline gap-3 shrink-0">
                <div className="font-serif text-[1.3rem] text-ink tabular-nums">
                  <AnimateNumber value={amounts[b.id] ?? 0} suffix=" kr" />
                </div>
                <button onClick={() => removeLine(b.id)} aria-label={t('Fjern {label}', { label: t(b.label) })}
                  className="text-muted hover:text-[var(--color-terracotta)] transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <input
                type="range" min={0} max={Math.round(total * 0.45)} step={500}
                value={amounts[b.id] ?? 0} onChange={(e) => setAmount(b.id, Number(e.target.value))}
                onPointerUp={(e) => persist(b.id, Number((e.target as HTMLInputElement).value))}
                onBlur={(e) => persist(b.id, Number(e.target.value))}
                className="kalas-range flex-1"
                aria-label={t('Justér {label}', { label: t(b.label) })}
              />
              <span className="w-12 shrink-0 text-right text-[0.78rem] text-muted tabular-nums">
                {Math.round(((amounts[b.id] ?? 0) / total) * 100)}%
              </span>
            </div>
            {b.hint && <p className="mt-1 text-[0.78rem] text-muted">{b.hint}</p>}
          </motion.div>
        ))}

        {/* Add new category */}
        {addingNew ? (
          <div className="py-5">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                placeholder={t('Kategorinavn, fx. Transport')}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addLine();
                  if (e.key === 'Escape') { setAddingNew(false); setNewLabel(''); }
                }}
                className="flex-1 bg-transparent font-serif text-[1.2rem] text-ink placeholder:text-muted/50 focus:outline-none border-b border-[var(--color-line-strong)] pb-1"
              />
              <button onClick={addLine}
                className="h-8 rounded-full bg-ink px-3 text-xs font-semibold uppercase tracking-[0.12em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
                {t('Tilføj')}
              </button>
              <button onClick={() => { setAddingNew(false); setNewLabel(''); }}
                className="text-muted hover:text-ink transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-5">
            <button onClick={startAdding}
              className="flex items-center gap-2 text-[0.82rem] font-medium text-muted hover:text-ink transition-colors cursor-pointer">
              <Plus size={15} /> {t('Tilføj kategori')}
            </button>
          </div>
        )}
      </div>

      {/* Payment timeline */}
      <div className="mt-14 rule-t pt-10">
        <Eyebrow>{t('Betalingstidslinje')}</Eyebrow>
        <h2 className="display mt-3 text-[clamp(1.8rem,3.5vw,2.6rem)] text-ink">
          {t('Hvornår skal')} <span className="italic">{t('pengene bruges?')}</span>
        </h2>
        <div className="mt-8 space-y-0 divide-y divide-[var(--color-line)] rule rounded-2xl overflow-hidden">
          {PAYMENTS.map((p, i) => {
            const isNext = !p.paid && PAYMENTS.findIndex((x) => !x.paid) === i;
            return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-center gap-4 px-5 py-4 ${isNext ? 'bg-sage-tint/50' : 'bg-card'}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${p.paid ? 'bg-sage-tint' : isNext ? 'bg-sage' : 'bg-shell'}`}>
                {p.paid
                  ? <span className="h-2 w-2 rounded-full bg-sage" />
                  : <span className={`h-2 w-2 rounded-full ${isNext ? 'bg-ink' : 'bg-[var(--color-line-strong)]'}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[0.88rem] ${p.paid ? 'text-muted line-through' : 'text-ink'}`}>
                  {t(p.label)}
                  {isNext && (
                    <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-canvas align-middle">
                      {t('Næste')}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                {p.amount != null && (
                  <p className={`font-serif text-[0.95rem] ${p.paid ? 'text-muted' : 'text-ink'}`}>
                    {kr(p.amount)} kr
                  </p>
                )}
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted mt-0.5">{p.when}</p>
              </div>
            </motion.div>
            );
          })}
        </div>
        <p className="mt-3 text-[0.78rem] text-muted">
          {t('Kendte betalinger tilbage:')}{' '}
          <span className="text-ink font-medium">
            {kr(PAYMENTS.filter((p) => !p.paid && p.amount != null).reduce((a, p) => a + (p.amount ?? 0), 0))} kr
          </span>
          {' '}{t('· beløb uden tal afhænger af jeres valg')}
        </p>
      </div>

      <style>{`
        .kalas-range { -webkit-appearance: none; appearance: none; height: 2px; background: var(--color-line-strong); border-radius: 999px; cursor: pointer; }
        .kalas-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 999px; background: var(--color-sage); border: 2px solid var(--color-canvas); box-shadow: 0 1px 4px rgba(46,51,37,0.2); cursor: pointer; }
        .kalas-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 999px; background: var(--color-sage); border: 2px solid var(--color-canvas); cursor: pointer; }
      `}</style>
      <OnboardingHint id="budget" />
    </div>
  );
}

const STAT_STYLES = {
  total:     { bg: 'bg-ink',          label: '!text-canvas/50',  value: 'text-canvas' },
  allocated: { bg: 'bg-sage-tint',    label: '!text-ink/50',     value: 'text-ink' },
  remaining: { bg: 'bg-[#f5f0e4]',   label: '!text-clay/70',    value: 'text-clay' },
  over:      { bg: 'bg-[#f9edea]',   label: '!text-red-700/70', value: 'text-red-700' },
} as const;

function Stat({ label, value, tone }: { label: string; value: number; tone: keyof typeof STAT_STYLES }) {
  const { t } = useLang();
  const s = STAT_STYLES[tone];
  return (
    <div className={cn('px-6 py-7', s.bg)}>
      <Eyebrow className={s.label}>{t(label)}</Eyebrow>
      <div className={cn('mt-2 font-serif text-[2rem]', s.value)}>
        <AnimateNumber value={value} suffix=" kr" />
      </div>
    </div>
  );
}
