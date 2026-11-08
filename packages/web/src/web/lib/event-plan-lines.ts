import { priceLine, summarizeLines, type PlanLinePrice } from "../../api/lib/event-plan-pricing";
import type { PlannerItem } from "../queries/event-plan";

export const GROUPS = ["printed", "gifts", "venue", "services"] as const;
export type PlannerGroup = (typeof GROUPS)[number];

/** What the customer has ticked for one item. */
export interface Pick {
  qty: number;
  variantId?: number;
  /** spec group index -> value index */
  specs: Record<number, number>;
  note: string;
}

export interface PlanLineView {
  item: PlannerItem;
  pick: Pick;
  variant: PlannerItem["variants"][number] | null;
  price: PlanLinePrice;
}

export function defaultPick(item: PlannerItem, attendees: number): Pick {
  return {
    qty: item.qtyMode === "attendees" ? Math.max(1, attendees || 1) : 1,
    variantId: item.variants[0]?.id,
    specs: {},
    note: "",
  };
}

export function buildLines(items: PlannerItem[], picks: Record<number, Pick>, eventDays: number): PlanLineView[] {
  return items.flatMap((item) => {
    const pick = picks[item.id];
    if (!pick) return [];
    const variant = item.variants.find((v) => v.id === pick.variantId) ?? item.variants[0] ?? null;
    return [{ item, pick, variant, price: priceLine(variant, item.qtyMode === "none" ? 1 : pick.qty, eventDays) }];
  });
}

export function totalsOf(lines: PlanLineView[]) {
  return summarizeLines(lines.map((l) => l.price));
}
