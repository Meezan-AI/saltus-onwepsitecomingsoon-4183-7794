import { z } from "zod";

export const quoteLineSchema = z.object({
  description: z.string().trim().min(1).max(200),
  details: z.string().trim().max(400).optional().default(""),
  qty: z.number().int().min(1).max(1_000_000),
  /** Unit price in fils (1000 per dinar). */
  unitCents: z.number().int().min(0).max(1_000_000_000),
});
export type QuoteLine = z.infer<typeof quoteLineSchema>;

/** Never throws — a corrupt row shows as an empty quote instead of breaking the list. */
export function parseQuoteLines(json: string | null | undefined): QuoteLine[] {
  if (!json) return [];
  try {
    const parsed = z.array(quoteLineSchema).safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function quoteReference(id: number) {
  return `QT-${String(id).padStart(5, "0")}`;
}

/** Subtotal → minus discount → plus VAT. All integers in fils; VAT rounds to the nearest fils. */
export function computeQuoteTotals(lines: Pick<QuoteLine, "qty" | "unitCents">[], discountCents: number, vatPercent: number) {
  const subtotalCents = lines.reduce((sum, l) => sum + l.qty * l.unitCents, 0);
  const discount = Math.min(Math.max(discountCents, 0), subtotalCents);
  const taxable = subtotalCents - discount;
  const vatCents = Math.round((taxable * vatPercent) / 100);
  return { subtotalCents, discountCents: discount, vatCents, totalCents: taxable + vatCents };
}
