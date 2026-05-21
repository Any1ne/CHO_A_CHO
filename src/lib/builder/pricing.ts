// src/lib/builder/pricing.ts
//
// Tier-based pricing helpers for the B2B builder. Each shape carries an
// array of `PriceTier` entries (see types/builder.ts). At quantity Q the
// applicable tier is the highest-`minQuantity` entry whose threshold is
// ≤ Q. Below the lowest threshold we fall back to the lowest tier's
// price — the builder doesn't enforce a minimum order quantity client-
// side; that's a /branded copy decision.

import type { PriceTier } from "@/types/builder";

/**
 * Look up the per-piece UAH price for the given order quantity. Pass a
 * tier list that has at least one entry; returns 0 for empty lists so
 * callers can still display a placeholder.
 */
export function getPricePerPiece(
  tiers: PriceTier[] | undefined,
  quantity: number
): number {
  if (!tiers || tiers.length === 0) return 0;
  // Sort ascending by minQuantity so the loop below picks the largest
  // applicable tier.
  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  let chosen = sorted[0];
  for (const tier of sorted) {
    if (quantity >= tier.minQuantity) chosen = tier;
  }
  return chosen.pricePerPiece;
}

/** Order subtotal in UAH (per-piece price × quantity). */
export function getTotalPrice(
  tiers: PriceTier[] | undefined,
  quantity: number
): number {
  return getPricePerPiece(tiers, quantity) * quantity;
}

/**
 * Find the tier that's currently active for the given quantity. Used by
 * the /branded selector cards to highlight which tier the buyer would
 * land in if they ordered, and by analytics-style readouts in the email.
 * Returns null when the tier list is empty.
 */
export function getActiveTier(
  tiers: PriceTier[] | undefined,
  quantity: number
): PriceTier | null {
  if (!tiers || tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  let chosen = sorted[0];
  for (const tier of sorted) {
    if (quantity >= tier.minQuantity) chosen = tier;
  }
  return chosen;
}
