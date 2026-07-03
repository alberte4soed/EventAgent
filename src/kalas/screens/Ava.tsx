import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Send, Paperclip } from 'lucide-react';
import { avaThread, couple, type ChatMsg } from '../data';
import { useKalas } from '../store';
import { cn } from '../ui';
import OnboardingHint from '../OnboardingHint';

const SUGGESTIONS = ['Vis mig fotograftilbuddene', 'Hvad mangler vi at booke?', 'Book visning lørdag'];

const AVA_REPLIES: Record<string, string> = {
  'Vis mig fotograftilbuddene': `Jeg har to stærke bud til jer:\n\nStudio Hald Foto — 24.000 kr, lyst og dokumentarisk, rammer jeres moodboard præcist.\nMarie Lyng Foto — 18.500 kr, filmisk og varm. Mest budgetvenlig.\n\nVil I have at jeg sender en forespørgsel til begge?`,
  'Hvad mangler vi at booke?': `Baseret på jeres tidslinje mangler I:\n\n• Bordplan & menu (deadline 12. aug)\n• Invitationer sendt (deadline 20. aug)\n• Koordinering med leverandører (5. sep)\n\nJeg kan klare leverandørkontakten — vil I have mig gå i gang?`,
  'Book visning lørdag': `Jeg har tjekket Sonnerupgaard Gods og Kongsdal Gods. Begge har ledige lørdage i juli.\n\nJeg sender en koordineringsmail til begge nu — I modtager bekræftelse inden for 24 timer.`,
  default: `Det noterer jeg. Jeg undersøger det og vender tilbage med et konkret forslag — typisk inden for et par timer.\n\nI mellemtiden kan I altid spørge om venues, budget eller jeres tidslinje.`,
};

type Action = { label: string; reply: string };
type DayMarker = { id: string; type: 'day'; label: string };
type ProMsg = ChatMsg & { actions?: Action[] };
type MsgOrMarker = ProMsg | DayMarker;

const PROACTIVE_THREAD: MsgOrMarker[] = [
  { id: 'day0', type: 'day', label: '3 dage siden' },
  {
    id: 'pro1', from: 'ava',
    text: `Hej ${couple.a}! Sonnerupgaard Gods svarede i går — de er ledige den 12. september og vil gerne booke en fremvisning. Jeg har et svar klar til dem. Vil I godkende det?`,
    actions: [
      { label: 'Ja, send svaret', reply: 'Sendt. Jeg har foreslået fremvisning lørdag kl. 11 — I får besked, så snart de bekræfter.' },
      { label: 'Vis mig udkastet først', reply: `Selvfølgelig. Udkastet lyder:\n\n"Kære Sonnerupgaard Gods, tak for jeres svar. Vi vil meget gerne se stedet — passer en lørdag formiddag i juli?"\n\nSkal jeg sende det?` },
    ],
  },
  {
    id: 'pro2', from: 'ava',
    text: '23 gæster har endnu ikke svaret på RSVP. Vil I have mig sende en venlig påmindelsesbesked til dem? Jeg har et udkast klar.',
    actions: [
      { label: 'Ja, send påmindelsen', reply: 'Påmindelsen er sendt til alle 23. Jeg opdaterer gæstelisten løbende, efterhånden som svarene kommer ind.' },
      { label: 'Vent lidt endnu', reply: 'Helt fint. Jeg minder jer om det igen om en uge — deadline er 1. august, så der er god tid.' },
    ],
  },
  { id: 'day1', type: 'day', label: 'I dag' },
  ...avaThread,
];

/* Module-level cache so the conversation survives navigating away. */
let chatCache: MsgOrMarker[] | null = null;

export default function Ava() {
  const { clearAvaBadge } = useKalas();
  const [msgs, setMsgs] = useState<MsgOrMarker[]>(() => chatCache ?? PROACTIVE_THREAD);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { clearAvaBadge(); }, []);
  useEffect(() => { chatCache = msgs; }, [msgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  const send = (text: string, forcedReply?: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: `u${Date.now()}`, from: 'me', text }]);
    setDraft('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const reply = forcedReply ?? AVA_REPLIES[text] ?? AVA_REPLIES.default;
      setMsgs((m) => [...m, { id: `a${Date.now()}`, from: 'ava', text: reply }]);
    }, 1200);
  };

  const answerAction = (msgId: string, action: Action) => {
    // Remove the buttons from the answered message, then run the exchange.
    setMsgs((m) => m.map((x) => x.id === msgId && !('type' in x) ? { ...x, actions: undefined } : x));
    send(action.label, action.reply);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-130px)] max-w-2xl flex-col px-5 lg:h-screen">
      <header className="flex items-center gap-3 rule-b py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink">
          <span className="font-serif text-[1.3rem] leading-none text-canvas">K</span>
        </div>
        <div>
          <div className="font-serif text-[1.15rem] text-ink">Ava</div>
          <div className="text-[0.72rem] text-success">● Online · arbejder på 3 tråde</div>
        </div>
      </header>

      <div className="hide-scrollbar flex-1 space-y-4 overflow-y-auto py-7">
        {msgs.map((m) =>
          'type' in m && m.type === 'day'
            ? <DayDivider key={m.id} label={m.label} />
            : <Bubble key={m.id} msg={m as ProMsg} onAction={(a) => answerAction(m.id, a)} />
        )}
        {typing && <TypingDots />}
        <div ref={endRef} />
      </div>

      <div className="pb-3 pt-2 lg:pb-7">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="rounded-full rule bg-card px-3.5 py-2 text-[0.8rem] text-ink-soft transition-colors hover:bg-shell cursor-pointer">
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(draft); }}
          className="flex items-center gap-2 rounded-full rule bg-card px-2 py-2">
          <button type="button" onClick={() => document.getElementById('ava-file-input')?.click()}
            aria-label="Vedhæft fil"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:text-ink cursor-pointer">
            <Paperclip size={17} />
          </button>
          <input id="ava-file-input" type="file" accept="image/*,.pdf" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) send(`Vedhæftet: ${e.target.files[0].name}`); }} />
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="Skriv til Ava…"
            aria-label="Besked til Ava"
            className="flex-1 bg-transparent text-[0.98rem] text-ink placeholder:text-faint focus:outline-none" />
          <button type="submit" aria-label="Send besked"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-ink transition-colors hover:bg-sage-strong cursor-pointer">
            <Send size={16} />
          </button>
        </form>
      </div>
      <OnboardingHint id="ava" />
    </div>
  );
}

function Bubble({ msg, onAction }: { msg: ProMsg; onAction: (a: Action) => void }) {
  const mine = msg.from === 'me';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      <div className={cn('max-w-[80%] whitespace-pre-line rounded-3xl px-5 py-3.5 text-[0.97rem] leading-relaxed',
        mine ? 'rounded-br-lg bg-ink text-canvas' : 'rounded-bl-lg rule bg-card text-ink')}>
        {msg.text}
      </div>
      {msg.actions && (
        <div className="mt-2 flex flex-wrap gap-2 max-w-[80%]">
          {msg.actions.map((a) => (
            <button key={a.label} onClick={() => onAction(a)}
              className="rounded-full px-4 py-2 text-[0.8rem] font-medium text-canvas hover:opacity-90 transition-opacity cursor-pointer"
              style={{ background: 'var(--color-terracotta)' }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-[var(--color-line)]" />
      <span className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted">{label}</span>
      <div className="flex-1 h-px bg-[var(--color-line)]" />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1.5 rounded-3xl rounded-bl-lg rule bg-card px-5 py-4">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </div>
  );
}
