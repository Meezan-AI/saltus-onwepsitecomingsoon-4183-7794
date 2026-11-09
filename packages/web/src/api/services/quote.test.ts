import { describe, expect, it } from "vitest";
import { addDays, computeQuoteTotals, parseQuoteLines, quoteMessage, quoteReference } from "./quote";

describe("quote totals", () => {
  it("sums lines, applies discount then VAT, in fils", () => {
    const t = computeQuoteTotals([{ qty: 2, unitCents: 12500 }, { qty: 1, unitCents: 5000 }], 5000, 16);
    expect(t).toEqual({ subtotalCents: 30000, discountCents: 5000, vatCents: 4000, totalCents: 29000 });
  });
  it("never discounts below zero", () => {
    expect(computeQuoteTotals([{ qty: 1, unitCents: 1000 }], 9999, 0).totalCents).toBe(0);
  });
});

describe("quote numbering and parsing", () => {
  it("starts at 101", () => {
    expect(quoteReference(1)).toBe("QT-00101");
    expect(quoteReference(25)).toBe("QT-00125");
  });
  it("survives corrupt lines and defaults old lines to a sale", () => {
    expect(parseQuoteLines("not json")).toEqual([]);
    const [l] = parseQuoteLines(JSON.stringify([{ description: "A", qty: 1, unitCents: 1000 }]));
    expect(l.kind).toBe("sale");
  });
  it("adds days across month ends", () => {
    expect(addDays("2026-11-09", 30)).toBe("2026-12-09");
    expect(addDays("2026-01-31", 30)).toBe("2026-03-02");
  });
  it("builds the message in both languages", () => {
    const d = { name: "Ali", reference: "QT-00101", total: "10.000", url: "https://saltus-one.com/q/x", preparedByName: "Sara", preparedByPhone: "0791" };
    expect(quoteMessage("en", d)).toContain("QT-00101");
    expect(quoteMessage("ar", d)).toContain("https://saltus-one.com/q/x");
  });
});
