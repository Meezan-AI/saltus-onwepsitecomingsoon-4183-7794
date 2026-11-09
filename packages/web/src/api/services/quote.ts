import { z } from "zod";

export const QUOTE_NUMBER_START = 101;
export const QUOTE_VALID_DAYS = 30;
/** Customer-facing links and emails always point at the live site. */
export const QUOTE_SITE_URL = "https://saltus-one.com";

export const quoteLineSchema = z.object({
  description: z.string().trim().min(1).max(200),
  details: z.string().trim().max(400).optional().default(""),
  qty: z.number().int().min(1).max(1_000_000),
  /** Unit price in fils (1000 per dinar). */
  unitCents: z.number().int().min(0).max(1_000_000_000),
  /** Whether the line is sold or rented. Older rows have no value and read as a sale. */
  kind: z.enum(["sale", "rent"]).optional().default("sale"),
  /** Free text for rentals, e.g. "3 days". */
  period: z.string().trim().max(60).optional().default(""),
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

/** Numbers start at 101: row id 1 → QT-00101. */
export function quoteNumber(id: number) {
  return id + QUOTE_NUMBER_START - 1;
}

export function quoteReference(id: number) {
  return `QT-${String(quoteNumber(id)).padStart(5, "0")}`;
}

export function newShareToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function quoteShareUrl(token: string) {
  return `${QUOTE_SITE_URL}/q/${token}`;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Subtotal → minus discount → plus VAT. All integers in fils; VAT rounds to the nearest fils. */
export function computeQuoteTotals(lines: Pick<QuoteLine, "qty" | "unitCents">[], discountCents: number, vatPercent: number) {
  const subtotalCents = lines.reduce((sum, l) => sum + l.qty * l.unitCents, 0);
  const discount = Math.min(Math.max(discountCents, 0), subtotalCents);
  const taxable = subtotalCents - discount;
  const vatCents = Math.round((taxable * vatPercent) / 100);
  return { subtotalCents, discountCents: discount, vatCents, totalCents: taxable + vatCents };
}

type L = "ar" | "en";

/** The ready-to-send WhatsApp / email wording. The admin can edit it before sending. */
export function quoteMessage(lang: L, d: { name: string; reference: string; total: string; url: string; preparedByName?: string | null; preparedByPhone?: string | null }) {
  const contact = [d.preparedByName, d.preparedByPhone].filter(Boolean).join(" · ");
  if (lang === "ar") {
    return [
      `مرحباً ${d.name}،`,
      `نرفق لكم عرض السعر رقم ${d.reference} من سالتوس ون بقيمة ${d.total} دينار أردني.`,
      `يمكنكم عرضه وتحميله من الرابط:`,
      d.url,
      contact ? `للاستفسار: ${contact}` : "",
      "سالتوس ون",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Hello ${d.name},`,
    `Please find our quotation ${d.reference} from Saltus ONE, total ${d.total} JOD.`,
    `You can view and download it here:`,
    d.url,
    contact ? `Questions? ${contact}` : "",
    "Saltus ONE",
  ]
    .filter(Boolean)
    .join("\n");
}
