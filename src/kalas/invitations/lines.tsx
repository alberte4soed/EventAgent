import * as React from 'react';

/* Line composition for the templates.

   The designs were drawn against English sample text ("the 22nd of May 2027").
   Danish long-form dates are longer — "Lørdag · den 12. september 2026" — and
   at the tracking these templates use (.22em–.3em, uppercase) they wrap inside
   a 280px card. Left alone that produces the two things that make display type
   look cheap: a year stranded on its own line, and a separator dangling at the
   end of a line.

   Fixed here rather than in templates.css, whose values are byte-identical to
   the source design file and must stay that way. */

const NBSP = ' ';

/**
 * Glues the final word to the one before it, so a date never ends with a
 * stranded year: "12. september 2026" breaks as "12." / "september 2026".
 */
export function bindTail(text: string): string {
  const i = text.trimEnd().lastIndexOf(' ');
  if (i < 0) return text;
  return text.slice(0, i) + NBSP + text.slice(i + 1);
}

/**
 * Venue and its detail on their own lines instead of joined by "·".
 *
 * Joining them reads well until it wraps, and then the separator ends up
 * hanging at the end of a line. Fine stationery stacks them anyway, so this is
 * both the safer and the more correct typography.
 */
export function VenueLines({ venue, detail }: { venue: string; detail?: string }) {
  if (!venue && !detail) return null;
  if (!detail) return <>{bindTail(venue)}</>;
  if (!venue) return <>{bindTail(detail)}</>;
  return (
    <>
      {bindTail(venue)}
      <br />
      {bindTail(detail)}
    </>
  );
}

/**
 * Shrinks a display size so the longest name still fits the card.
 *
 * Most templates can use one flat size, because stacking the names keeps the
 * widest line short. The ones that set the names in large uppercase on their
 * own lines cannot: a size that gives "Anna" presence pushes "Christoffer"
 * off the edge. `fitsChars` is the longest name the base size holds.
 *
 * Deliberately derived from the string, not from measuring the DOM, so it
 * renders identically on the server and never reflows.
 */
export function fitNameSize(basePx: number, a: string, b: string, fitsChars: number): number {
  const longest = Math.max(a.trim().length, b.trim().length);
  if (longest <= fitsChars || longest === 0) return basePx;
  return Math.max(1, Math.round((basePx * fitsChars) / longest));
}

/**
 * Venue as a single string, for the few places it is composed into a larger
 * "·"-joined line rather than stacked. Separator bound to the venue so it
 * cannot dangle.
 */
export function venueText(venue: string, detail?: string): string {
  return [venue, detail].filter(Boolean).join(`${NBSP}· `);
}

/**
 * Fragments on their own lines.
 *
 * Joining a long date to a venue with "·" or "—" reads well only until the
 * column is too narrow, and then the separator is pushed to the end of a line
 * where it hangs. Binding it to either neighbour just moves the problem, so in
 * a 280px centred column the honest fix is to stop relying on soft wrapping
 * and give each fragment its own line.
 */
export function Stack({ parts }: { parts: (string | undefined)[] }) {
  const kept = parts.filter(Boolean) as string[];
  return (
    <>
      {kept.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {bindTail(part)}
        </React.Fragment>
      ))}
    </>
  );
}

/**
 * Joins fragments with "·" for the few places short enough never to wrap.
 * Separator bound to the fragment before it.
 */
export function joinTight(parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(`${NBSP}· `);
}

/** Plain join for fragments that are already short enough not to wrap. */
export function join(parts: (string | undefined)[], sep: string): string {
  return parts.filter(Boolean).join(sep);
}
