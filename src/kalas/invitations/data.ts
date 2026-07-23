/* Deterministic helpers for InvitationData: monogram derivation, date phrasing
   per template dateStyle, editor defaults, and per-template sample content for
   the /dev/templates parity harness. The defaults double as the AI fallback so
   a preview is never empty. Pure — safe to import server-side. */

import type { DateStyle, InvitationData, Language, TemplateMeta } from './types';

/** Two-letter monogram from the couple's initials, e.g. "A M". */
export function deriveMonogram(a: string, b: string): string {
  const ai = (a.trim()[0] ?? '').toUpperCase();
  const bi = (b.trim()[0] ?? '').toUpperCase();
  return [ai, bi].filter(Boolean).join(' ');
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

const MONTHS_DA = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
];

/** Phrase an ISO date per the template's date style + language. */
export function phraseDate(iso: string, style: DateStyle, language: Language): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  if (style === 'numeric') {
    const dd = String(day).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    return `${dd}.${mm}.${year}`;
  }

  if (language === 'da') {
    const weekday = d.toLocaleDateString('da-DK', { weekday: 'long' });
    const wd = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    if (style === 'roman') return `Den ${day}. ${MONTHS_DA[month]} ${year}`;
    return `${wd} · den ${day}. ${MONTHS_DA[month]} ${year}`; // longformal
  }

  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const monthName = d.toLocaleDateString('en-GB', { month: 'long' });
  if (style === 'roman') return `The ${ordinal(day)} of ${monthName} ${year}`;
  return `${weekday} · the ${ordinal(day)} of ${monthName} ${year}`; // longformal
}

interface DefaultCopy {
  label: string;
  introLines: string[];
  closing: string;
  rsvpLabel: string;
}

function defaultCopy(language: Language): DefaultCopy {
  return language === 'da'
    ? {
        label: 'Sammen med deres familier',
        introLines: ['inviterer jer med glæde', 'til fejringen af deres bryllup'],
        closing: 'Reception følger',
        rsvpLabel: 'Bekræft deltagelse',
      }
    : {
        label: 'Together with their families',
        introLines: ['joyfully invite you', 'to the celebration of their marriage'],
        closing: 'Reception to follow',
        rsvpLabel: 'RSVP',
      };
}

/** Seed InvitationData for the editor / AI fallback from the couple's facts. */
export function defaultDataFor(
  meta: TemplateMeta,
  input: {
    partnerA?: string;
    partnerB?: string;
    isoDate?: string | null;
    venue?: string;
    venueDetail?: string;
    language?: Language;
  }
): InvitationData {
  const language: Language = input.language ?? 'da';
  const partnerA = input.partnerA?.trim() || (language === 'da' ? 'Partner A' : 'Partner A');
  const partnerB = input.partnerB?.trim() || (language === 'da' ? 'Partner B' : 'Partner B');
  const isoDate = input.isoDate || '2027-06-12T15:00:00';
  const copy = defaultCopy(language);
  return {
    partnerA,
    partnerB,
    monogram: deriveMonogram(partnerA, partnerB),
    label: copy.label,
    introLines: copy.introLines,
    displayDate: phraseDate(isoDate, meta.dateStyle, language),
    isoDate,
    time: undefined,
    venue: input.venue?.trim() || (language === 'da' ? 'Vores venue' : 'Our venue'),
    venueDetail: input.venueDetail?.trim() || undefined,
    closing: copy.closing,
    rsvpLabel: copy.rsvpLabel,
    language,
  };
}

/** Coerce an untrusted object (AI output) into a valid InvitationData, filling
    any missing/blank field from `base`. Never throws; guarantees a renderable
    result so the preview is never empty. */
export function coerceInvitationData(raw: unknown, base: InvitationData): InvitationData {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string): string =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;
  const optStr = (v: unknown, fallback?: string): string | undefined => {
    if (typeof v === 'string' && v.trim()) return v.trim();
    return fallback;
  };
  const lines = Array.isArray(o.introLines)
    ? o.introLines.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((s) => s.trim())
    : [];
  const partnerA = str(o.partnerA, base.partnerA);
  const partnerB = str(o.partnerB, base.partnerB);
  return {
    partnerA,
    partnerB,
    monogram: str(o.monogram, deriveMonogram(partnerA, partnerB)),
    label: str(o.label, base.label),
    introLines: lines.length ? lines : base.introLines,
    displayDate: str(o.displayDate, base.displayDate),
    isoDate: str(o.isoDate, base.isoDate),
    time: optStr(o.time, base.time),
    venue: str(o.venue, base.venue),
    venueDetail: optStr(o.venueDetail, base.venueDetail),
    closing: optStr(o.closing, base.closing),
    rsvpLabel: optStr(o.rsvpLabel, base.rsvpLabel),
    rsvpUrl: base.rsvpUrl,
    language: o.language === 'en' || o.language === 'da' ? o.language : base.language,
  };
}

/* ── Per-template sample content — mirrors invitationer-final.html so the
      /dev/templates harness confirms visual parity. ─────────────────────── */
type Sample = Partial<InvitationData> & { partnerA: string; partnerB: string; isoDate: string };

const SAMPLES: Record<string, Sample> = {
  sceau:          { partnerA: 'Adeline', partnerB: 'Morgan', isoDate: '2027-05-22T16:00:00', label: 'Together with their families', introLines: ['joyfully invite you', 'to the celebration of their marriage'], displayDate: 'Saturday · the 22nd of May 2027', venue: 'Villa Serena', venueDetail: 'Provence', rsvpLabel: 'Bekræft deltagelse', language: 'en' },
  ivoire:         { partnerA: 'Beatrice', partnerB: 'Oscar', isoDate: '2027-06-12T15:00:00', label: 'Request the honour of your presence', displayDate: 'The twelfth of June · Two thousand twenty-seven', venue: "Saint Mark's Chapel", venueDetail: 'Copenhagen', language: 'en' },
  'bleu-poudre':  { partnerA: 'Vera', partnerB: 'Emil', isoDate: '2027-07-04T16:30:00', label: 'We joyfully invite you', displayDate: 'Sunday · the 4th of July 2027', time: 'Half past four', venue: 'Lyng Manor', language: 'en' },
  lettre:         { partnerA: 'Clara', partnerB: 'Elliot', isoDate: '2027-06-21T15:00:00', label: 'A love letter from', introLines: ['are getting married'], displayDate: '21 · 06 · 2027', venue: 'The Old Orangery', venueDetail: 'Tuscany', rsvpLabel: 'Bekræft deltagelse', language: 'en' },
  cachet:         { partnerA: 'Cecilie', partnerB: 'Anton', isoDate: '2027-05-29T15:00:00', label: 'Request the honour of your presence', displayDate: 'The twenty-ninth of May 2027', venue: 'Rosendal Manor', venueDetail: 'Zealand', language: 'en' },
  'noir-editorial':{ partnerA: 'Elena', partnerB: 'David', isoDate: '2026-11-22T15:00:00', label: 'Together with their families', displayDate: '22.11.2026', venue: 'Copenhagen', rsvpLabel: 'elena-david.dk', language: 'en' },
  bauhaus:        { partnerA: 'Maya', partnerB: 'Julian', isoDate: '2027-08-14T15:00:00', label: "We're getting married", displayDate: '14 · 08 · 2027', venue: 'Aarhus', language: 'en' },
  parisienne:     { partnerA: 'Camille', partnerB: 'Hugo', isoDate: '2027-09-09T15:00:00', label: 'Vous êtes invités', introLines: ['à leur mariage'], displayDate: 'Le 9 septembre 2027', venue: 'Paris', language: 'en' },
  linea:          { partnerA: 'Mia', partnerB: 'Oskar', isoDate: '2027-07-17T15:00:00', label: 'Together with their families', displayDate: '17.07.2027', venue: 'Aarhus', venueDetail: 'Denmark', language: 'en' },
  atelier:        { partnerA: 'Selma', partnerB: 'Otto', isoDate: '2027-10-16T15:00:00', label: 'We are getting married', displayDate: 'The sixteenth of October 2027', venue: 'The Foundry', venueDetail: 'Copenhagen', language: 'en' },
  jardin:         { partnerA: 'Joanna', partnerB: 'Patrick', isoDate: '2027-04-18T13:30:00', label: 'You are warmly invited', introLines: ['to the beginning of', 'our journey together'], displayDate: '18 April 2027 · half past one', venue: 'Presidio Chapel', language: 'en' },
  prairie:        { partnerA: 'Nora', partnerB: 'Elias', isoDate: '2027-06-05T15:00:00', label: 'Together with our families', displayDate: 'Saturday · the 5th of June 2027', venue: 'Enggården', venueDetail: 'Fyn', language: 'en' },
  gravure:        { partnerA: 'Natalie', partnerB: 'Scott', isoDate: '2027-04-08T15:00:00', label: 'You are joyfully invited', displayDate: 'The eighth of April · 2027', venue: 'Presidio Chapel', language: 'en' },
  toile:          { partnerA: 'Clara', partnerB: 'Felix', isoDate: '2027-05-16T15:00:00', label: 'Joyfully invite you', displayDate: 'The sixteenth of May 2027', venue: 'The Country House', venueDetail: 'Zealand', language: 'en' },
  eucalyptus:     { partnerA: 'Alma', partnerB: 'Noel', isoDate: '2027-06-19T15:00:00', label: 'Together with our families', displayDate: 'The nineteenth of June 2027', venue: 'Greenhouse Botanica', venueDetail: 'Fyn', language: 'en' },
  terracotta:     { partnerA: 'Sofia', partnerB: 'Léon', isoDate: '2027-09-20T16:00:00', label: 'Together with their families', displayDate: 'The twentieth of September 2027', venue: 'Tuscany', venueDetail: 'Italy', language: 'en' },
  aquarelle:      { partnerA: 'Isabella', partnerB: 'Theo', isoDate: '2027-05-11T15:00:00', label: 'Save the date', introLines: ["We're saying yes —", 'and would love you there'], displayDate: '11 May 2027', venue: 'Copenhagen', language: 'en' },
  amalfi:         { partnerA: 'Aria', partnerB: 'Noah', isoDate: '2027-06-30T16:00:00', label: 'Join us on the coast', displayDate: 'The thirtieth of June 2027', venue: 'Amalfi', venueDetail: 'Italy', language: 'en' },
  corail:         { partnerA: 'Lea', partnerB: 'Milo', isoDate: '2027-08-21T16:00:00', label: 'Together with their families', displayDate: 'The twenty-first of August 2027', venue: 'Cala Rossa', venueDetail: 'Sardinia', language: 'en' },
  provence:       { partnerA: 'Josephine', partnerB: 'Lucas', isoDate: '2027-06-26T16:00:00', label: 'You are warmly invited', displayDate: 'The twenty-sixth of June 2027', venue: 'Domaine des Lavandes', venueDetail: 'Provence', language: 'en' },
  minuit:         { partnerA: 'Clodie', partnerB: 'Marc', isoDate: '2026-11-22T15:00:00', label: "We're getting married", displayDate: '22 November 2026', rsvpLabel: 'Bekræft deltagelse', venue: '', language: 'en' },
  celeste:        { partnerA: 'Livia', partnerB: 'Sebastian', isoDate: '2027-12-18T16:00:00', label: 'Written in the stars', displayDate: '18 December 2027', venue: '', language: 'en' },
  deco:           { partnerA: 'Rosa', partnerB: 'Matteo', isoDate: '2027-10-03T19:00:00', label: 'The pleasure of your company', displayDate: 'The 3rd of October 2027', time: 'seven o’clock', venue: 'Grand Hôtel', language: 'en' },
  emeraude:       { partnerA: 'Iris', partnerB: 'Daniel', isoDate: '2027-09-25T18:00:00', label: 'Request the honour of your presence', displayDate: 'The twenty-fifth of September 2027', venue: 'Castle Gardens', venueDetail: 'evening', language: 'en' },
  champagne:      { partnerA: 'Freja', partnerB: 'August', isoDate: '2027-10-02T15:00:00', label: 'Together with their families', displayDate: 'The second of October 2027', venue: 'Villa Aurora', language: 'en' },
  marbre:         { partnerA: 'Ella', partnerB: 'Viktor', isoDate: '2027-08-08T15:00:00', label: 'Together forever', displayDate: 'The eighth of August 2027', venue: 'The Marble Hall', venueDetail: 'Copenhagen', language: 'en' },
};

/** Full InvitationData for the parity harness — source placeholders per id. */
export function sampleData(meta: TemplateMeta): InvitationData {
  const s = SAMPLES[meta.id];
  const base = defaultDataFor(meta, {
    partnerA: s?.partnerA,
    partnerB: s?.partnerB,
    isoDate: s?.isoDate,
    venue: s?.venue,
    venueDetail: s?.venueDetail,
    language: s?.language ?? 'en',
  });
  return { ...base, ...s, monogram: s?.monogram ?? deriveMonogram(s?.partnerA ?? base.partnerA, s?.partnerB ?? base.partnerB) };
}
