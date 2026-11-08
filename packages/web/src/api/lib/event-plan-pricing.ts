/**
 * Pure pricing rules for the conference/event planner. Shared by the server
 * (authoritative, recomputed on submit) and the web UI (live preview), so the
 * customer never sees a number the server would not produce.
 *
 * Prices only ever come from catalog variants (already discounted into
 * `salePriceCents`). A line with no variant has no price: `totalCents` is null
 * and the UI shows "requires a quote" — a price is never invented.
 */

export interface PlanVariant {
  salePriceCents: number;
  /** day | week | event | null */
  rentalUnit: string | null;
}

/** How many times the unit price repeats: per day = event days, per week = weeks, otherwise once. */
export function rentalMultiplier(rentalUnit: string | null, eventDays: number): number {
  const days = Math.max(1, Math.trunc(eventDays) || 1);
  if (rentalUnit === "day") return days;
  if (rentalUnit === "week") return Math.ceil(days / 7);
  return 1;
}

export interface PlanLinePrice {
  unitCents: number | null;
  multiplier: number;
  totalCents: number | null;
}

export function priceLine(variant: PlanVariant | null | undefined, qty: number, eventDays: number): PlanLinePrice {
  if (!variant) return { unitCents: null, multiplier: 1, totalCents: null };
  const multiplier = rentalMultiplier(variant.rentalUnit, eventDays);
  return { unitCents: variant.salePriceCents, multiplier, totalCents: variant.salePriceCents * qty * multiplier };
}

export function summarizeLines(lines: { totalCents: number | null }[]) {
  const priced = lines.filter((l) => l.totalCents !== null);
  return {
    /** null when nothing in the plan has a catalog price. */
    estimatedTotalCents: priced.length ? priced.reduce((sum, l) => sum + (l.totalCents ?? 0), 0) : null,
    unpricedCount: lines.length - priced.length,
  };
}
