import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed } from "../../middleware/auth";
import { db } from "../../database";
import * as schema from "../../database/schema";
import { recordOrderStatusChange } from "../../services/order-status-history";

function generateOrderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SO-${stamp}-${random}`;
}

/** Joins the product/variant onto a request row so the UI can show a name without a second round-trip. */
async function rfqWithProduct(requestId: number) {
  const [row] = await db
    .select({
      request: schema.rfqRequests,
      product: schema.products,
      variant: schema.productVariants,
    })
    .from(schema.rfqRequests)
    .innerJoin(schema.products, eq(schema.rfqRequests.productId, schema.products.id))
    .leftJoin(schema.productVariants, eq(schema.rfqRequests.variantId, schema.productVariants.id))
    .where(eq(schema.rfqRequests.id, requestId));
  if (!row) return null;
  return { ...row.request, product: row.product, variant: row.variant };
}

/**
 * Quote requests (RFQ) — report section 7. Admin responds from
 * routes/marketplace/admin/rfqs.ts; this file is the customer-facing half:
 * submit a request, track it, accept or decline the quoted price.
 */
export const rfq = {
  list: authed.handler(async ({ context }) => {
    const rows = await db
      .select({
        request: schema.rfqRequests,
        product: schema.products,
        variant: schema.productVariants,
      })
      .from(schema.rfqRequests)
      .innerJoin(schema.products, eq(schema.rfqRequests.productId, schema.products.id))
      .leftJoin(schema.productVariants, eq(schema.rfqRequests.variantId, schema.productVariants.id))
      .where(eq(schema.rfqRequests.userId, context.user.id))
      .orderBy(desc(schema.rfqRequests.id));
    return rows.map((row) => ({ ...row.request, product: row.product, variant: row.variant }));
  }),

  get: authed.input(z.object({ id: z.number() })).handler(async ({ context, input }) => {
    const request = await rfqWithProduct(input.id);
    if (!request || request.userId !== context.user.id) throw new ORPCError("NOT_FOUND");
    return request;
  }),

  create: authed
    .input(
      z.object({
        productId: z.number(),
        variantId: z.number().optional(),
        qty: z.number().int().min(1).default(1),
        notes: z.string().max(2000).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [product] = await db.select().from(schema.products).where(eq(schema.products.id, input.productId));
      if (!product || !product.isActive) throw new ORPCError("NOT_FOUND", { message: "Product not found" });
      if (!product.allowRfq) throw new ORPCError("BAD_REQUEST", { message: "This product is direct-purchase only" });

      const [request] = await db
        .insert(schema.rfqRequests)
        .values({ ...input, userId: context.user.id })
        .returning();
      return request;
    }),

  /** Customer accepts a quoted price — creates the order and moves the RFQ to "accepted". */
  accept: authed.input(z.object({ id: z.number() })).handler(async ({ context, input }) => {
    const [request] = await db.select().from(schema.rfqRequests).where(eq(schema.rfqRequests.id, input.id));
    if (!request || request.userId !== context.user.id) throw new ORPCError("NOT_FOUND");
    if (request.status !== "quoted" || !request.quotedPriceCents) {
      throw new ORPCError("BAD_REQUEST", { message: "This request has no active quote" });
    }
    if (request.validUntil && request.validUntil.getTime() < Date.now()) {
      await db.update(schema.rfqRequests).set({ status: "expired" }).where(eq(schema.rfqRequests.id, request.id));
      throw new ORPCError("BAD_REQUEST", { message: "This quote has expired" });
    }

    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, request.productId));
    if (!product) throw new ORPCError("NOT_FOUND", { message: "Product not found" });

    const fulfillmentType = product.fulfillmentType === "pickup_rental" ? "pickup_rental" : "delivery";
    const unitPriceCents = Math.round(request.quotedPriceCents / request.qty);

    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber: generateOrderNumber(),
        userId: context.user.id,
        fulfillmentType,
        subtotalCents: request.quotedPriceCents,
        totalCents: request.quotedPriceCents,
        notes: `RFQ #${request.id}`,
      })
      .returning();

    await db.insert(schema.orderItems).values({
      orderId: order.id,
      productId: request.productId,
      variantId: request.variantId,
      qty: request.qty,
      unitPriceCents,
      lineTotalCents: request.quotedPriceCents,
    });

    await db
      .update(schema.rfqRequests)
      .set({ status: "accepted", convertedOrderId: order.id })
      .where(eq(schema.rfqRequests.id, request.id));

    await recordOrderStatusChange({
      orderId: order.id,
      fromStatus: null,
      toStatus: order.status,
      changedBy: context.user.id,
      note: `Order created from accepted RFQ #${request.id}`,
    });

    return order;
  }),

  decline: authed.input(z.object({ id: z.number() })).handler(async ({ context, input }) => {
    const [request] = await db.select().from(schema.rfqRequests).where(eq(schema.rfqRequests.id, input.id));
    if (!request || request.userId !== context.user.id) throw new ORPCError("NOT_FOUND");
    const [updated] = await db
      .update(schema.rfqRequests)
      .set({ status: "declined" })
      .where(eq(schema.rfqRequests.id, request.id))
      .returning();
    return updated;
  }),
};
