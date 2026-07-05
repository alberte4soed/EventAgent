// Pure venue/vendor ranking. Extracted so it can be unit-tested without the
// Gemini/Supabase machinery around the search pipeline.

export interface RankableExtracted {
  capacity?: string | null;
  description?: string | null;
  why_fit?: string | null;
}

export interface RankablePlace {
  rating?: number;
  userRatingCount?: number;
}

/** Bayesian-smoothed rating so a 5.0 with 3 reviews doesn't beat a 4.8 with 400. */
export function ratingScore(rating?: number, reviewCount?: number): number {
  if (!rating) return 4.1; // unrated: just below the prior, not buried
  const n = reviewCount ?? 0;
  return (rating * n + 4.2 * 10) / (n + 10);
}

export function rankScore(
  candidate: { extracted: RankableExtracted; place: RankablePlace | null },
  guestCount: number | null | undefined,
  vibes: string[]
): number {
  let score = ratingScore(candidate.place?.rating, candidate.place?.userRatingCount);

  // Capacity fit: any number in the capacity text that covers the guest count.
  if (guestCount && candidate.extracted.capacity) {
    const numbers = candidate.extracted.capacity.match(/\d+/g)?.map(Number) ?? [];
    if (numbers.some((n) => n >= guestCount)) score += 0.1;
  }

  // Vibe keywords appearing in the description / fit sentence.
  const text = `${candidate.extracted.description ?? ""} ${candidate.extracted.why_fit ?? ""}`.toLowerCase();
  const hits = vibes.filter((v) => text.includes(v.toLowerCase())).length;
  score += Math.min(hits, 3) * 0.05;

  return score;
}
