import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, ArrowLeft, ArrowRight, Sparkles, MapPin, ListChecks,
} from 'lucide-react';
import { couple, timeline } from '../data';
import { GUEST_BANDS, type OnboardingDate } from '@/lib/onboarding';
import type { ScreenId } from '../Shell';
import { cn } from '../ui';
import { useLang } from '../i18n';

type Stage = 'basics' | 'scope' | 'describe' | 'partner' | 'aha';
type ChatMsg = { id: string; role: 'ava' | 'user'; text: string };

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
const STEP_STAGES: Stage[] = ['basics', 'scope', 'describe', 'partner'];
const TOTAL = STEP_STAGES.length;
function stepOf(s: Stage) {
  const i = STEP_STAGES.indexOf(s);
  return i === -1 ? 0 : i + 1;
}
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
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */
export default function Onboarding({ onEnter }: { onEnter: (form: FormState, s?: ScreenId) => void }) {
  const { t, lang } = useLang();
  const [stage, setStage] = useState<Stage>('basics');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [chat, setChat] = useState<ChatMsg[]>([
    { id: 'ava-0', role: 'ava', text: t('Hej! Jeg er Ava — din personlige bryllupsassistent. Lad os starte med det vigtigste: hvem er I, og hvornår er den store dag?') },
  ]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const toggleVibe = (label: string) =>
    setForm((f) => ({ ...f, vibes: f.vibes.includes(label) ? f.vibes.filter((v) => v !== label) : [...f.vibes, label] }));

  const addChat = (msgs: Omit<ChatMsg, 'id'>[]) =>
    setChat((prev) => [...prev, ...msgs.map((m, i) => ({ ...m, id: `msg-${Date.now()}-${i}` }))]);

  const goScope = () => {
    const dateStr = dateLabelOf(form, lang, t);
    const who = t('Vi er {a} & {b}', { a: form.nameA || 'A', b: form.nameB || 'B' });
    const where = form.location
      ? t(' — vi gifter os {date} nær {location}.', { date: dateStr, location: form.location })
      : t(' — vi gifter os {date}.', { date: dateStr });
    addChat([
      { role: 'user', text: who + where },
      { role: 'ava', text: t('Dejligt! Hvor stort tænker I det — og hvad er rammen budgetmæssigt? Bare et pejlemærke, det kan altid justeres.') },
    ]);
    setStage('scope');
  };

  const goDescribe = () => {
    const guests = GUEST_BANDS.find((b) => b.key === form.guestBand);
    const budget = BUDGET_BANDS_DA.find((b) => b.key === form.budgetBand);
    const guestPart = guests ? `${t(GUEST_LABELS_DA[guests.key])} ${t('gæster')}` : t('Et selskab');
    const budgetPart = budget && budget.amount != null ? t(', {budget} budget', { budget: t(budget.label).toLowerCase() }) : '';
    addChat([
      { role: 'user', text: `${guestPart}${budgetPart}.` },
      { role: 'ava', text: t('Godt udgangspunkt. Nu til det sjove: hvad drømmer I om? Vælg de stemninger der rammer jer — og beskriv gerne med egne ord.') },
    ]);
    setStage('describe');
  };

  const goPartner = () => {
    const picked = form.vibes.slice(0, 3).map((v) => t(v)).join(', ');
    const raw = form.description.trim();
    const excerpt = raw ? (raw.length > 90 ? raw.slice(0, 90) + '…' : raw) : null;
    addChat([
      { role: 'user', text: [picked && t('Stil: {s}', { s: picked }), excerpt && `"${excerpt}"`].filter(Boolean).join(' · ') || t('Vi finder stilen undervejs.') },
      { role: 'ava', text: t('Smukt — jeg noterer det til jeres leverandør-briefs og hjemmeside. Planlægger I det to?') },
    ]);
    setStage('partner');
  };

  const goAha = () => {
    const hasPart = form.partnerEmail.includes('@');
    const near = form.location ? t('nær {location}', { location: form.location }) : t('i jeres region');
    addChat([
      { role: 'user', text: hasPart ? t('{email} er inviteret som medplanlægger.', { email: form.partnerEmail }) : t('Jeg klarer det for nu — inviterer partneren senere.') },
      { role: 'ava', text: t('Perfekt. Imens I svarede har jeg allerede forberedt jeres tidslinje, fundet tre venues {near} og skrevet den første henvendelse. Klar til at se det?', { near }) },
    ]);
    setStage('aha');
  };

  /* Aha: full-screen single column — straight into the app, no paywall. */
  if (stage === 'aha') {
    return (
      <div className="min-h-screen bg-canvas">
        <AnimatePresence mode="wait">
          <AhaStage key="aha" form={form} onUnlock={() => onEnter(form, 'home')} />
        </AnimatePresence>
      </div>
    );
  }

  /* Chat stages: split layout */
  return (
    <div className="min-h-screen bg-canvas grid lg:grid-cols-[1fr_480px]">
      <ChatPanel chat={chat} />

      <div className="rule-t lg:rule-t-0 lg:rule-l flex flex-col min-h-screen">
        <div className="px-8 pt-8 pb-0">
          <ProgressBar stage={stage} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={stage}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col px-8 pb-10">

            {stage === 'basics' && (
              <BasicsForm form={form} set={set} setField={setField} onNext={goScope} />
            )}
            {stage === 'scope' && (
              <ScopeForm form={form} setField={setField} onBack={() => setStage('basics')} onNext={goDescribe} />
            )}
            {stage === 'describe' && (
              <DescribeForm form={form} set={set} toggleVibe={toggleVibe} onBack={() => setStage('scope')} onNext={goPartner} />
            )}
            {stage === 'partner' && (
              <PartnerForm form={form} set={set} onBack={() => setStage('describe')} onNext={goAha} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Left panel: growing chat thread ────────────────────────────────── */
function ChatPanel({ chat }: { chat: ChatMsg[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [chat]);

  return (
    <div className="hidden lg:flex flex-col bg-shell min-h-screen">
      <div className="px-10 py-10 shrink-0">
        <span className="text-[1.4rem] lowercase text-ink" style={{ fontFamily: 'var(--font-logo)', fontWeight: 500, letterSpacing: '0.02em' }}>kalas</span>
      </div>

      <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-4 hide-scrollbar">
        <AnimatePresence initial={false}>
          {chat.map((msg) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>

              {msg.role === 'ava' && (
                <div className="shrink-0 h-8 w-8 rounded-full bg-ink flex items-center justify-center mt-0.5">
                  <span className="font-serif text-[1rem] leading-none text-canvas">K</span>
                </div>
              )}

              <div className={cn(
                'max-w-[78%] rounded-2xl px-4 py-3 text-[0.9rem] leading-relaxed',
                msg.role === 'ava'
                  ? 'rule bg-canvas text-ink rounded-tl-sm'
                  : 'bg-ink text-canvas rounded-tr-sm font-sans',
              )}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="px-10 py-8 shrink-0">
        <p className="font-serif text-[0.85rem] italic text-muted">
          {useLang().t('Planlagt med ro — af Ava, godkendt af jer.')}
        </p>
      </div>
    </div>
  );
}

/* ── Progress bar ────────────────────────────────────────────────────── */
function ProgressBar({ stage }: { stage: Stage }) {
  const step = stepOf(stage);
  if (step === 0) return null;
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="flex-1 h-1 bg-shell rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-ink"
          animate={{ width: `${(step / TOTAL) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }} />
      </div>
      <span className="text-[0.72rem] font-medium text-muted shrink-0">{step} / {TOTAL}</span>
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────────────────────── */
function NavRow({ onBack, onNext, nextLabel = 'Næste', nextDisabled }: {
  onBack?: () => void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean;
}) {
  const { t } = useLang();
  return (
    <div className="mt-10 flex gap-3">
      {onBack && (
        <button onClick={onBack}
          className="flex items-center gap-2 rounded-2xl border border-[var(--color-line-strong)] px-5 py-3.5 text-[0.9rem] font-medium text-ink-soft hover:text-ink hover:border-ink transition-colors cursor-pointer">
          <ArrowLeft size={15} /> {t('Tilbage')}
        </button>
      )}
      {onNext && (
        <button onClick={onNext} disabled={nextDisabled}
          className={cn('flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[0.9rem] font-medium transition-colors cursor-pointer',
            nextDisabled ? 'bg-shell text-muted cursor-not-allowed' : 'bg-ink text-canvas hover:bg-ink/90')}>
          {t(nextLabel)} {!nextDisabled && <ArrowRight size={15} />}
        </button>
      )}
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
   STAGE 1 — BASICS (names · location · date chips)
══════════════════════════════════════════════════════════════════════ */
function BasicsForm({ form, set, setField, onNext }: {
  form: FormState; set: any; setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void; onNext: () => void;
}) {
  const { t } = useLang();
  const dateReady = form.dateChoice === 'exact' ? Boolean(form.exactDate) : Boolean(form.dateChoice);
  const ready = form.nameA.trim() && form.nameB.trim() && form.location.trim() && dateReady;
  return (
    <div className="flex flex-col flex-1">
      <div className="mt-2">
        <h2 className="display text-[clamp(1.8rem,4vw,2.6rem)] text-ink leading-tight">
          {t('Fortæl om')} <span className="italic">{t('brylluppet')}</span>
        </h2>
        <p className="mt-2 text-[0.88rem] text-ink-soft">{t('Ingen konto nødvendig — I kan altid ændre det undervejs.')}</p>
      </div>

      <div className="mt-8 flex-1 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dit navn">
            <input value={form.nameA} onChange={set('nameA')} placeholder={t('Fornavn')} className={inputCls} autoFocus />
          </Field>
          <Field label="Partners navn">
            <input value={form.nameB} onChange={set('nameB')} placeholder={t('Fornavn')} className={inputCls} />
          </Field>
        </div>

        <Field label="Lokation" hint="Hjemland eller udland — skriv hvad I drømmer om.">
          <input value={form.location} onChange={set('location')}
            placeholder={t('f.eks. nær København · Toscana · Sydfrankrig')} className={inputCls} />
        </Field>

        <Field label="Hvornår?" hint="En sæson er fint — I behøver ikke en præcis dato endnu.">
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
                <input type="date" value={form.exactDate} onChange={set('exactDate')} className={cn(inputCls, 'mt-3')} />
              </motion.div>
            )}
          </AnimatePresence>
        </Field>
      </div>

      <NavRow onNext={onNext} nextLabel="Det lyder godt" nextDisabled={!ready} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STAGE 2 — SCOPE (guest band · budget band)
══════════════════════════════════════════════════════════════════════ */
function ScopeForm({ form, setField, onBack, onNext }: {
  form: FormState; setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void; onBack: () => void; onNext: () => void;
}) {
  const { t } = useLang();
  const ready = Boolean(form.guestBand);
  return (
    <div className="flex flex-col flex-1">
      <div className="mt-2">
        <h2 className="display text-[clamp(1.8rem,4vw,2.6rem)] text-ink leading-tight">{t('Hvor stort')} <span className="italic">{t('tænker I?')}</span></h2>
        <p className="mt-2 text-[0.88rem] text-ink-soft">{t('Bare et pejlemærke — Ava bruger det til at forme venues, budget og tidslinje.')}</p>
      </div>

      <div className="mt-8 flex-1 space-y-7">
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

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Videre" nextDisabled={!ready} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STAGE 3 — DESCRIBE (vibe chips · free description)
══════════════════════════════════════════════════════════════════════ */
const MAX_DESC = 250;
function DescribeForm({ form, set, toggleVibe, onBack, onNext }: {
  form: FormState; set: any; toggleVibe: (label: string) => void; onBack: () => void; onNext: () => void;
}) {
  const { t } = useLang();
  const len = form.description.length;
  return (
    <div className="flex flex-col flex-1">
      <div className="mt-2">
        <h2 className="display text-[clamp(1.8rem,4vw,2.6rem)] text-ink leading-tight">{t('Jeres drømmebyllup')}</h2>
        <p className="mt-2 text-[0.88rem] text-ink-soft">
          {t('Vælg de stemninger der rammer jer — og beskriv gerne med egne ord. Ava bruger det til briefs og stil.')}
        </p>
      </div>

      <div className="mt-8 flex-1 space-y-6">
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
              rows={6}
              className={cn(inputCls, 'resize-none leading-relaxed')}
            />
            <span className={cn('absolute bottom-3 right-4 text-[0.7rem]', len >= MAX_DESC ? 'text-clay' : 'text-muted')}>
              {len}/{MAX_DESC}
            </span>
          </div>
        </Field>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Videre" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STAGE 4 — PARTNER
══════════════════════════════════════════════════════════════════════ */
function PartnerForm({ form, set, onBack, onNext }: { form: FormState; set: any; onBack: () => void; onNext: () => void }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  const nameB = form.nameB || t('din partner');

  return (
    <div className="flex flex-col flex-1">
      <div className="mt-2">
        <h2 className="display text-[clamp(1.8rem,4vw,2.6rem)] text-ink leading-tight">{t('Giv {name} adgang', { name: nameB })}</h2>
        <p className="mt-2 text-[0.88rem] text-ink-soft">
          {t('I deler samme plan — ingen duplikerede lister eller beskedkopiering.')}
        </p>
      </div>

      <div className="mt-8 flex-1 space-y-5">
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
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-sage-tint p-4">
              <p className="text-[0.88rem] text-ink leading-relaxed">
                {t('Invitation sendt til {email}. {name} får et link til at oprette adgang.', { email: form.partnerEmail, name: nameB })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--color-line)]" />
          <span className="text-[0.74rem] text-muted">{t('eller')}</span>
          <div className="flex-1 h-px bg-[var(--color-line)]" />
        </div>

        <button onClick={onNext}
          className="w-full py-2 text-center text-[0.84rem] text-muted hover:text-ink transition-colors cursor-pointer">
          {t('Spring over — invitér {name} senere', { name: nameB })}
        </button>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Se jeres plan" />
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
