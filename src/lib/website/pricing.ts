/** One-time unlock price for the AI website designer. Server reads
    WEBSITE_PRICE_DKK; the builder UI (client) reads the NEXT_PUBLIC_ variant.
    Keep both set to the same value; default 499 kr. */
export function websitePriceDkk(): number {
  const raw = Number(
    process.env.WEBSITE_PRICE_DKK ?? process.env.NEXT_PUBLIC_WEBSITE_PRICE_DKK ?? 499
  );
  return Number.isFinite(raw) && raw > 0 ? raw : 499;
}

export function websitePriceCents(): number {
  return Math.round(websitePriceDkk() * 100);
}
