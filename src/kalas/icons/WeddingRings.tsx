import { forwardRef } from 'react';
import type { LucideProps } from 'lucide-react';

/**
 * Two wedding bands threaded through each other, reading as an infinity sign.
 * Built to lucide's contract — 24×24 grid, `currentColor` stroke, `size` and
 * `strokeWidth` props — so it drops straight into anything typed `LucideIcon`.
 *
 * The two arcs are circles of r=6 centred on (9,12) and (15,12). They cross at
 * (12, 6.80) and (12, 17.20), and each arc skips ~24° at one of those crossings
 * so the rings interlock instead of merely overlapping — the left ring passes
 * over at the top, the right ring over at the bottom. The path numbers are
 * derived from those crossings: nudging them by eye breaks the weave.
 */
const WeddingRings = forwardRef<SVGSVGElement, LucideProps>(function WeddingRings(
  { size = 24, strokeWidth = 2, color = 'currentColor', ...rest },
  ref,
) {
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M 13.01 7.54 A 6 6 0 1 1 10.85 6.29" />
      <path d="M 10.99 16.46 A 6 6 0 1 1 13.15 17.71" />
    </svg>
  );
});

export default WeddingRings;
