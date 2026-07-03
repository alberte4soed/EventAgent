// Compact Google-rating display: champagne stars + review count.

interface Props {
  rating: number;
  count?: number | null;
  className?: string;
}

export function RatingStars({ rating, count, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="flex items-center gap-px" aria-label={`${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} fill={Math.min(Math.max(rating - (i - 1), 0), 1)} />
        ))}
      </span>
      <span className="text-xs font-medium text-[#4A4E3C]">{rating.toFixed(1)}</span>
      {typeof count === "number" && count > 0 && (
        <span className="text-xs text-[#8a8568]">({count.toLocaleString()})</span>
      )}
    </span>
  );
}

/** One star, partially filled via a clipped overlay (handles halves). */
function Star({ fill }: { fill: number }) {
  const path =
    "M12 2l2.9 6.26 6.86.6-5.2 4.52 1.56 6.72L12 16.54 5.88 20.1l1.56-6.72-5.2-4.52 6.86-.6L12 2z";
  return (
    <span className="relative inline-block size-3">
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-3" fill="#ddd6c0">
        <path d={path} />
      </svg>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${fill * 100}%` }}
      >
        <svg viewBox="0 0 24 24" className="size-3" fill="#C2B280">
          <path d={path} />
        </svg>
      </span>
    </span>
  );
}
