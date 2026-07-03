// Invitation ordering constants + pricing, shared by the planner UI and
// the Stripe checkout route (price is always recomputed server-side).

export const INVITE_STYLES = [
  { key: "botanical", label: "Botanical", emoji: "🌿" },
  { key: "classic", label: "Classic serif", emoji: "🖋️" },
  { key: "modern", label: "Modern minimal", emoji: "◽" },
  { key: "romantic", label: "Romantic script", emoji: "💐" },
  { key: "playful", label: "Playful", emoji: "🎉" },
] as const;

export const INVITE_PALETTES = [
  { key: "cream_sage", label: "Cream & sage" },
  { key: "ivory_gold", label: "Ivory & gold" },
  { key: "white_ink", label: "Crisp white" },
  { key: "blush", label: "Blush" },
  { key: "forest", label: "Deep forest" },
] as const;

export const INVITE_QUANTITIES = [25, 50, 75, 100, 150, 200] as const;

/** Volume-tiered price per printed card, in cents (USD). */
export function pricePerCardCents(quantity: number): number {
  if (quantity >= 150) return 200;
  if (quantity >= 100) return 220;
  return 250;
}

export function orderAmountCents(quantity: number): number {
  return quantity * pricePerCardCents(quantity);
}

/** Nearest offered quantity at or above the guest count (couples ≈ 60% of guests need one). */
export function suggestedQuantity(guestCount: number | null): number {
  if (!guestCount) return 50;
  const needed = Math.ceil((guestCount * 0.6) / 25) * 25;
  return (
    INVITE_QUANTITIES.find((q) => q >= needed) ??
    INVITE_QUANTITIES[INVITE_QUANTITIES.length - 1]
  );
}
