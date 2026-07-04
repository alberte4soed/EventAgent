import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, Eye, EyeOff, ArrowLeft, ArrowRight, Lock, Sparkles, MapPin, ListChecks,
} from 'lucide-react';
import { couple, timeline, budgetLines, IMAGES } from '../data';
import type { ScreenId } from '../Shell';
import { Eyebrow, Pill, Bleed, cn } from '../ui';
import AnimateNumber from '../AnimateNumber';

export type Answers = Record<string, string>;

type Stage = 'basics' | 'describe' | 'partner' | 'aha';
type ChatMsg = { id: string; role: 'ava' | 'user'; text: string };

export type FormState = {
  email: string; password: string;
  nameA: string; nameB: string;
  location: string; date: string; guests: string; budget: string;
  description: string; partnerEmail: string;
};

const STEP_STAGES: Stage[] = ['basics', 'describe', 'partner'];
const TOTAL = STEP_STAGES.length;

function stepOf(s: Stage) {
  const i = STEP_STAGES.indexOf(s);
  return i === -1 ? 0 : i + 1;
}

function fmtDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
}

const inputCls = 'w-full rounded-2xl border border-[var(--color-line-strong)] bg-canvas px-4 py-3.5 text-[1rem] text-ink placeholder:text-muted focus:border-ink focus:outline-none transition-colors';

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */
export default function Onboarding({ onEnter }: { onEnter: (form: FormState, s?: ScreenId) => void }) {
  const [stage, setStage] = useState<Stage>('basics');
  const [form, setForm] = useState<FormState>({
    email: '', password: '',
    nameA: '', nameB: '',
    location: '', date: '', guests: '', budget: '',
    description: '', partnerEmail: '',
  });

  const [chat, setChat] = useState<ChatMsg[]>([
    { id: 'ava-0', role: 'ava', text: 'Hej! Jeg er Ava — din personlige bryllupsassistent. Lad os starte med det vigtigste: hvem er I, og hvornår er den store dag?' },
  ]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const addChat = (msgs: Omit<ChatMsg, 'id'>[]) =>
    setChat(prev => [...prev, ...msgs.map((m, i) => ({ ...m, id: `msg-${Date.now()}-${i}` }))]);

  const goDescribe = () => {
    const gStr = form.guests ? `~${form.guests} gæster` : 'et selskab';
    const locStr = form.location ? `nær ${form.location}` : '';
    const dateStr = fmtDate(form.date);
    addChat([
      { role: 'user', text: `Vi er ${form.nameA || 'A'} & ${form.nameB || 'B'}${gStr ? ` — ${gStr}` : ''}${locStr ? ` ${locStr}` : ''}${dateStr ? `. Dato: ${dateStr}.` : '.'}` },
      { role: 'ava', text: `${form.guests || '...'} gæster ${locStr} — godt udgangspunkt. Nu til det sjove: hvad drømmer I om? Stil, stemning, et enkelt billede i ord.` },
    ]);
    setStage('describe');
  };

  const goPartner = () => {
    const raw = form.description.trim();
    const excerpt = raw ? (raw.length > 110 ? raw.slice(0, 110) + '…' : raw) : null;
    addChat([
      { role: 'user', text: excerpt ? `"${excerpt}"` : 'Vi springer over for nu — tilføjer stil-beskrivelse senere.' },
      { role: 'ava', text: excerpt
        ? 'Smuk beskrivelse — jeg noterer det til jeres leverandør-briefs og hjemmeside. Planlægger I det to, eller er du alene om det?'
        : 'Ingen stress — I kan altid tilføje det fra moodboard-siden. Er I to om planlægningen?' },
    ]);
    setStage('partner');
  };

  const goAha = () => {
    const hasPart = form.partnerEmail.includes('@');
    addChat([
      { role: 'user', text: hasPart ? `${form.partnerEmail} er inviteret som medplanlægger.` : 'Jeg klarer det for nu — inviterer partneren senere.' },
      { role: 'ava', text: `Perfekt. Imens I svarede har jeg allerede forberedt jeres tidslinje, fundet tre venues ${form.location ? `nær ${form.location}` : 'i jeres region'} og skrevet den første henvendelse. Klar til at se det?` },
    ]);
    setStage('aha');
  };

  /* Aha: full-screen single column — straight into the app, no paywall.
     Payment happens at the send moment inside the app. */
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

      {/* ── Left: persistent chat thread ──────────────────────────────── */}
      <ChatPanel chat={chat} />

      {/* ── Right: animated form ──────────────────────────────────────── */}
      <div className="rule-t lg:rule-t-0 lg:rule-l flex flex-col min-h-screen">
        {/* Progress */}
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
              <BasicsForm form={form} set={set}
                onBack={undefined}
                onNext={goDescribe} />
            )}
            {stage === 'describe' && (
              <DescribeForm form={form} set={set}
                onBack={() => setStage('basics')}
                onNext={goPartner} />
            )}
            {stage === 'partner' && (
              <PartnerForm form={form} set={set}
                onBack={() => setStage('describe')}
                onNext={goAha} />
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat]);

  return (
    <div className="hidden lg:flex flex-col bg-shell min-h-screen">
      {/* Logo */}
      <div className="px-10 py-10 shrink-0">
        <span className="text-[1.4rem] lowercase text-ink" style={{ fontFamily: 'var(--font-logo)', fontWeight: 500, letterSpacing: '0.02em' }}>kalas</span>
      </div>

      {/* Thread */}
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

      {/* Bottom brand whisper */}
      <div className="px-10 py-8 shrink-0">
        <p className="font-serif text-[0.85rem] italic text-muted">
          Planlagt med ro — af Ava, godkendt af jer.
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
        <motion.div
          className="h-full rounded-full bg-ink"
          animate={{ width: `${(step / TOTAL) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[0.72rem] font-medium text-muted shrink-0">{step} / {TOTAL}</span>
    </div>
  );
}

/* ── Shared nav buttons ──────────────────────────────────────────────── */
function NavRow({ onBack, onNext, nextLabel = 'Næste', nextDisabled }: {
  onBack?: () => void; onNext?: () => void;
  nextLabel?: string; nextDisabled?: boolean;
}) {
  return (
    <div className="mt-10 flex gap-3">
      {onBack && (
        <button onClick={onBack}
          className="flex items-center gap-2 rounded-2xl border border-[var(--color-line-strong)] px-5 py-3.5 text-[0.9rem] font-medium text-ink-soft hover:text-ink hover:border-ink transition-colors cursor-pointer">
          <ArrowLeft size={15} /> Tilbage
        </button>
      )}
      {onNext && (
        <button onClick={onNext} disabled={nextDisabled}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[0.9rem] font-medium transition-colors cursor-pointer',
            nextDisabled
              ? 'bg-shell text-muted cursor-not-allowed'
              : 'bg-ink text-canvas hover:bg-ink/90',
          )}>
          {nextLabel} {!nextDisabled && <ArrowRight size={15} />}
        </button>
      )}
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      {children}
      {hint && <p className="mt-1.5 text-[0.75rem] text-muted">{hint}</p>}
    </label>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════
   BASICS FORM
══════════════════════════════════════════════════════════════════════ */
function BasicsForm({ form, set, onBack, onNext }: { form: FormState; set: any; onBack?: () => void; onNext: () => void }) {
  const ready = form.nameA.trim() && form.nameB.trim() && form.location.trim() && form.date && form.guests.trim();
  return (
    <div className="flex flex-col flex-1">
      <div className="mt-2">
        <h2 className="display text-[clamp(1.8rem,4vw,2.6rem)] text-ink leading-tight">
          Fortæl om <span className="italic">brylluppet</span>
        </h2>
        <p className="mt-2 text-[0.88rem] text-ink-soft">Ingen konto nødvendig — I kan altid ændre det undervejs.</p>
      </div>

      <div className="mt-8 flex-1 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dit navn">
            <input value={form.nameA} onChange={set('nameA')} placeholder="Fornavn" className={inputCls} autoFocus />
          </Field>
          <Field label="Partners navn">
            <input value={form.nameB} onChange={set('nameB')} placeholder="Fornavn" className={inputCls} />
          </Field>
        </div>

        <Field label="Bryllupsdato">
          <input type="date" value={form.date} onChange={set('date')} className={inputCls} />
        </Field>

        <Field label="Lokation" hint="Hjemland eller udland — skriv hvad I drømmer om.">
          <input value={form.location} onChange={set('location')}
            placeholder="f.eks. nær København · Toscana · Sydfrankrig"
            className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Gæster">
            <input type="number" min="1" value={form.guests} onChange={set('guests')}
              placeholder="120" className={inputCls} />
          </Field>
          <Field label="Budget (kr)">
            <input value={form.budget} onChange={set('budget')}
              placeholder="250.000" className={inputCls} />
          </Field>
        </div>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Det lyder godt" nextDisabled={!ready} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DESCRIBE FORM
══════════════════════════════════════════════════════════════════════ */
const MAX_DESC = 250;
function DescribeForm({ form, set, onBack, onNext }: { form: FormState; set: any; onBack: () => void; onNext: () => void }) {
  const len = form.description.length;
  return (
    <div className="flex flex-col flex-1">
      <div className="mt-2">
        <h2 className="display text-[clamp(1.8rem,4vw,2.6rem)] text-ink leading-tight">Jeres drømmebyllup</h2>
        <p className="mt-2 text-[0.88rem] text-ink-soft">
          Beskriv det med egne ord. Ava bruger dette til leverandør-briefs og til at forme jeres stil.
        </p>
      </div>

      <div className="mt-8 flex-1">
        <div className="relative">
          <textarea
            value={form.description}
            onChange={(e) => { if (e.target.value.length <= MAX_DESC) set('description')(e); }}
            placeholder="Vi drømmer om et bryllup i en gammel avlsgård med lange borde, levende lys og en varm, afslappet stemning…"
            rows={8}
            className={cn(inputCls, 'resize-none leading-relaxed')}
          />
          <span className={cn('absolute bottom-3 right-4 text-[0.7rem]',
            len >= MAX_DESC ? 'text-clay' : 'text-muted')}>
            {len}/{MAX_DESC}
          </span>
        </div>
        <p className="mt-3 text-[0.78rem] text-muted leading-relaxed">
          Ingen inspiration endnu? Spring over — I kan bygge moodboard bagefter.
        </p>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Videre" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PARTNER FORM
══════════════════════════════════════════════════════════════════════ */
function PartnerForm({ form, set, onBack, onNext }: { form: FormState; set: any; onBack: () => void; onNext: () => void }) {
  const [sent, setSent] = useState(false);
  const nameB = form.nameB || 'din partner';

  return (
    <div className="flex flex-col flex-1">
      <div className="mt-2">
        <h2 className="display text-[clamp(1.8rem,4vw,2.6rem)] text-ink leading-tight">
          Giv {nameB} adgang
        </h2>
        <p className="mt-2 text-[0.88rem] text-ink-soft">
          I deler samme plan — ingen duplikerede lister eller beskedkopiering.
        </p>
      </div>

      <div className="mt-8 flex-1 space-y-5">
        <Field label={`${nameB}s e-mail`}>
          <div className="flex gap-2">
            <input type="email" value={form.partnerEmail} onChange={set('partnerEmail')}
              placeholder="partner@email.dk"
              className={cn(inputCls, 'flex-1')} disabled={sent} />
            <button onClick={() => form.partnerEmail.includes('@') && setSent(true)}
              disabled={sent || !form.partnerEmail.includes('@')}
              className={cn('rounded-2xl px-5 py-3.5 text-[0.88rem] font-medium shrink-0 transition-colors cursor-pointer',
                sent ? 'bg-sage-tint text-ink cursor-default'
                     : form.partnerEmail.includes('@') ? 'bg-ink text-canvas hover:bg-ink/90'
                     : 'bg-shell text-muted cursor-not-allowed')}>
              {sent ? <><Check size={14} className="inline mr-1" />Sendt</> : 'Send'}
            </button>
          </div>
        </Field>

        <AnimatePresence>
          {sent && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-sage-tint p-4">
              <p className="text-[0.88rem] text-ink leading-relaxed">
                Invitation sendt til <strong>{form.partnerEmail}</strong>. {nameB} får et link til at oprette adgang.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--color-line)]" />
          <span className="text-[0.74rem] text-muted">eller</span>
          <div className="flex-1 h-px bg-[var(--color-line)]" />
        </div>

        <button onClick={onNext}
          className="w-full py-2 text-center text-[0.84rem] text-muted hover:text-ink transition-colors cursor-pointer">
          Spring over — invitér {nameB} senere
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
  const nameA = form.nameA || couple.a;
  const nameB = form.nameB || couple.b;
  const location = form.location || 'Sjælland';
  const guests = form.guests || String(couple.guests);
  const dateLabel = form.date
    ? new Date(form.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
    : couple.dateLabel;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl px-6 py-12 sm:py-16"
    >
      {/* Ava kicker */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 rounded-full bg-ink flex items-center justify-center shrink-0">
          <span className="font-serif text-[1.1rem] leading-none text-canvas">K</span>
        </div>
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">Ava · Poderede imens I svarede</p>
        </div>
      </div>

      <h1 className="display text-[clamp(2rem,5vw,3.2rem)] text-ink leading-tight">
        Jeg har forberedt<br /><span className="italic">tre ting til jer.</span>
      </h1>
      <p className="mt-4 text-[0.95rem] text-ink-soft leading-relaxed max-w-md">
        Baseret på {guests} gæster nær {location} og jeres stil. Ét klik for at se det hele.
      </p>

      {/* 3 prepared items */}
      <div className="mt-10 space-y-3">

        {/* 1 — Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rule rounded-2xl bg-card px-5 py-4 flex items-center gap-4"
        >
          <div className="h-10 w-10 rounded-full bg-sage-tint flex items-center justify-center shrink-0">
            <ListChecks size={17} className="text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[1.05rem] text-ink">Tidslinje med {timeline.length} milepæle</p>
            <p className="text-[0.78rem] text-muted mt-0.5">Forankret baglæns fra {dateLabel}</p>
          </div>
          <Check size={15} className="text-sage shrink-0" />
        </motion.div>

        {/* 2 — Venues */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rule rounded-2xl bg-card px-5 py-4 flex items-center gap-4"
        >
          <div className="h-10 w-10 rounded-full bg-sage-tint flex items-center justify-center shrink-0">
            <MapPin size={17} className="text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[1.05rem] text-ink">3 venues fundet nær {location}</p>
            <p className="text-[0.78rem] text-muted mt-0.5">Matchet på gæstetal, stil og dato</p>
          </div>
          <Check size={15} className="text-sage shrink-0" />
        </motion.div>

        {/* 3 — Email draft — the hero, partially locked */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rule rounded-2xl bg-card overflow-hidden"
        >
          {/* Email header */}
          <div className="flex items-center justify-between px-5 py-3 rule-b">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-muted" />
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">Ava har skrevet · Venue-henvendelse</span>
            </div>
            <span className="rounded-full bg-sage px-2.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-ink">Klar til send</span>
          </div>

          {/* Email meta */}
          <div className="px-5 py-3 rule-b space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="w-10 shrink-0 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-muted">Til</span>
              <span className="text-[0.82rem] font-medium text-ink">Sonnerupgaard Gods</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="w-10 shrink-0 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-muted">Emne</span>
              <span className="text-[0.82rem] text-ink-soft">Forespørgsel — bryllup {dateLabel}</span>
            </div>
          </div>

          {/* Email body — fades out into lock */}
          <div className="relative px-5 py-4 text-[0.84rem] text-ink-soft leading-relaxed space-y-3">
            <p>Kære Sonnerupgaard Gods,</p>
            <p>
              Vi er {nameA} & {nameB} og planlægger vores bryllup den{' '}
              <span className="text-ink font-medium">{dateLabel}</span>. Vi er{' '}
              <span className="text-ink font-medium">{guests} gæster</span> og søger en venue
              der afspejler vores stil og stemning.
            </p>
            <p className="opacity-40">Vi er interesserede i jeres weekendpakke og vil gerne...</p>

            {/* Fade-to-lock overlay */}
            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-card to-transparent" />
          </div>

          {/* Enter CTA */}
          <div className="px-5 pb-5 pt-1">
            <button
              onClick={onUnlock}
              className="group w-full flex items-center justify-between rounded-2xl px-5 py-4 text-canvas transition-all cursor-pointer hover:opacity-90"
              style={{ background: 'var(--color-terracotta)' }}
            >
              <div className="text-left">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] opacity-75">Gå ind i Kalas</p>
                <p className="font-serif text-[1.1rem] leading-snug mt-0.5">Se hvad Ava har forberedt</p>
              </div>
              <ArrowRight size={16} className="shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>

      <p className="mt-6 text-center text-[0.76rem] text-muted">
        Gratis at udforske · I godkender alt før noget sendes
      </p>
    </motion.div>
  );
}

