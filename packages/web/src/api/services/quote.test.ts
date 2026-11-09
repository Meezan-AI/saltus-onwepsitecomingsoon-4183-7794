import { describe, expect, it } from "vitest";
import { computeQuoteTotals, parseQuoteLines, quoteReference } from "./quote";

describe("quote totals", () => {
  it("sums lines, applies discount then VAT, in fils", () => {
    const t = computeQuoteTotals([{ qty: 2, unitCents: 12500 }, { qty: 1, unitCents: 5000 }], 5000, 16);
    expect(t).toEqual({ subtotalCents: 30000, discountCents: 5000, vatCents: 4000, totalCents: 29000 });
  });
  it("never discounts below zero", () => {
    expect(computeQuoteTotals([{ qty: 1, unitCents: 1000 }], 9999, 0).totalCents).toBe(0);
  });
  it("formats the reference and survives corrupt lines", () => {
    expect(quoteReference(7)).toBe("QT-00007");
    expect(parseQuoteLines("not json")).toEqual([]);
  });
});
