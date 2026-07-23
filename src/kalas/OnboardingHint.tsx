import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useLang } from './i18n';

export type HintId =
  | 'home' | 'ava' | 'team'
  | 'budget' | 'guests' | 'website' | 'invites' | 'planning' | 'seating';

interface HintConfig {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
}

const HINTS: Record<HintId, HintConfig> = {
  home: {
    eyebrow: 'Kom godt i gang',
    title: 'Ava har gjort klar til jer',
    body: 'Her samler vi alt hvad der venter på jeres svar — godkend, afvis eller spørg Ava om råd. Det tager sjældent mere end fem minutter at rydde listen.',
    cta: 'Vis mig oversigten',
  },
  ava: {
    eyebrow: 'Jeres personlige assistent',
    title: 'Stil hende et spørgsmål',
    body: 'Ava kender jeres dato, budget og stil. Prøv: "Hvad bør vi booke inden næste måned?" eller "Hvad koster musik til 120 gæster?" — hun svarer med jer i tankerne.',
    cta: 'Prøv Ava nu',
  },
  team: {
    eyebrow: 'Leverandører',
    title: 'Ét sted til hele holdet',
    body: 'Udforsk venues og leverandører, gem dem på shortlisten, følg Ava\'s henvendelser i indbakken og hold styr på hvem I har booket.',
    cta: 'Kom i gang',
  },
  budget: {
    eyebrow: 'Pengene er jeres råderum',
    title: 'Ava har fordelt — juster hvad I vil',
    body: 'Træk skyderne for at ændre fordelingen. Ava advarer, hvis I er ved at ramme loftet, og hjælper med at finde besparelser, hvis I ønsker det.',
    cta: 'Se fordelingen',
  },
  guests: {
    eyebrow: 'Gæstelisten',
    title: 'Tilføj folk — Ava klarer resten',
    body: 'Importer fra CSV eller tilføj manuelt. Ava sender invitationer, tracker RSVP og minder automatisk om svar — I ser status live.',
    cta: 'Tilføj første gæst',
  },
  website: {
    eyebrow: 'Jeres bryllupsside',
    title: 'Live på under 2 minutter',
    body: 'Vælg et tema og justér farverne — Ava har allerede hentet navne, dato og billeder fra jeres moodboard. Publicér med ét klik.',
    cta: 'Se temaerne',
  },
  invites: {
    eyebrow: 'Invitationer',
    title: 'Lad Ava skrive — I godkender',
    body: 'Vælg design, og lad Ava generere ordlyden baseret på dato, sted og tone. Juster frit — send digitalt eller bestil fysisk tryk.',
    cta: 'Vælg et design',
  },
  planning: {
    eyebrow: 'Tidslinje',
    title: 'Alt i den rigtige rækkefølge',
    body: 'Ava sekvenserer opgaverne baglæns fra jeres dato. Grønne punkter er klaret — Ava klarer dem automatisk, I beslutter de vigtige.',
    cta: 'Se hvad der venter',
  },
  seating: {
    eyebrow: 'Bordplan',
    title: 'Træk og slip dine gæster på plads',
    body: 'Tilføj borde, vælg form og flyt gæsterne rundt. Ava kan foreslå en placering baseret på relationer og kostbehov — I godkender.',
    cta: 'Byg jeres bordplan',
  },
};

const storageKey = (id: HintId) => `kalas_ob2_${id}`;

export const HINT_IDS: HintId[] = [
  'home', 'ava', 'team',
  'budget', 'guests', 'website', 'invites', 'planning', 'seating',
];

/** Suppress every per-page hint — used when the guided tour covers them. */
export function markAllHintsSeen() {
  try { HINT_IDS.forEach((id) => localStorage.setItem(storageKey(id), '1')); } catch { /* ignore */ }
}

function Rings() {
  return (
    <svg
      className="pointer-events-none absolute -right-4 -top-4 opacity-[0.07]"
      width="110" height="90" viewBox="0 0 110 90" fill="none">
      <circle cx="38" cy="45" r="32" stroke="white" strokeWidth="12" />
      <circle cx="72" cy="45" r="32" stroke="white" strokeWidth="12" />
    </svg>
  );
}

export default function OnboardingHint({ id }: { id: HintId }) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const hint = HINTS[id];

  useEffect(() => {
    if (!localStorage.getItem(storageKey(id))) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, [id]);

  const dismiss = () => {
    localStorage.setItem(storageKey(id), '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          role="dialog" aria-label={t(hint.title)}
          className="fixed bottom-24 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[360px] lg:left-[272px] lg:right-auto"
        >
          <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-5 text-canvas shadow-[0_24px_60px_-12px_rgba(59,67,42,0.45)]">
            <Rings />
            <button onClick={dismiss} aria-label={t('Luk guide')}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-canvas/60 hover:text-canvas hover:bg-canvas/10 transition-colors cursor-pointer">
              <X size={14} />
            </button>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-canvas/60">{t(hint.eyebrow)}</p>
            <p className="mt-1.5 font-serif text-[1.2rem] leading-snug">{t(hint.title)}</p>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-canvas/80">{t(hint.body)}</p>
            <button onClick={dismiss}
              className="mt-4 rounded-full bg-canvas px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink hover:opacity-90 transition-opacity cursor-pointer">
              {t(hint.cta)}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
