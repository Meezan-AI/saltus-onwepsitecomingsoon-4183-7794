import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed } from "../../middleware/auth";
import { db } from "../../database";
import * as schema from "../../database/schema";

function generateOrderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SO-${stamp}-${random}`;
}

async function orderWithItems(orderId: number) {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) return null;
  const items = await db
    .select({
      id: schema.orderItems.id,
      productId: schema.orderItems.productId,
      variantId: schema.orderItems.variantId,
      qty: schema.orderItems.qty,
      unitPriceCents: schema.orderItems.unitPriceCents,
      lineTotalCents: schema.orderItems.lineTotalCents,
      designStatus: schema.orderItems.designStatus,
      product: schema.products,
      variant: schema.productVariants,
    })
    .from(schema.orderItems)
    .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
    .leftJoin(schema.productVariants, eq(schema.orderItems.variantId, schema.productVariants.id))
    .where(eq(schema.orderItems.orderId, orderId));
  return { ...order, items };
}

/**
 * Customer-facing orders — checkout from the cart and own order history.
 * Report section 6 (order lifecycle) and section 11 decision #2: a cart that
 * mixes pickup/rental items with delivery items is split into two orders here.
 */
export const orders = {
  list: authed.handler(({ context }) =>
    db.select().from(schema.orders).where(eq(schema.orders.userId, context.user.id)).orderBy(desc(schema.orders.id)),
  ),

  get: authed.input(z.object({ orderNumber: z.string() })).handler(async ({ context, input }) => {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, input.orderNumber));
    if (!order || order.userId !== context.user.id) throw new ORPCError("NOT_FOUND");
    return orderWithItems(order.id);
  }),

  /** Converts the signed-in customer's cart into one or two orders (split by fulfillment type) and empties the cart. */
  checkout: authed
    .input(z.object({ deliveryAddressId: z.number().optional(), notes: z.string().max(2000).optional() }))
    .handler(async ({ context, input }) => {
      const [myCart] = await db.select().from(schema.carts).where(eq(schema.carts.userId, context.user.id));
      if (!myCart) throw new ORPCError("BAD_REQUEST", { message: "Cart is empty" });

      const rows = await db
        .select({
          qty: schema.cartItems.qty,
          product: schema.products,
          variant: schema.productVariants,
        })
        .from(schema.cartItems)
        .innerJoin(schema.products, eq(schema.cartItems.productId, schema.products.id))
        .leftJoin(schema.productVariants, eq(schema.cartItems.variantId, schema.productVariants.id))
        .where(eq(schema.cartItems.cartId, myCart.id));

      if (rows.length === 0) throw new ORPCError("BAD_REQUEST", { message: "Cart is empty" });

      const groups = new Map<"pickup_rental" | "delivery", typeof rows>();
      for (const row of rows) {
        const key = row.product.fulfillmentType === "pickup_rental" ? "pickup_rental" : "delivery";
        groups.set(key, [...(groups.get(key) ?? []), row]);
      }

      if (groups.has("delivery") && !input.deliveryAddressId) {
        throw new ORPCError("BAD_REQUEST", { message: "A delivery address is required" });
      }
      if (input.deliveryAddressId) {
        const [address] = await db
          .select()
          .from(schema.addresses)
          .where(and(eq(schema.addresses.id, input.deliveryAddressId), eq(schema.addresses.userId, context.user.id)));
        if (!address) throw new ORPCError("NOT_FOUND", { message: "Address not found" });
      }

      const createdOrders = [];
      for (const [fulfillmentType, groupRows] of groups) {
        const subtotalCents = groupRows.reduce(
          (sum, row) => sum + (row.variant?.priceCents ?? 0) * row.qty,
          0,
        );

        const [order] = await db
          .insert(schema.orders)
          .values({
            orderNumber: generateOrderNumber(),
            userId: context.user.id,
            fulfillmentType,
            subtotalCents,
            totalCents: subtotalCents,
            deliveryAddressId: fulfillmentType === "delivery" ? input.deliveryAddressId : null,
            notes: input.notes,
          })
          .returning();

        for (const row of groupRows) {
          if (!row.variant) continue;
          await db.insert(schema.orderItems).values({
            orderId: order.id,
            productId: row.product.id,
            variantId: row.variant.id,
            qty: row.qty,
            unitPriceCents: row.variant.priceCents,
            lineTotalCents: row.variant.priceCents * row.qty,
          });
        }

        createdOrders.push(order);
      }

      await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, myCart.id));
      return createdOrders;
    }),

  /** Only while the order is still in design review, before payment/fulfillment has begun. */
  cancel: authed.input(z.object({ orderNumber: z.string() })).handler(async ({ context, input }) => {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, input.orderNumber));
    if (!order || order.userId !== context.user.id) throw new ORPCError("NOT_FOUND");
    if (!["design_pending", "design_in_review", "design_approved", "payment_pending"].includes(order.status)) {
      throw new ORPCError("BAD_REQUEST", { message: "This order can no longer be cancelled" });
    }
    const [updated] = await db
      .update(schema.orders)
      .set({ status: "cancelled" })
      .where(eq(schema.orders.id, order.id))
      .returning();
    return updated;
  }),
};
