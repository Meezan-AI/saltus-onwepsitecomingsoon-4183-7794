import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { withUser } from "../../middleware/auth";
import { base } from "../../__core/app";
import { db } from "../../database";
import * as schema from "../../database/schema";
import { publicUrl } from "../../lib/s3";
import { activeDiscountPercent, applyDiscount } from "../../lib/pricing";
import { priceLine, summarizeLines } from "../../lib/event-plan-pricing";
import { sendEmail } from "../../services/email";
import { deskRouting } from "../../services/email-routing";
import { normalizePhone } from "../../services/phone";
import {
  EVENT_TYPES,
  buildPlanEmail,
  parseSpecs,
  planReference,
  type PlanLine,
} from "../../services/event-plan";

const lineInput = z.object({
  itemId: z.number().int(),
  qty: z.number().int().min(1).max(1_000_000),
  variantId: z.number().int().optional(),
  /** Picks by position inside the item's own spec list — the server resolves the names. */
  specs: z.array(z.object({ group: z.number().int().min(0), value: z.number().int().min(0) })).max(20).default([]),
  note: z.string().trim().max(300).optional(),
});

const submitInput = z.object({
  eventType: z.enum(EVENT_TYPES),
  eventName: z.string().trim().max(160).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventDays: z.number().int().min(1).max(60),
  setupDays: z.number().int().min(0).max(60),
  city: z.string().trim().min(1).max(80),
  venue: z.string().trim().max(200).optional(),
  attendees: z.number().int().min(1).max(1_000_000),
  contactName: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional(),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  contactEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(3000).optional(),
  lang: z.enum(["en", "ar"]).default("en"),
  lines: z.array(lineInput).min(1).max(80),
  /** Honeypot: real visitors never see or fill this. */
  website: z.string().max(200).optional(),
});

/**
 * Conference & event planner (public). `catalog` feeds the wizard; `submit`
 * re-prices every line from the catalog on the server and saves a snapshot the
 * Saltus team can quote from. No payment and no booking — it only collects needs.
 */
export const eventPlan = {
  catalog: base.handler(async () => {
    const items = await db
      .select()
      .from(schema.eventPlanItems)
      .where(eq(schema.eventPlanItems.isActive, true))
      .orderBy(asc(schema.eventPlanItems.sortOrder), asc(schema.eventPlanItems.id));

    const productIds = [...new Set(items.flatMap((i) => (i.productId ? [i.productId] : [])))];
    const [products, variants, images] = productIds.length
      ? await Promise.all([
          db.select().from(schema.products).where(and(inArray(schema.products.id, productIds), eq(schema.products.isActive, true))),
          db
            .select()
            .from(schema.productVariants)
            .where(and(inArray(schema.productVariants.productId, productIds), eq(schema.productVariants.isActive, true)))
            .orderBy(asc(schema.productVariants.priceCents)),
          db.select().from(schema.productImages).where(inArray(schema.productImages.productId, productIds)).orderBy(asc(schema.productImages.sortOrder)),
        ])
      : [[], [], []];

    return items.map((item) => {
      const product = item.productId ? products.find((p) => p.id === item.productId) : undefined;
      const discount = product ? activeDiscountPercent(product) : 0;
      const cover = product ? images.find((img) => img.productId === product.id) : undefined;
      return {
        id: item.id,
        groupKey: item.groupKey,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        descEn: item.descEn,
        descAr: item.descAr,
        qtyMode: item.qtyMode,
        unitEn: item.unitEn,
        unitAr: item.unitAr,
        specs: parseSpecs(item.specsJson),
        imageUrl: cover ? publicUrl(cover.s3Key) : null,
        productSlug: product?.slug ?? null,
        variants: product
          ? variants
              .filter((v) => v.productId === product.id)
              .map((v) => ({
                id: v.id,
                name: v.name,
                rentalUnit: v.rentalUnit,
                currency: v.currency,
                priceCents: v.priceCents,
                salePriceCents: applyDiscount(v.priceCents, discount),
              }))
          : [],
      };
    });
  }),

  submit: withUser.input(submitInput).handler(async ({ context, input }) => {
    // Honeypot hit: pretend it worked so bots learn nothing, store nothing.
    if (input.website) return { id: 0, reference: "EVT-00000", estimatedTotalCents: null, unpricedCount: 0 };

    const contactEmail = input.contactEmail ? input.contactEmail.toLowerCase() : null;
    let contactPhone: string | null = null;
    if (input.contactPhone) {
      contactPhone = normalizePhone(input.contactPhone);
      if (!contactPhone) throw new ORPCError("BAD_REQUEST", { message: "Invalid phone / WhatsApp number" });
    }
    if (!contactEmail && !contactPhone) {
      throw new ORPCError("BAD_REQUEST", { message: "Provide a phone / WhatsApp number or an email" });
    }
    if (new Set(input.lines.map((l) => l.itemId)).size !== input.lines.length) {
      throw new ORPCError("BAD_REQUEST", { message: "Each item can only be added once" });
    }

    const itemIds = input.lines.map((l) => l.itemId);
    const items = await db
      .select()
      .from(schema.eventPlanItems)
      .where(and(inArray(schema.eventPlanItems.id, itemIds), eq(schema.eventPlanItems.isActive, true)));
    if (items.length !== itemIds.length) throw new ORPCError("BAD_REQUEST", { message: "An item is no longer available" });

    const productIds = [...new Set(items.flatMap((i) => (i.productId ? [i.productId] : [])))];
    const [products, variants] = productIds.length
      ? await Promise.all([
          db.select().from(schema.products).where(inArray(schema.products.id, productIds)),
          db
            .select()
            .from(schema.productVariants)
            .where(and(inArray(schema.productVariants.productId, productIds), eq(schema.productVariants.isActive, true))),
        ])
      : [[], []];

    const lines: PlanLine[] = input.lines.map((l) => {
      const item = items.find((i) => i.id === l.itemId)!;
      const product = item.productId ? products.find((p) => p.id === item.productId && p.isActive) : undefined;
      const itemVariants = product ? variants.filter((v) => v.productId === product.id) : [];

      let variant = itemVariants.find((v) => v.id === l.variantId);
      if (l.variantId && !variant) throw new ORPCError("BAD_REQUEST", { message: "Unknown option for an item" });
      if (!variant && itemVariants.length === 1) variant = itemVariants[0];
      if (!variant && itemVariants.length > 1) {
        throw new ORPCError("BAD_REQUEST", { message: `Choose an option for "${item.nameEn}"` });
      }

      const specGroups = parseSpecs(item.specsJson);
      const specs = l.specs.map((pick) => {
        const group = specGroups[pick.group];
        const value = group?.values[pick.value];
        if (!group || !value) throw new ORPCError("BAD_REQUEST", { message: "Unknown specification for an item" });
        return { nameEn: group.nameEn, nameAr: group.nameAr, valueEn: value.en, valueAr: value.ar };
      });

      const qty = item.qtyMode === "none" ? 1 : l.qty;
      const discount = product ? activeDiscountPercent(product) : 0;
      const priced = priceLine(
        variant ? { rentalUnit: variant.rentalUnit, salePriceCents: applyDiscount(variant.priceCents, discount) } : null,
        qty,
        input.eventDays,
      );
      return {
        itemId: item.id,
        groupKey: item.groupKey as PlanLine["groupKey"],
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        variantId: variant?.id ?? null,
        variantName: variant?.name ?? null,
        rentalUnit: variant?.rentalUnit ?? null,
        qty,
        unitEn: item.unitEn,
        unitAr: item.unitAr,
        specs,
        note: l.note || null,
        unitCents: priced.unitCents,
        multiplier: priced.multiplier,
        totalCents: priced.totalCents,
      };
    });

    const { estimatedTotalCents, unpricedCount } = summarizeLines(lines);
    const record = {
      userId: context.user?.id ?? null,
      eventType: input.eventType,
      eventName: input.eventName || null,
      eventDate: input.eventDate,
      eventDays: input.eventDays,
      setupDays: input.setupDays,
      city: input.city,
      venue: input.venue || null,
      attendees: input.attendees,
      contactName: input.contactName,
      company: input.company || null,
      contactPhone,
      contactEmail,
      notes: input.notes || null,
      lang: input.lang,
      itemsJson: JSON.stringify(lines),
      estimatedTotalCents,
      unpricedCount,
    };
    const [created] = await db.insert(schema.eventPlanRequests).values(record).returning();
    const reference = planReference(created.id);

    // Same quotes inbox as the RFQ form. Best-effort: the request is already saved and
    // visible in Admin → Event plans, so a failed email never fails the submit.
    const routing = deskRouting("contact");
    const email = buildPlanEmail({ reference, request: record, lines });
    void sendEmail({
      to: routing.to,
      from: routing.from,
      replyTo: contactEmail ?? undefined,
      subject: `New event planner request ${reference} — ${input.contactName}`,
      ...email,
    }).catch((err) => console.warn("[event-plan] notification failed", err));

    return { id: created.id, reference, estimatedTotalCents, unpricedCount };
  }),
};
