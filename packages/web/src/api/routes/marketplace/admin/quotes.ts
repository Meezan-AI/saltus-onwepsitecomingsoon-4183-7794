import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";
import { sendEmail } from "../../../services/email";
import { renderBrandedEmail } from "../../../services/email-template";
import { normalizePhone } from "../../../services/phone";
import {
  QUOTE_VALID_DAYS,
  addDays,
  computeQuoteTotals,
  newShareToken,
  parseQuoteLines,
  quoteLineSchema,
  quoteMessage,
  quoteReference,
  quoteShareUrl,
} from "../../../services/quote";

const optional = (max: number) => z.string().trim().max(max).nullable().optional();

const quoteInput = z.object({
  customerName: z.string().trim().min(1).max(120),
  company: optional(120),
  phone: optional(40),
  email: z.string().trim().email().max(160).or(z.literal("")).nullable().optional(),
  subject: optional(200),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(quoteLineSchema).min(1).max(100),
  discountCents: z.number().int().min(0).max(1_000_000_000).default(0),
  vatPercent: z.number().int().min(0).max(100).default(0),
  notes: optional(2000),
  preparedByName: z.string().trim().min(1).max(120),
  preparedByPhone: z.string().trim().min(5).max(40),
});

function toRow(input: z.infer<typeof quoteInput>) {
  const { lines, ...rest } = input;
  return {
    ...rest,
    company: rest.company || null,
    phone: rest.phone || null,
    email: rest.email || null,
    subject: rest.subject || null,
    notes: rest.notes || null,
    linesJson: JSON.stringify(lines),
  };
}

export function presentQuote(row: typeof schema.quotes.$inferSelect) {
  const { linesJson, ...rest } = row;
  const lines = parseQuoteLines(linesJson);
  return {
    ...rest,
    reference: quoteReference(row.id),
    validUntil: addDays(row.issueDate, QUOTE_VALID_DAYS),
    phoneE164: row.phone ? normalizePhone(row.phone) : null,
    lines,
    ...computeQuoteTotals(lines, row.discountCents, row.vatPercent),
  };
}

async function load(id: number) {
  const [row] = await db.select().from(schema.quotes).where(eq(schema.quotes.id, id));
  if (!row) throw new ORPCError("NOT_FOUND");
  return row;
}

/** Admin → Quotes: hand-written quotations. Same permission as RFQs and event plans. */
export const quotes = {
  list: requirePermission("manage_rfqs").handler(async () => {
    const rows = await db.select().from(schema.quotes).orderBy(desc(schema.quotes.id));
    return rows.map((r) => {
      const { lines, shareToken: _t, ...rest } = presentQuote(r);
      return { ...rest, itemCount: lines.length };
    });
  }),

  get: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input }) => {
      const row = await load(input.id);
      const q = presentQuote(row);
      // Old rows predate share links — mint one on first open so Send always has something to link to.
      let token = row.shareToken;
      if (!token) {
        token = newShareToken();
        await db.update(schema.quotes).set({ shareToken: token }).where(eq(schema.quotes.id, row.id));
      }
      const shareUrl = quoteShareUrl(token);
      const seed = {
        name: q.customerName,
        reference: q.reference,
        total: (q.totalCents / 1000).toFixed(3),
        url: shareUrl,
        preparedByName: q.preparedByName,
        preparedByPhone: q.preparedByPhone,
      };
      return { ...q, shareToken: token, shareUrl, messages: { ar: quoteMessage("ar", seed), en: quoteMessage("en", seed) } };
    }),

  create: requirePermission("manage_rfqs")
    .input(quoteInput)
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(schema.quotes)
        .values({ ...toRow(input), shareToken: newShareToken(), createdBy: context.user.id })
        .returning();
      return presentQuote(row);
    }),

  update: requirePermission("manage_rfqs")
    .input(quoteInput.extend({ id: z.number().int() }))
    .handler(async ({ input }) => {
      const { id, ...rest } = input;
      const existing = await load(id);
      const [row] = await db
        .update(schema.quotes)
        .set({ ...toRow(rest), shareToken: existing.shareToken ?? newShareToken() })
        .where(eq(schema.quotes.id, id))
        .returning();
      return presentQuote(row);
    }),

  remove: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input }) => {
      await db.delete(schema.quotes).where(eq(schema.quotes.id, input.id));
      return { ok: true };
    }),

  /** Records that the admin opened WhatsApp with the quote link (WhatsApp itself can't confirm delivery). */
  markSent: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int(), via: z.enum(["whatsapp", "email"]), to: z.string().trim().max(160).optional() }))
    .handler(async ({ input }) => {
      await load(input.id);
      await db
        .update(schema.quotes)
        .set({ lastSentAt: new Date(), lastSentVia: input.via, lastSentTo: input.to || null })
        .where(eq(schema.quotes.id, input.id));
      return { ok: true };
    }),

  /** Emails the customer a branded message with a link to the quote page. */
  sendEmail: requirePermission("manage_rfqs")
    .input(
      z.object({
        id: z.number().int(),
        to: z.string().trim().email().max(160),
        lang: z.enum(["ar", "en"]).default("ar"),
        note: z.string().trim().max(1000).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const row = await load(input.id);
      const q = presentQuote(row);
      const token = row.shareToken ?? newShareToken();
      if (!row.shareToken) await db.update(schema.quotes).set({ shareToken: token }).where(eq(schema.quotes.id, row.id));
      const total = (q.totalCents / 1000).toFixed(3);
      const ar = input.lang === "ar";
      const { html, text } = renderBrandedEmail({
        lang: input.lang,
        preheader: ar ? `عرض السعر ${q.reference} من سالتوس ون` : `Your quotation ${q.reference} from Saltus ONE`,
        heading: ar ? "عرض السعر" : "Your quotation",
        paragraphs: [
          ar ? `مرحباً ${q.customerName}،` : `Hello ${q.customerName},`,
          ar ? "يسعدنا أن نرسل لكم عرض السعر الخاص بطلبكم. يمكنكم عرضه وطباعته أو حفظه بصيغة PDF من الزر أدناه." : "Thank you for your enquiry. Your quotation is ready — you can view, print or save it as a PDF using the button below.",
          ...(input.note ? [input.note] : []),
        ],
        highlight: { label: ar ? "رقم العرض" : "Quote number", value: q.reference, note: ar ? `صالح حتى ${q.validUntil}` : `Valid until ${q.validUntil}` },
        details: {
          title: ar ? "ملخص" : "Summary",
          rows: [
            { label: ar ? "المبلغ الإجمالي" : "Total", value: `${total} JOD` },
            { label: ar ? "الموضوع" : "Subject", value: q.subject },
            { label: ar ? "أعدّه" : "Prepared by", value: [q.preparedByName, q.preparedByPhone].filter(Boolean).join(" · ") },
          ],
        },
        cta: { label: ar ? "عرض عرض السعر" : "View quotation", url: quoteShareUrl(token) },
        signature: ["Saltus ONE"],
      });
      const result = await sendEmail({
        to: input.to,
        subject: ar ? `عرض السعر ${q.reference} — سالتوس ون` : `Quotation ${q.reference} — Saltus ONE`,
        html,
        text,
      });
      if (result.sent) {
        await db.update(schema.quotes).set({ lastSentAt: new Date(), lastSentVia: "email", lastSentTo: input.to }).where(eq(schema.quotes.id, row.id));
      }
      return { sent: result.sent, reason: result.reason ?? null };
    }),
};
