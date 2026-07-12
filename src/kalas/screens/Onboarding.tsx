import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import {
  Check, ArrowLeft, ArrowRight, Sparkles, MapPin, ListChecks, Heart, Lock,
} from 'lucide-react';
import { couple, timeline } from '../data';
import { GUEST_BANDS, type OnboardingDate } from '@/lib/onboarding';
import type { ScreenId } from '../Shell';
import { cn } from '../ui';
import { useLang } from '../i18n';
import { DESTINATIONS, destinationValue, type Destination } from '../onboarding/DestinationGlobe';

const DestinationGlobe = dynamic(() => import('../onboarding/DestinationGlobe'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(58vh,420px)] w-full items-center justify-center">
      <span className="font-serif text-[0.95rem] italic text-muted">Indlæser kloden…</span>
    </div>
  ),
});

/* Structured onboarding state — chips + bands instead of loose text, so the
   journey logic and Ava's briefs get clean, bounded inputs. */
export type FormState = {
  nameA: string; nameB: string;
  location: string;
  dateChoice: string;   // '' | season key | 'exact' | 'undecided'
  exactDate: string;    // ISO, when dateChoice === 'exact'
  guestBand: string;    // '' | GUEST_BANDS key
  budgetBand: string;   // '' | BUDGET_BANDS key
  vibes: string[];      // Danish vibe labels (multi-select)
  description: string;
  partnerEmail: string;
};

export const EMPTY_FORM: FormState = {
  nameA: '', nameB: '',
  location: '', dateChoice: '', exactDate: '',
  guestBand: '', budgetBand: '', vibes: [],
  description: '', partnerEmail: '',
};

/* ── Danish chip vocabularies (reuse the shared band keys for the backend) ─ */
const GUEST_LABELS_DA: Record<string, string> = {
  just_us: 'Kun os to',
  under_50: 'Under 50',
  '50_100': '50–100',
  '100_150': '100–150',
  '150_plus': '150+',
  not_sure: 'Ved ikke endnu',
};

type BudgetBand = { key: string; label: string; emoji: string; amount: number | null };
const BUDGET_BANDS_DA: BudgetBand[] = [
  { key: 'lean',     label: 'Nøjsomt',            emoji: '🌱', amount: 100000 },
  { key: 'mid',      label: 'Mellemklasse',       emoji: '⚖️', amount: 200000 },
  { key: 'generous', label: 'Rundhåndet',         emoji: '🥂', amount: 350000 },
  { key: 'sky',      label: 'Himlen er grænsen',  emoji: '🌟', amount: 600000 },
  { key: 'private',  label: 'Vil helst ikke sige', emoji: '🤫', amount: null },
];

type Vibe = { key: string; label: string; emoji: string };
const VIBE_OPTIONS: Vibe[] = [
  { key: 'garden',      label: 'Have',              emoji: '🌿' },
  { key: 'rustic',      label: 'Rustik lade',       emoji: '🌾' },
  { key: 'modern',      label: 'Moderne loft',      emoji: '🏙️' },
  { key: 'ballroom',    label: 'Klassisk balsal',   emoji: '💃' },
  { key: 'beach',       label: 'Strand',            emoji: '🌊' },
  { key: 'castle',      label: 'Slot / herregård',  emoji: '🏰' },
  { key: 'intimate',    label: 'Intimt',            emoji: '🕯️' },
  { key: 'boho',        label: 'Boho',              emoji: '🪶' },
  { key: 'destination', label: 'Destination',       emoji: '✈️' },
];

const SEASONS_DA = ['Forår', 'Sommer', 'Efterår', 'Vinter'] as const;
const SEASON_START_MONTH = [2, 5, 8, 11]; // Mar, Jun, Sep, Dec

type DateChip = { key: string; season: string; year: number };
type TFn = (s: string, params?: Record<string, string | number>) => string;
/** The next `count` season-year chips starting from the upcoming season. */
function seasonChipsDa(count = 6, from = new Date()): DateChip[] {
  const chips: DateChip[] = [];
  let year = from.getFullYear();
  let idx = SEASON_START_MONTH.findIndex((m) => m > from.getMonth());
  if (idx === -1) { idx = 0; year += 1; }
  while (chips.length < count) {
    chips.push({ key: `${SEASONS_DA[idx].toLowerCase()}_${year}`, season: SEASONS_DA[idx], year });
    idx += 1;
    if (idx === SEASONS_DA.length) { idx = 0; year += 1; }
  }
  return chips;
}
const DATE_CHIPS = seasonChipsDa(6);
const chipLabel = (c: DateChip, t: TFn) => `${t(c.season)} ${c.year}`;

/* ── Payload builders (all band/date logic lives here) ─────────────────── */
function buildDate(form: FormState): OnboardingDate {
  if (form.dateChoice === 'exact' && form.exactDate) return { precision: 'exact', iso: form.exactDate };
  const chip = DATE_CHIPS.find((c) => c.key === form.dateChoice);
  if (chip) return { precision: 'season', hint: `${chip.season} ${chip.year}` };
  return { precision: 'undecided' };
}
function buildBudget(form: FormState): string | null {
  const band = BUDGET_BANDS_DA.find((b) => b.key === form.budgetBand);
  return band?.amount != null ? String(band.amount) : null;
}
export function toOnboardingPayload(form: FormState) {
  return {
    name: form.nameA.trim(),
    partner_name: form.nameB.trim() || null,
    city: form.location.trim(),
    date: buildDate(form),
    guest_band: form.guestBand || null,
    budget: buildBudget(form),
    vibes: form.vibes,
    description: form.description.trim() || null,
    partner_email: form.partnerEmail.trim() || null,
  };
}

/* ── Display helpers ─────────────────────────────────────────────────── */
function dateLabelOf(form: FormState, lang: string, t: TFn): string {
  if (form.dateChoice === 'exact' && form.exactDate) {
    return new Date(form.exactDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const chip = DATE_CHIPS.find((c) => c.key === form.dateChoice);
  if (chip) return chipLabel(chip, t);
  return t('snart');
}
function guestCountOf(form: FormState): number {
  const band = GUEST_BANDS.find((b) => b.key === form.guestBand);
  return band?.count ?? couple.guests;
}

const inputCls = 'w-full rounded-2xl border border-[var(--color-line-strong)] bg-canvas px-4 py-3.5 text-[1rem] text-ink placeholder:text-muted focus:border-ink focus:outline-none transition-colors';

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — centered, traditional step flow (no chat pane)
══════════════════════════════════════════════════════════════════════ */
const TOTAL_STEPS = 6;

const STEP_LABELS = ['Jeres historie', 'Destination', 'Datoen', 'Omfang', 'Stilen', 'Partner'] as const;

const wonderInputCls =
  'h-[62px] w-full rounded-[14px] border bg-[#fffdf7] px-[18px] text-base text-[#23351f] placeholder:text-[#637067] transition-shadow focus:outline-none';

export default function Onboarding({ onEnter }: { onEnter: (form: FormState, s?: ScreenId) => void }) {
  const { t, lang, setLang } = useLang();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [aha, setAha] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const toggleVibe = (label: string) =>
    setForm((f) => ({ ...f, vibes: f.vibes.includes(label) ? f.vibes.filter((v) => v !== label) : [...f.vibes, label] }));

  const go = (next: number) => {
    if (next >= TOTAL_STEPS) { setAha(true); return; }
    setDir(next > step ? 1 : -1);
    setStep(Math.max(0, next));
  };

  const canAdvance =
    (step === 0 && Boolean(form.nameA.trim() && form.nameB.trim())) ||
    (step === 1 && Boolean(form.location.trim())) ||
    (step === 2 && (form.dateChoice === 'exact' ? Boolean(form.exactDate) : Boolean(form.dateChoice))) ||
    (step === 3 && Boolean(form.guestBand)) ||
    step === 4 ||
    step === 5;

  if (aha) {
    return (
      <div className="min-h-screen bg-canvas">
        <AnimatePresence mode="wait">
          <AhaStage key="aha" form={form} onUnlock={() => onEnter(form, 'home')} />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f1ea] text-[#18372f]">
      <OnboardingHeader
        step={step}
        stepLabel={t(STEP_LABELS[step])}
        lang={lang}
        onLang={setLang}
        t={t}
      />
      <div className="flex justify-end border-b border-[#d8d5ca] px-6 pb-3 sm:hidden">
        <div className="flex h-10 items-center rounded-full border border-[#c9c8be] bg-[#ebe8df] p-1">
          <LangPill lang={lang} onLang={setLang} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-8 px-6 py-8 lg:flex-row lg:gap-[52px] lg:px-14 lg:py-[42px]">
        <ContextPanel step={step} t={t} />

        <div className="flex min-w-0 flex-1 flex-col justify-center py-2">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -28 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[680px]"
            >
              {step === 0 && <NamesStep form={form} set={set} onNext={() => canAdvance && go(1)} />}
              {step === 1 && <DestinationStep form={form} setField={setField} />}
              {step === 2 && <DateStep form={form} set={set} setField={setField} />}
              {step === 3 && <ScopeStep form={form} setField={setField} />}
              {step === 4 && <StyleStep form={form} set={set} toggleVibe={toggleVibe} />}
              {step === 5 && <PartnerStep form={form} set={set} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <OnboardingFooter
        onBack={step > 0 ? () => go(step - 1) : undefined}
        onNext={() => canAdvance && go(step + 1)}
        nextLabel={step === TOTAL_STEPS - 1 ? t('Se jeres plan') : t('Fortsæt')}
        nextDisabled={!canAdvance}
        t={t}
      />
    </div>
  );
}

function OnboardingHeader({
  step, stepLabel, lang, onLang, t,
}: {
  step: number; stepLabel: string; lang: 'da' | 'en'; onLang: (l: 'da' | 'en') => void; t: (s: string, p?: Record<string, string | number>) => string;
}) {
  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  return (
    <header className="flex h-[92px] shrink-0 items-center gap-6 border-b border-[#d8d5ca] px-6 lg:gap-8 lg:px-14">
      <span
        className="w-[120px] shrink-0 font-serif text-3xl font-semibold tracking-[-0.8px] text-[#173c32] lg:w-[220px]"
        style={{ fontFamily: 'var(--font-logo)' }}
      >
        kalas
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[9px]">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[#173c32]">
            {stepLabel}
          </span>
          <span className="shrink-0 text-[13px] font-medium text-[#5f6d65]">
            {t('Trin {a} af {b}', { a: step + 1, b: TOTAL_STEPS })}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#ded9c8]">
          <motion.div
            className="h-full rounded-full bg-[#e66b4e]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      <div className="hidden h-11 shrink-0 items-center rounded-full border border-[#c9c8be] bg-[#ebe8df] p-1 sm:flex">
        <LangPill lang={lang} onLang={onLang} />
      </div>
    </header>
  );
}

function LangPill({ lang, onLang }: { lang: 'da' | 'en'; onLang: (l: 'da' | 'en') => void }) {
  return (
    <div className="flex items-center">
      {(['da', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onLang(l)}
          className={cn(
            'min-w-[72px] rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
            lang === l ? 'bg-[#173c32] font-semibold text-[#fffdf7] shadow-[0px_3px_10px_rgba(23,60,50,0.16)]' : 'text-[#526158]',
          )}
        >
          {l === 'da' ? 'Dansk' : 'English'}
        </button>
      ))}
    </div>
  );
}

function ContextPanel({ step, t }: { step: number; t: (s: string) => string }) {
  const headlines = [
    { eyebrow: 'En omtænksom start', title: 'Lad os gøre det til jeres.', sub: 'Seks korte trin hjælper Ava med at skræddersy venues, opgaver og anbefalinger til jeres bryllup.' },
    { eyebrow: 'Destination', title: 'Hvor i verden?', sub: 'Drej på kloden og vælg et sted der frister — hjemme eller langt væk.' },
    { eyebrow: 'Datoen', title: 'Hvornår siger I ja?', sub: 'En sæson, en dato eller “vi ved det ikke endnu” — Ava tilpasser sig.' },
    { eyebrow: 'Omfang', title: 'Hvor mange gæster?', sub: 'Et pejlemærke er nok — Ava bruger det til venues, budget og tidslinje.' },
    { eyebrow: 'Stilen', title: 'Hvad føles som jer?', sub: 'Vælg det der frister — Ava lærer jeres æstetik at kende.' },
    { eyebrow: 'Sammen om det', title: 'Giv partneren adgang', sub: 'I deler samme plan — ingen duplikerede lister. Valgfrit.' },
  ];
  const panel = headlines[step] ?? headlines[0];

  return (
    <aside className="hidden w-full max-w-[430px] shrink-0 flex-col justify-between rounded-3xl bg-[#173c32] p-[38px] shadow-[0px_18px_50px_rgba(23,60,50,0.16)] lg:flex lg:min-h-[620px]">
      <div className="flex flex-col gap-6">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#e66b4e]">
          <Heart size={22} className="text-[#fffdf7]" />
        </div>
        <div className="flex flex-col gap-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b8ccc3]">{t(panel.eyebrow)}</p>
          <h2 className="max-w-[330px] font-serif text-[clamp(2rem,4vw,2.875rem)] leading-[1.05] tracking-[-0.03em] text-[#fffdf7]">
            {t(panel.title)}
          </h2>
          <p className="max-w-[320px] text-base leading-[1.65] text-[#d8e2dd]">{t(panel.sub)}</p>
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-3.5">
        {[t('Anbefalinger formet omkring jer'), t('Ændr ethvert svar senere')].map((line) => (
          <div key={line} className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Check size={14} className="text-[#e8a18f]" />
            </div>
            <span className="text-sm text-[#d8e2dd]">{line}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function OnboardingFooter({
  onBack, onNext, nextLabel, nextDisabled, t,
}: {
  onBack?: () => void; onNext?: () => void; nextLabel: string; nextDisabled?: boolean; t: (s: string) => string;
}) {
  return (
    <footer className="flex shrink-0 flex-col gap-4 border-t border-[#d8d5ca] px-6 py-5 sm:flex-row sm:items-center sm:gap-6 lg:px-14 lg:py-[22px]">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#30463c]">{t('Ca. 3 minutter at gennemføre')}</p>
        <p className="text-xs text-[#69766e]">{t('Jeres svar gemmes undervejs.')}</p>
      </div>
      <div className="flex w-full shrink-0 items-center justify-end gap-3 sm:w-[390px]">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-[50px] items-center gap-2 rounded-xl px-[18px] text-sm font-semibold text-[#536259] transition-colors hover:text-[#173c32] cursor-pointer"
          >
            <ArrowLeft size={16} /> {t('Tilbage')}
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={cn(
              'flex h-[52px] flex-1 items-center justify-center gap-2.5 rounded-[14px] px-6 text-[15px] font-bold transition-opacity cursor-pointer sm:flex-initial sm:min-w-[200px]',
              nextDisabled
                ? 'cursor-not-allowed bg-[#ded9c8] text-[#8a8f87]'
                : 'bg-[#e66b4e] text-[#fffdf7] shadow-[0px_8px_22px_rgba(230,107,78,0.24)] hover:opacity-95',
            )}
          >
            {nextLabel} {!nextDisabled && <ArrowRight size={17} />}
          </button>
        )}
      </div>
    </footer>
  );
}

/* ── Step scaffolding ────────────────────────────────────────────────── */
function StepHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  const { t } = useLang();
  return (
    <div className="mb-8">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted">{t(eyebrow)}</p>
      <h2 className="display mt-3 text-[clamp(1.9rem,4.5vw,2.8rem)] leading-tight text-ink">{title}</h2>
      {sub && <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">{t(sub)}</p>}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  const { t } = useLang();
  return (
    <label className="block">
      <span className="mb-2 block text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-muted">{t(label)}</span>
      {children}
      {hint && <p className="mt-1.5 text-[0.75rem] text-muted">{t(hint)}</p>}
    </label>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('rounded-full border px-4 py-2 text-[0.85rem] transition-colors cursor-pointer',
        selected
          ? 'border-ink bg-sage-tint text-ink font-medium'
          : 'border-[var(--color-line-strong)] text-ink-soft hover:bg-shell')}>
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 1 — NAMES
══════════════════════════════════════════════════════════════════════ */
function NamesStep({ form, set, onNext }: { form: FormState; set: any; onNext: () => void }) {
  const { t } = useLang();
  const [focus, setFocus] = useState<'a' | 'b' | null>('a');

  const fieldCls = (active: boolean) =>
    cn(
      wonderInputCls,
      active
        ? 'border-2 border-[#173c32] shadow-[0px_0px_0px_4px_rgba(123,142,85,0.18)]'
        : 'border border-[#c9ccc4]',
    );

  return (
    <div className="flex flex-col gap-[34px]">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c755e]">
          {t('Velkommen til Kalas')}
        </p>
        <h1 className="flex flex-wrap items-baseline gap-x-3.5 font-serif text-[clamp(2.5rem,6vw,3.625rem)] leading-[1.04] tracking-[-0.03em] text-[#23351f]">
          <span>{t('Hvem skal')}</span>
          <span className="italic">{t('giftes?')}</span>
        </h1>
        <p className="max-w-[560px] text-[17px] leading-[1.6] text-[#56645b]">
          {t('Fortæl os hvad vi skal kalde jer begge. Ava bruger fornavne, så planlægningen føles personlig fra første skridt.')}
        </p>
      </div>

      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <label className="flex flex-1 flex-col gap-[9px]">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#39493f]">{t('Dit fornavn')}</span>
          <input
            value={form.nameA}
            onChange={set('nameA')}
            placeholder={t('f.eks. Maya')}
            className={fieldCls(focus === 'a')}
            autoFocus
            onFocus={() => setFocus('a')}
            onBlur={() => setFocus((f) => (f === 'a' ? null : f))}
            onKeyDown={(e) => { if (e.key === 'Enter') onNext(); }}
          />
        </label>
        <label className="flex flex-1 flex-col gap-[9px]">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#39493f]">{t('Partners fornavn')}</span>
          <input
            value={form.nameB}
            onChange={set('nameB')}
            placeholder={t('f.eks. Elias')}
            className={fieldCls(focus === 'b')}
            onFocus={() => setFocus('b')}
            onBlur={() => setFocus((f) => (f === 'b' ? null : f))}
            onKeyDown={(e) => { if (e.key === 'Enter') onNext(); }}
          />
        </label>
      </div>

      <div className="flex items-center gap-[9px]">
        <Lock size={15} className="shrink-0 text-[#66746c]" />
        <p className="text-[13px] text-[#66746c]">{t('Bruges kun til at personliggøre jeres planlægningsrum.')}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 2 — DESTINATION (interactive globe)
══════════════════════════════════════════════════════════════════════ */
function DestinationStep({ form, setField }: {
  form: FormState; setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const { t } = useLang();
  const [custom, setCustom] = useState(false);
  const selected = DESTINATIONS.find((d) => destinationValue(d) === form.location) ?? null;

  const pick = (d: Destination) => {
    setCustom(false);
    setField('location', destinationValue(d));
  };

  return (
    <div>
      <StepHead eyebrow="Destination" title={<>{t('Hvor i')} <span className="italic">{t('verden?')}</span></>}
        sub="Drej på kloden og vælg et sted der frister — hjemme eller langt væk." />

      <div className="-mx-6 sm:mx-0 overflow-hidden rounded-none sm:rounded-3xl">
        <DestinationGlobe selectedId={selected?.id ?? null} onPick={pick} />
      </div>

      <div className="mt-4 flex min-h-[44px] flex-wrap items-center gap-2">
        {selected && !custom ? (
          <motion.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-sage-tint px-4 py-2">
            <MapPin size={14} className="text-ink" />
            <span className="text-[0.9rem] font-medium text-ink">{t(selected.label)}, {t(selected.country)}</span>
          </motion.div>
        ) : form.location && !custom ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-sage-tint px-4 py-2">
            <MapPin size={14} className="text-ink" />
            <span className="text-[0.9rem] font-medium text-ink">{form.location}</span>
          </div>
        ) : (
          <span className="text-[0.82rem] text-muted">{t('Intet valgt endnu — prøv at trykke på en prik.')}</span>
        )}

        <button onClick={() => setCustom((v) => !v)}
          className="ml-auto text-[0.78rem] text-muted underline-offset-2 hover:text-ink hover:underline transition-colors cursor-pointer">
          {custom ? t('Tilbage til kloden') : t('Eller skriv jeres eget sted')}
        </button>
      </div>

      <AnimatePresence>
        {custom && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <input
              value={selected ? '' : form.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder={t('f.eks. Odense · Sydfyn · jeres sommerhusby')}
              className={cn(inputCls, 'mt-2')} autoFocus />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 3 — DATE
══════════════════════════════════════════════════════════════════════ */
function DateStep({ form, set, setField }: {
  form: FormState; set: any; setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const { t } = useLang();
  return (
    <div>
      <StepHead eyebrow="Hvornår" title={<>{t('Hvornår siger I')} <span className="italic">{t('ja?')}</span></>}
        sub="En sæson er fint — I behøver ikke en præcis dato endnu." />
      <div className="flex flex-wrap gap-2">
        {DATE_CHIPS.map((c) => (
          <Chip key={c.key} selected={form.dateChoice === c.key}
            onClick={() => setField('dateChoice', c.key)}>{chipLabel(c, t)}</Chip>
        ))}
        <Chip selected={form.dateChoice === 'exact'} onClick={() => setField('dateChoice', 'exact')}>{t('Præcis dato')}</Chip>
        <Chip selected={form.dateChoice === 'undecided'} onClick={() => setField('dateChoice', 'undecided')}>{t('Ved ikke endnu')}</Chip>
      </div>
      <AnimatePresence>
        {form.dateChoice === 'exact' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <input type="date" value={form.exactDate} onChange={set('exactDate')} className={cn(inputCls, 'mt-4 max-w-xs')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 4 — SCOPE (guest band · budget band)
══════════════════════════════════════════════════════════════════════ */
function ScopeStep({ form, setField }: {
  form: FormState; setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const { t } = useLang();
  return (
    <div>
      <StepHead eyebrow="Rammen" title={<>{t('Hvor stort')} <span className="italic">{t('tænker I?')}</span></>}
        sub="Bare et pejlemærke — Ava bruger det til at forme venues, budget og tidslinje." />
      <div className="space-y-7">
        <Field label="Antal gæster">
          <div className="flex flex-wrap gap-2">
            {GUEST_BANDS.map((b) => (
              <Chip key={b.key} selected={form.guestBand === b.key} onClick={() => setField('guestBand', b.key)}>
                {t(GUEST_LABELS_DA[b.key] ?? b.label)}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Budget" hint="Valgfrit — hjælper Ava med at fordele pengene fornuftigt.">
          <div className="flex flex-wrap gap-2">
            {BUDGET_BANDS_DA.map((b) => (
              <Chip key={b.key} selected={form.budgetBand === b.key} onClick={() => setField('budgetBand', b.key)}>
                <span className="mr-1">{b.emoji}</span>{t(b.label)}
              </Chip>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 5 — STYLE (vibe chips · free description)
══════════════════════════════════════════════════════════════════════ */
const MAX_DESC = 250;
function StyleStep({ form, set, toggleVibe }: {
  form: FormState; set: any; toggleVibe: (label: string) => void;
}) {
  const { t } = useLang();
  const len = form.description.length;
  return (
    <div>
      <StepHead eyebrow="Stilen" title={t('Jeres drømmebyllup')}
        sub="Vælg de stemninger der rammer jer — og beskriv gerne med egne ord. Ava bruger det til briefs og stil." />
      <div className="space-y-6">
        <Field label="Stemning" hint="Vælg gerne flere.">
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map((v) => (
              <Chip key={v.key} selected={form.vibes.includes(v.label)} onClick={() => toggleVibe(v.label)}>
                <span className="mr-1">{v.emoji}</span>{t(v.label)}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Med egne ord">
          <div className="relative">
            <textarea
              value={form.description}
              onChange={(e) => { if (e.target.value.length <= MAX_DESC) set('description')(e); }}
              placeholder={t('Vi drømmer om et bryllup i en gammel avlsgård med lange borde, levende lys og en varm, afslappet stemning…')}
              rows={5}
              className={cn(inputCls, 'resize-none leading-relaxed')}
            />
            <span className={cn('absolute bottom-3 right-4 text-[0.7rem]', len >= MAX_DESC ? 'text-clay' : 'text-muted')}>
              {len}/{MAX_DESC}
            </span>
          </div>
        </Field>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 6 — PARTNER
══════════════════════════════════════════════════════════════════════ */
function PartnerStep({ form, set }: { form: FormState; set: any }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  const nameB = form.nameB || t('din partner');

  return (
    <div>
      <StepHead eyebrow="Sammen om det" title={t('Giv {name} adgang', { name: nameB })}
        sub="I deler samme plan — ingen duplikerede lister eller beskedkopiering. Valgfrit." />
      <Field label={t('{name}s e-mail', { name: nameB })}>
        <div className="flex gap-2">
          <input type="email" value={form.partnerEmail} onChange={set('partnerEmail')}
            placeholder="partner@email.dk" className={cn(inputCls, 'flex-1')} disabled={sent} />
          <button onClick={() => form.partnerEmail.includes('@') && setSent(true)}
            disabled={sent || !form.partnerEmail.includes('@')}
            className={cn('rounded-2xl px-5 py-3.5 text-[0.88rem] font-medium shrink-0 transition-colors cursor-pointer',
              sent ? 'bg-sage-tint text-ink cursor-default'
                   : form.partnerEmail.includes('@') ? 'bg-ink text-canvas hover:bg-ink/90'
                   : 'bg-shell text-muted cursor-not-allowed')}>
            {sent ? <><Check size={14} className="inline mr-1" />{t('Sendt')}</> : t('Send')}
          </button>
        </div>
      </Field>
      <AnimatePresence>
        {sent && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl bg-sage-tint p-4">
            <p className="text-[0.88rem] text-ink leading-relaxed">
              {t('Invitation sendt til {email}. {name} får et link til at oprette adgang.', { email: form.partnerEmail, name: nameB })}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   AHA STAGE — the conversion moment
══════════════════════════════════════════════════════════════════════ */
function AhaStage({ form, onUnlock }: { form: FormState; onUnlock: () => void }) {
  const { t, lang } = useLang();
  const nameA = form.nameA || couple.a;
  const nameB = form.nameB || couple.b;
  const location = form.location || 'Sjælland';
  const guests = String(guestCountOf(form));
  const dateLabel = dateLabelOf(form, lang, t);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl px-6 py-12 sm:py-16"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 rounded-full bg-ink flex items-center justify-center shrink-0">
          <span className="font-serif text-[1.1rem] leading-none text-canvas">K</span>
        </div>
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">{t('Ava · Arbejdede imens I svarede')}</p>
      </div>

      <h1 className="display text-[clamp(2rem,5vw,3.2rem)] text-ink leading-tight">
        {t('Jeg har forberedt')}<br /><span className="italic">{t('tre ting til jer.')}</span>
      </h1>
      <p className="mt-4 text-[0.95rem] text-ink-soft leading-relaxed max-w-md">
        {t('Baseret på {guests} gæster nær {location} og jeres stil. Ét klik for at se det hele.', { guests, location })}
      </p>

      <div className="mt-10 space-y-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rule rounded-2xl bg-card px-5 py-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-sage-tint flex items-center justify-center shrink-0">
            <ListChecks size={17} className="text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[1.05rem] text-ink">{t('Tidslinje med {n} milepæle', { n: timeline.length })}</p>
            <p className="text-[0.78rem] text-muted mt-0.5">{t('Forankret baglæns fra {date}', { date: dateLabel })}</p>
          </div>
          <Check size={15} className="text-sage shrink-0" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rule rounded-2xl bg-card px-5 py-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-sage-tint flex items-center justify-center shrink-0">
            <MapPin size={17} className="text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[1.05rem] text-ink">{t('3 venues fundet nær {location}', { location })}</p>
            <p className="text-[0.78rem] text-muted mt-0.5">{t('Matchet på gæstetal, stil og dato')}</p>
          </div>
          <Check size={15} className="text-sage shrink-0" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rule rounded-2xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 rule-b">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-muted" />
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">{t('Ava har skrevet · Venue-henvendelse')}</span>
            </div>
            <span className="rounded-full bg-sage px-2.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-ink">{t('Klar til send')}</span>
          </div>

          <div className="px-5 py-3 rule-b space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="w-10 shrink-0 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-muted">{t('Til')}</span>
              <span className="text-[0.82rem] font-medium text-ink">Sonnerupgaard Gods</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="w-10 shrink-0 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-muted">{t('Emne')}</span>
              <span className="text-[0.82rem] text-ink-soft">{t('Forespørgsel — bryllup {date}', { date: dateLabel })}</span>
            </div>
          </div>

          <div className="relative px-5 py-4 text-[0.84rem] text-ink-soft leading-relaxed space-y-3">
            <p>{t('Kære {venue},', { venue: 'Sonnerupgaard Gods' })}</p>
            <p>
              {t('Vi er {a} & {b} og planlægger vores bryllup', { a: nameA, b: nameB })}{' '}
              <span className="text-ink font-medium">{dateLabel}</span>.{' '}
              {t('Vi er')}{' '}
              <span className="text-ink font-medium">{t('{guests} gæster', { guests })}</span>{' '}
              {t('og søger en venue der afspejler vores stil og stemning.')}
            </p>
            <p className="opacity-40">{t('Vi er interesserede i jeres weekendpakke og vil gerne...')}</p>
            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-card to-transparent" />
          </div>

          <div className="px-5 pb-5 pt-1">
            <button onClick={onUnlock}
              className="group w-full flex items-center justify-between rounded-2xl px-5 py-4 text-canvas transition-all cursor-pointer hover:opacity-90"
              style={{ background: 'var(--color-terracotta)' }}>
              <div className="text-left">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] opacity-75">{t('Gå ind i Kalas')}</p>
                <p className="font-serif text-[1.1rem] leading-snug mt-0.5">{t('Se hvad Ava har forberedt')}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>

      <p className="mt-6 text-center text-[0.76rem] text-muted">
        {t('Gratis at udforske · I godkender alt før noget sendes')}
      </p>
    </motion.div>
  );
}
