/** Storefront discount helpers. Money is integer fils (see schema.ts), so results are rounded to whole units. */

type DiscountFields = { discountPercent: number; discountEndsAt: Date | null };

/** The discount that applies right now: 0 when none is set or it has expired. */
export function activeDiscountPercent(product: DiscountFields, now = new Date()): number {
  const pct = Math.trunc(product.discountPercent || 0);
  if (pct <= 0 || pct > 100) return 0;
  if (product.discountEndsAt && product.discountEndsAt.getTime() <= now.getTime()) return 0;
  return pct;
}

export function applyDiscount(priceCents: number, percent: number): number {
  if (percent <= 0) return priceCents;
  return Math.round((priceCents * (100 - percent)) / 100);
}
