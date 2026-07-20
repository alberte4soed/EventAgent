/* Shared types for the digital-invitation builder. One InvitationData shape
   drives every template component, the live editor, the AI generator, and the
   public share page. Kept framework-light so templates.meta.ts can import it
   server-side (the AI route) without pulling in React. */

export type TemplateGroup = 'sealed' | 'modern' | 'botanical' | 'color' | 'dramatic';
export type Voice = 'formal' | 'modern' | 'romantic' | 'playful';
export type DateStyle = 'longformal' | 'numeric' | 'roman';
export type Interactive = 'tap-open' | 'countdown' | null;

/** Optional fields a template surfaces in the editor, beyond the always-shown
    core (names, displayDate, venue). Drives which inputs render per template. */
export type TemplateField =
  | 'monogram'
  | 'label'
  | 'introLines'
  | 'time'
  | 'venueDetail'
  | 'closing'
  | 'rsvpLabel';

export type Language = 'da' | 'en';

/** The single content shape every template renders from. */
export interface InvitationData {
  partnerA: string;          // "Adeline"
  partnerB: string;          // "Morgan"
  monogram: string;          // "A M" — derived from initials, editable
  label: string;             // "Together with their families"
  introLines: string[];      // ["joyfully invite you", "to the celebration…"]
  displayDate: string;       // phrased per template.dateStyle
  isoDate: string;           // "2027-05-22T16:00:00" — countdown + sorting
  time?: string;             // "Four o'clock in the afternoon"
  venue: string;             // "Villa Serena"
  venueDetail?: string;      // "Provence, France"
  closing?: string;          // "Reception to follow"
  rsvpLabel?: string;        // "Bekræft deltagelse"
  rsvpUrl?: string;          // link to RSVP page
  language: Language;
}

/** Static metadata for a template — pure data, no React. */
export interface TemplateMeta {
  id: string;
  name: string;
  subtitle: string;          // small caption under the name in the gallery
  group: TemplateGroup;
  voice: Voice;
  dateStyle: DateStyle;
  interactive: Interactive;
  monogram: boolean;         // does the design show a monogram
  fields: TemplateField[];   // optional fields to surface in the editor
}

/** Props every template component accepts. `onRsvp`, when provided (public
    share page), wires the in-design RSVP buttons; the gallery/editor omit it. */
export interface TemplateProps {
  data: InvitationData;
  onRsvp?: () => void;
}

/** A registered template = metadata + its React component. */
export interface Template extends TemplateMeta {
  Component: React.FC<TemplateProps>;
}

export const GROUP_LABELS: Record<TemplateGroup, string> = {
  sealed: 'Klassisk & forseglet',
  modern: 'Moderne & minimal',
  botanical: 'Botanisk & blomster',
  color: 'Farve & sol',
  dramatic: 'Dramatisk & metallisk',
};

export const GROUP_ORDER: TemplateGroup[] = ['sealed', 'modern', 'botanical', 'color', 'dramatic'];
