import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";

const ORDER_STATUSES = [
  "design_pending",
  "design_in_review",
  "design_approved",
  "payment_pending",
  "payment_confirmed",
  "in_fulfillment",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled",
  "refunded",
] as const;

/**
 * Admin order management — report sections 4/6. Payment confirmation here is
 * the "manual" provider (bank transfer / cash / pay-on-pickup) from report
 * section 9 — no MadfoatCom call happens until that integration exists.
 */
export const orders = {
  list: adminOnly
    .input(z.object({ status: z.enum(ORDER_STATUSES).optional() }))
    .handler(({ input }) =>
      db
        .select()
        .from(schema.orders)
        .where(input.status ? eq(schema.orders.status, input.status) : undefined)
        .orderBy(desc(schema.orders.id)),
    ),

  get: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, input.id));
    if (!order) throw new ORPCError("NOT_FOUND");
    const [items, payments, customer] = await Promise.all([
      db
        .select({
          id: schema.orderItems.id,
          productId: schema.orderItems.productId,
          variantId: schema.orderItems.variantId,
          qty: schema.orderItems.qty,
          unitPriceCents: schema.orderItems.unitPriceCents,
          lineTotalCents: schema.orderItems.lineTotalCents,
          designStatus: schema.orderItems.designStatus,
          product: schema.products,
        })
        .from(schema.orderItems)
        .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
        .where(eq(schema.orderItems.orderId, order.id)),
      db.select().from(schema.paymentIntents).where(eq(schema.paymentIntents.orderId, order.id)).orderBy(desc(schema.paymentIntents.id)),
      db.select().from(schema.user).where(eq(schema.user.id, order.userId)),
    ]);
    return { ...order, items, payments, customer: customer[0] ?? null };
  }),

  updateStatus: adminOnly
    .input(z.object({ id: z.number(), status: z.enum(ORDER_STATUSES) }))
    .handler(async ({ input }) => {
      const [order] = await db
        .update(schema.orders)
        .set({ status: input.status })
        .where(eq(schema.orders.id, input.id))
        .returning();
      if (!order) throw new ORPCError("NOT_FOUND");
      return order;
    }),

  /** Manual payment confirmation (bank transfer / cash / pay on pickup) — see report section 9. */
  confirmPayment: adminOnly
    .input(z.object({ id: z.number(), reference: z.string().max(200).optional() }))
    .handler(async ({ input }) => {
      const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, input.id));
      if (!order) throw new ORPCError("NOT_FOUND");

      await db.insert(schema.paymentIntents).values({
        orderId: order.id,
        provider: "manual",
        status: "paid",
        amountCents: order.totalCents,
        providerReference: input.reference,
      });

      // "design_approved" and "payment_pending" are both "awaiting payment" states — a manual
      // payment can land while the order is in either, so confirm from both.
      const awaitingPayment = ["design_approved", "payment_pending"].includes(order.status);
      const [updated] = await db
        .update(schema.orders)
        .set({
          paymentStatus: "paid",
          status: awaitingPayment ? "payment_confirmed" : order.status,
        })
        .where(eq(schema.orders.id, order.id))
        .returning();
      return updated;
    }),
};
