import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";
import { sendEmail } from "../../../services/email";
import { renderBrandedEmail } from "../../../services/email-template";
import { normalizePhone } from "../../../services/phone";
import { newShareToken } from "../../../services/quote";
import { GROUP_KEYS, PLAN_STATUSES, parseLines, parseSpecs, planMessage, planReference, planShareUrl, specGroupSchema } from "../../../services/event-plan";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const itemInput = z.object({
  groupKey: z.enum(GROUP_KEYS),
  nameEn: z.string().trim().min(1).max(120),
  nameAr: z.string().trim().min(1).max(120),
  descEn: optionalText(300),
  descAr: optionalText(300),
  productId: z.number().int().nullable().optional(),
  qtyMode: z.enum(["attendees", "one", "none"]),
  unitEn: optionalText(40),
  unitAr: optionalText(40),
  specs: z.array(specGroupSchema).max(12),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean(),
});

function toRow(input: z.infer<typeof itemInput>) {
  const { specs, ...rest } = input;
  return {
    ...rest,
    descEn: rest.descEn || null,
    descAr: rest.descAr || null,
    unitEn: rest.unitEn || null,
    unitAr: rest.unitAr || null,
    productId: rest.productId ?? null,
    specsJson: JSON.stringify(specs),
  };
}

/** Admin → Planner items: the editable checklist behind «جهّز مؤتمرك». Same permission as the product catalog. */
export const eventPlanItems = {
  list: requirePermission("manage_products").handler(async () => {
    const [rows, products] = await Promise.all([
      db.select().from(schema.eventPlanItems).orderBy(asc(schema.eventPlanItems.sortOrder), asc(schema.eventPlanItems.id)),
      db.select({ id: schema.products.id, nameEn: schema.products.nameEn, isActive: schema.products.isActive }).from(schema.products),
    ]);
    return rows.map((r) => ({
      ...r,
      specs: parseSpecs(r.specsJson),
      productName: products.find((p) => p.id === r.productId)?.nameEn ?? null,
    }));
  }),

  create: requirePermission("manage_products")
    .input(itemInput)
    .handler(async ({ input }) => {
      const rows = await db.select({ sortOrder: schema.eventPlanItems.sortOrder }).from(schema.eventPlanItems);
      const next = rows.reduce((m, r) => Math.max(m, r.sortOrder), 0) + 10;
      const [item] = await db
        .insert(schema.eventPlanItems)
        .values({ ...toRow(input), sortOrder: input.sortOrder ?? next })
        .returning();
      return item;
    }),

  update: requirePermission("manage_products")
    .input(itemInput.extend({ id: z.number().int() }))
    .handler(async ({ input }) => {
      const { id, ...rest } = input;
      const [item] = await db.update(schema.eventPlanItems).set(toRow(rest)).where(eq(schema.eventPlanItems.id, id)).returning();
      if (!item) throw new ORPCError("NOT_FOUND");
      return item;
    }),

  remove: requirePermission("manage_products")
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input }) => {
      await db.delete(schema.eventPlanItems).where(eq(schema.eventPlanItems.id, input.id));
      return { ok: true };
    }),
};

async function loadPlan(id: number) {
  const [row] = await db.select().from(schema.eventPlanRequests).where(eq(schema.eventPlanRequests.id, id));
  if (!row) throw new ORPCError("NOT_FOUND");
  return row;
}

/** Admin → Event plans: submitted planner requests. Same permission as RFQs. */
export const eventPlans = {
  list: requirePermission("manage_rfqs")
    .input(z.object({ status: z.enum(PLAN_STATUSES).optional() }))
    .handler(async ({ input }) => {
      const rows = await db
        .select()
        .from(schema.eventPlanRequests)
        .where(input.status ? eq(schema.eventPlanRequests.status, input.status) : undefined)
        .orderBy(desc(schema.eventPlanRequests.id));
      return rows.map(({ itemsJson, ...r }) => ({
        ...r,
        reference: planReference(r.id),
        itemCount: parseLines(itemsJson).length,
      }));
    }),

  get: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input }) => {
      const row = await loadPlan(input.id);
      // Old requests predate share links — mint one on first open so Send always has something to link to.
      let token = row.shareToken;
      if (!token) {
        token = newShareToken();
        await db.update(schema.eventPlanRequests).set({ shareToken: token }).where(eq(schema.eventPlanRequests.id, row.id));
      }
      const { itemsJson, ...rest } = row;
      const reference = planReference(row.id);
      const shareUrl = planShareUrl(token);
      const seed = { name: row.contactName, reference, eventName: row.eventName, totalCents: row.estimatedTotalCents, unpricedCount: row.unpricedCount, url: shareUrl };
      return {
        ...rest,
        shareToken: token,
        shareUrl,
        phoneE164: row.contactPhone ? normalizePhone(row.contactPhone) : null,
        messages: { ar: planMessage("ar", seed), en: planMessage("en", seed) },
        reference,
        lines: parseLines(itemsJson),
      };
    }),

  /** Records that the admin opened WhatsApp with the quote link (WhatsApp itself can't confirm delivery). */
  markSent: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int(), via: z.enum(["whatsapp", "email"]), to: z.string().trim().max(160).optional() }))
    .handler(async ({ input }) => {
      await loadPlan(input.id);
      await db
        .update(schema.eventPlanRequests)
        .set({ lastSentAt: new Date(), lastSentVia: input.via, lastSentTo: input.to || null })
        .where(eq(schema.eventPlanRequests.id, input.id));
      return { ok: true };
    }),

  /** Emails the customer a branded message with a link to the quotation page. */
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
      const row = await loadPlan(input.id);
      const token = row.shareToken ?? newShareToken();
      if (!row.shareToken) await db.update(schema.eventPlanRequests).set({ shareToken: token }).where(eq(schema.eventPlanRequests.id, row.id));
      const reference = planReference(row.id);
      const ar = input.lang === "ar";
      const total = row.estimatedTotalCents != null ? `${(row.estimatedTotalCents / 1000).toFixed(3)} JOD` : null;
      const { html, text } = renderBrandedEmail({
        lang: input.lang,
        preheader: ar ? `عرض السعر ${reference} من سالتوس ون` : `Your quotation ${reference} from Saltus ONE`,
        heading: ar ? "عرض السعر الخاص بفعاليتكم" : "Your event quotation",
        paragraphs: [
          ar ? `مرحباً ${row.contactName}،` : `Hello ${row.contactName},`,
          ar ? "يسعدنا أن نرسل لكم عرض السعر الخاص بطلبكم. يمكنكم عرضه وطباعته أو حفظه بصيغة PDF من الزر أدناه." : "Thank you for your request. Your quotation is ready — you can view, print or save it as a PDF using the button below.",
          ...(row.unpricedCount > 0 ? [ar ? "بعض البنود سيتم تسعيرها وإبلاغكم بها." : "A few items will be priced separately and confirmed with you."] : []),
          ...(input.note ? [input.note] : []),
        ],
        highlight: { label: ar ? "رقم الطلب" : "Reference", value: reference },
        details: {
          title: ar ? "ملخص" : "Summary",
          rows: [
            { label: ar ? "الفعالية" : "Event", value: row.eventName || row.eventType },
            { label: ar ? "التاريخ" : "Date", value: row.eventDate },
            { label: ar ? "المبلغ التقديري" : "Estimated total", value: total },
          ],
        },
        cta: { label: ar ? "عرض عرض السعر" : "View quotation", url: planShareUrl(token) },
        signature: ar ? ["مسارات سالتوس لإدارة المعارض والفعاليات", "Saltus ONE"] : ["Saltus Pathways for Exhibitions and Events Management", "Saltus ONE"],
      });
      const result = await sendEmail({
        to: input.to,
        subject: ar ? `عرض السعر ${reference} — سالتوس ون` : `Quotation ${reference} — Saltus ONE`,
        html,
        text,
      });
      if (result.sent) {
        await db.update(schema.eventPlanRequests).set({ lastSentAt: new Date(), lastSentVia: "email", lastSentTo: input.to }).where(eq(schema.eventPlanRequests.id, row.id));
      }
      return { sent: result.sent, reason: result.reason ?? null };
    }),

  setStatus: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int(), status: z.enum(PLAN_STATUSES) }))
    .handler(async ({ input }) => {
      const [row] = await db
        .update(schema.eventPlanRequests)
        .set({ status: input.status })
        .where(eq(schema.eventPlanRequests.id, input.id))
        .returning();
      if (!row) throw new ORPCError("NOT_FOUND");
      return { id: row.id, status: row.status };
    }),
};
