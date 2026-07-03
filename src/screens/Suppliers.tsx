import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, MessageCircle, ChevronDown, X } from 'lucide-react';
import { IMAGES as IMG, dnaTraits, couple } from '../data';
import { Eyebrow, Pill, cn } from '../ui';
import type { ScreenId } from '../Shell';
import OnboardingHint from '../OnboardingHint';

/* ── Categories ─────────────────────────────────────────────────────── */
type Cat = 'alle' | 'fotografi' | 'video' | 'blomster' | 'catering' | 'bar' | 'kage' | 'musik' | 'beauty';
const CATS: { id: Cat; label: string }[] = [
  { id: 'alle',      label: 'Alle'          },
  { id: 'fotografi', label: 'Fotografi'     },
  { id: 'video',     label: 'Video'         },
  { id: 'blomster',  label: 'Blomster'      },
  { id: 'catering',  label: 'Catering'      },
  { id: 'bar',       label: 'Bar & Drinks'  },
  { id: 'kage',      label: 'Bryllupskage'  },
  { id: 'musik',     label: 'Musik'         },
  { id: 'beauty',    label: 'Beauty'        },
];

/* ── Supplier data ───────────────────────────────────────────────────── */
type Supplier = {
  id: string; name: string; cat: Exclude<Cat, 'alle'>;
  style: string; price: string; match: number;
  image: keyof typeof IMG; tags: string[]; quote: string;
};

const SUPPLIERS: Supplier[] = [
  { id: 'p1', name: 'Studio Hald',       cat: 'fotografi', style: 'Dokumentarisk · Lyst',       price: '24.000 kr',    match: 94, image: 'portrait',    tags: ['EDITORIAL', 'NATURLIGT LYS'],    quote: 'Jeg leder efter det ufiltrerede øjeblik.'            },
  { id: 'p2', name: 'Andreas Brun',      cat: 'fotografi', style: 'Kompositorisk · Klassisk',    price: '28.000 kr',    match: 91, image: 'ceremony',    tags: ['KLASSISK', 'HIGH DETAIL'],        quote: 'Store lokationer kræver fotografer der forstår rum.' },
  { id: 'p3', name: 'Marie Lyng Foto',   cat: 'fotografi', style: 'Filmisk · Varm tonalitet',    price: '18.500 kr',    match: 88, image: 'rings',       tags: ['VARM TONE', 'FILMISK'],           quote: 'Jeg elsker de blide overgange mellem øjeblikke.'     },
  { id: 'p4', name: 'Sofie Dahl',        cat: 'fotografi', style: 'Lyst · Minimalistisk',        price: '22.000 kr',    match: 85, image: 'florals',     tags: ['MINIMALISTISK', 'LYST'],          quote: 'Et bryllup bør aldrig stiliseres for meget.'         },
  { id: 'v1', name: 'Moment Film',       cat: 'video',     style: 'Cinematic · Dokumentarisk',   price: '18.000 kr',    match: 90, image: 'ceremony',    tags: ['CINEMATIC', 'DRONE'],             quote: 'Hvert bryllup fortjener sin egen film.'              },
  { id: 'v2', name: 'Thomas Voss Film',  cat: 'video',     style: 'Minimalistisk · Stille',      price: '14.500 kr',    match: 85, image: 'candles',     tags: ['MINIMALISTISK', 'STILLE'],        quote: 'Lyd og billede i perfekt balance.'                   },
  { id: 'b1', name: 'Lupin & Lavendel', cat: 'blomster',  style: 'Markblomster · Botanisk',     price: '22.000 kr',    match: 92, image: 'florals',     tags: ['BOTANISK', 'NATURLIG'],           quote: 'Naturen er det smukkeste dekorationselement.'        },
  { id: 'b2', name: 'Botanica Studio',   cat: 'blomster',  style: 'Struktureret · Elegant',      price: '28.000 kr',    match: 87, image: 'olive',       tags: ['ELEGANT', 'STRUKTURERET'],        quote: 'Blomster med arkitektur og sjæl.'                    },
  { id: 'c1', name: 'Tang & Bord',       cat: 'catering',  style: 'Nordisk · Råvaredrevet',      price: '850 kr/kuvert',match: 89, image: 'longTable',   tags: ['NORDISK', 'SÆSON'],               quote: 'Mad der smager af det sted I fejrer.'                },
  { id: 'c2', name: 'Saison Catering',   cat: 'catering',  style: 'Moderne · Plantebaseret',     price: '780 kr/kuvert',match: 84, image: 'arch',        tags: ['MODERNE', 'PLANTEBASERET'],       quote: 'Sæsonens bedste, serveret med omtanke.'              },
  { id: 'ba1',name: 'The Cocktail Lab',  cat: 'bar',       style: 'Håndlavede cocktails',        price: '180 kr/gæst',  match: 86, image: 'candles',     tags: ['COCKTAILS', 'KLASSISK'],          quote: 'Velkomstdrinks er altid første indtryk.'             },
  { id: 'ba2',name: 'Vinbar & Mere',     cat: 'bar',       style: 'Naturvin · Hyggeligt',        price: '150 kr/gæst',  match: 82, image: 'lavender',    tags: ['NATURVIN', 'HYGGE'],              quote: 'Gode vine skaber de bedste samtaler.'                },
  { id: 'k1', name: 'Sukkerbageren',     cat: 'kage',      style: 'Klassisk · Etagers',          price: '6.500 kr',     match: 88, image: 'rings',       tags: ['KLASSISK', 'ETAGERS'],            quote: 'En kage der matcher jeres dag præcist.'              },
  { id: 'k2', name: 'La Pâtisserie',     cat: 'kage',      style: 'Moderne · Minimalistisk',     price: '8.200 kr',     match: 83, image: 'invitation',  tags: ['MODERNE', 'KUNSTNERISK'],         quote: 'Kager som skulpturer, smag som minder.'              },
  { id: 'm1', name: 'Trio Vivace',       cat: 'musik',     style: 'Klassisk · Strygetrio',       price: '14.000 kr',    match: 91, image: 'ceremony',    tags: ['KLASSISK', 'STRYGERE'],           quote: 'Musikken bærer dagen fra ceremoni til dans.'         },
  { id: 'm2', name: 'DJ Marek',          cat: 'musik',     style: 'Dans · Festlig',              price: '9.500 kr',     match: 87, image: 'barn',        tags: ['DANS', 'FESTLIG'],                quote: 'Gulvet fyldes, hvis musikken er rigtig.'             },
  { id: 'be1',name: 'Nina Makeup',       cat: 'beauty',    style: 'Naturlig · Glødende',         price: '4.800 kr',     match: 90, image: 'portrait',    tags: ['NATURLIG', 'GLØDENDE'],           quote: 'I skal genkende jer selv i spejlet.'                 },
  { id: 'be2',name: 'Salon Luxe',        cat: 'beauty',    style: 'Glamourøs · Klassisk',        price: '5.500 kr',     match: 85, image: 'florals',     tags: ['GLAMOUR', 'KLASSISK'],            quote: 'Klassisk elegance fra hår til hænder.'               },
];

/* ── FAQ ────────────────────────────────────────────────────────────── */
const FAQ = [
  { q: 'Hvornår skal vi booke vores fotograf?',    a: 'Mindst 12–18 måneder inden brylluppet. De bedste er oftest fuldt booket tidligt — specielt lørdag-bryllupper forsvinder først.' },
  { q: 'Hvad koster fotografi typisk?',            a: 'Fra 15.000 til 35.000 kr. for en heldags-pakke inkl. redigering. Videofilm koster typisk 8–15.000 kr. ekstra.' },
  { q: 'Reportage eller klassisk fotografi?',      a: 'Reportage er dokumentarisk og følger dagen naturligt. Klassisk inkluderer poserede portrætter og familiefotos. De fleste par vælger en blanding.' },
  { q: 'Hvad med blomster og dekoration?',         a: 'Floristerne bookes oftest 9–12 måneder inden. Ava laver et brief baseret på jeres moodboard, så floristerne kender jeres stil fra første møde.' },
  { q: 'Kan Ava koordinere alle leverandørerne?',  a: 'Ja — Ava koordinerer tidsplaner, briefer alle parter med jeres DNA-profil og holder styr på udestående svar og leverancer.' },
];

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */
export default function Suppliers({ onNavigate }: { onNavigate?: (s: ScreenId) => void }) {
  const [query,   setQuery]   = useState('');
  const [cat,     setCat]     = useState<Cat>('alle');
  const [saved,   setSaved]   = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSaved((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return SUPPLIERS
      .filter((s) => cat === 'alle' || s.cat === cat)
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.style.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => b.match - a.match);
  }, [query, cat]);

  const catLabel = CATS.find((c) => c.id === cat)?.label ?? 'Alle';

  return (
    <div className="min-h-screen">

      {/* ── Sticky header: search + category chips ──────────────────── */}
      <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur-md rule-b">
        <div className="px-6 pt-5 sm:px-10 lg:px-16">
          {/* Search bar */}
          <div className="flex items-center gap-3 rounded-2xl rule bg-card px-4 py-3">
            <Search size={16} className="shrink-0 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søg leverandører, stil eller kategori…"
              className="flex-1 bg-transparent text-[0.92rem] text-ink placeholder:text-muted focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="shrink-0 text-muted hover:text-ink transition-colors cursor-pointer">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar py-3 -mx-1 px-1">
            {CATS.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-[0.72rem] font-medium transition-all cursor-pointer',
                  cat === c.id
                    ? 'bg-ink text-canvas'
                    : 'rule bg-card text-ink-soft hover:text-ink hover:bg-shell',
                )}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pt-8 sm:px-10 lg:px-16">

        {/* ── DNA context banner ──────────────────────────────────────── */}
        <div className="rule rounded-2xl bg-sage-tint px-6 py-5">
          <p className="text-[0.62rem] font-medium tracking-[0.28em] uppercase text-muted mb-3">
            Moodboard-DNA · {couple.a} & {couple.b}
          </p>
          <div className="flex flex-wrap gap-2">
            {dnaTraits.slice(0, 4).map((t) => (
              <span key={t.label}
                className="inline-flex items-center gap-2 rounded-full rule bg-canvas px-3.5 py-1.5">
                <span className="h-[3px] rounded-full bg-sage shrink-0"
                  style={{ width: `${Math.round(t.pct / 12)}px` }} />
                <span className="text-[0.68rem] font-medium text-ink">{t.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Results header ───────────────────────────────────────────── */}
        <div className="mt-10 flex items-baseline justify-between">
          <Eyebrow>
            {cat === 'alle' ? 'Alle leverandører' : catLabel} · {results.length} resultater
          </Eyebrow>
          {saved.size > 0 && (
            <span className="flex items-center gap-1.5 text-[0.7rem] text-muted">
              <Heart size={11} fill="currentColor" className="text-ink" />
              {saved.size} gemt
            </span>
          )}
        </div>

        {/* ── Supplier grid ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {results.length === 0 ? (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-16 text-center">
              <p className="font-serif text-[1.3rem] text-ink-soft italic">Ingen resultater for "{query}"</p>
              <button onClick={() => { setQuery(''); setCat('alle'); }}
                className="mt-4 text-[0.78rem] text-muted hover:text-ink transition-colors cursor-pointer underline underline-offset-2">
                Ryd filter
              </button>
            </motion.div>
          ) : (
            <motion.div key={`${cat}-${query}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((s, i) => (
                <SupplierCard key={s.id} s={s} i={i} saved={saved.has(s.id)} onToggleSave={toggle} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="mt-20 rule-t pt-12">
          <Eyebrow>Ofte stillede spørgsmål</Eyebrow>
          <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-ink">
            Hvad vil I <span className="italic">gerne vide?</span>
          </h2>
          <div className="mt-8 divide-y divide-[var(--color-line)]">
            {FAQ.map((item, i) => <FaqRow key={i} q={item.q} a={item.a} />)}
          </div>
        </section>

        {/* ── Tal med Ava ──────────────────────────────────────────────── */}
        <section className="py-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rule rounded-2xl bg-card p-8 text-center">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-ink">
              <span className="font-serif text-[1.3rem] leading-none text-canvas">K</span>
            </div>
            <Eyebrow className="text-center">Spørg Ava om leverandørerne</Eyebrow>
            <p className="display mt-4 text-[1.8rem] text-ink italic">
              "Hvad skal vi booke og hvornår?"
            </p>
            <p className="mt-3 max-w-xs mx-auto text-[0.85rem] text-muted leading-relaxed">
              Ava kender jeres dato, region, budget og stil og giver et personligt svar.
            </p>
            <div className="mt-6 flex justify-center">
              <Pill arrow onClick={() => onNavigate?.('ava')}>
                <MessageCircle size={14} /> Tal med Ava
              </Pill>
            </div>
          </motion.div>
        </section>

      </div>

      <OnboardingHint id="vendors" />
    </div>
  );
}

/* ── Supplier card ───────────────────────────────────────────────────── */
function SupplierCard({ s, i, saved, onToggleSave }: {
  s: Supplier; i: number; saved: boolean; onToggleSave: (id: string) => void;
}) {
  const catLabel = CATS.find((c) => c.id === s.cat)?.label ?? s.cat;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="rule rounded-2xl bg-card overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={IMG[s.image]} alt={s.name}
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a221550] to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-sage px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink">
          {s.match}% match
        </div>
        <button onClick={() => onToggleSave(s.id)} aria-label={saved ? 'Fjern fra gemt' : 'Gem'}
          className={cn(
            'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all cursor-pointer',
            saved ? 'bg-sage text-ink' : 'bg-canvas/20 text-canvas hover:bg-canvas/40',
          )}>
          <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted">{catLabel}</p>
        <h3 className="display mt-1 text-[1.1rem] text-ink leading-tight">{s.name}</h3>
        <p className="mt-0.5 text-[0.76rem] text-muted">{s.style}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.tags.map((t) => (
            <span key={t} className="rounded-full bg-shell px-2.5 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.1em] text-ink-soft">
              {t}
            </span>
          ))}
        </div>

        <p className="mt-3 font-serif text-[0.82rem] italic text-ink-soft leading-snug flex-1">
          "{s.quote}"
        </p>

        <div className="mt-4 flex items-center justify-between rule-t pt-4">
          <span className="font-serif text-[1rem] text-ink">{s.price}</span>
          <button className="rounded-full bg-ink px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
            Kontakt →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── FAQ row (accordion) ─────────────────────────────────────────────── */
function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-1">
      <button onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left cursor-pointer group">
        <span className="font-serif text-[1.05rem] text-ink group-hover:text-ink-soft transition-colors">{q}</span>
        <span className="shrink-0 text-muted transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={17} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden">
            <p className="pb-5 text-[0.92rem] leading-relaxed text-ink-soft">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
