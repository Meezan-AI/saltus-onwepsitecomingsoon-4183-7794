import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";
import { recordOrderStatusChange } from "../../../services/order-status-history";

/** Once every item on an order has a resolved design, the order can move past design review. */
async function maybeAdvanceOrder(orderId: number, changedBy: string) {
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  const allResolved = items.every((item) => ["approved", "not_required"].includes(item.designStatus));
  if (!allResolved) return;
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  // Covers both the normal path (submitted → in review) and an order where every item was
  // marked `not_required` straight away, which never passes through "design_in_review".
  if (order && ["design_pending", "design_in_review"].includes(order.status)) {
    await db.update(schema.orders).set({ status: "design_approved" }).where(eq(schema.orders.id, orderId));
    await recordOrderStatusChange({
      orderId,
      fromStatus: order.status,
      toStatus: "design_approved",
      changedBy,
      note: "All order items resolved",
    });
  }
}

/**
 * Admin half of design upload → review → approval (report section 8).
 * Customer uploads live in routes/marketplace/designs.ts.
 */
export const designReviews = {
  /** Order items with a design file awaiting a decision. */
  queue: adminOnly.handler(async () => {
    const pendingItems = await db
      .select({
        id: schema.orderItems.id,
        orderId: schema.orderItems.orderId,
        productId: schema.orderItems.productId,
        designStatus: schema.orderItems.designStatus,
        order: schema.orders,
        product: schema.products,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(inArray(schema.orderItems.designStatus, ["submitted", "in_review"]));

    return pendingItems;
  }),

  filesForItem: adminOnly.input(z.object({ orderItemId: z.number() })).handler(({ input }) =>
    db
      .select()
      .from(schema.designFiles)
      .where(eq(schema.designFiles.orderItemId, input.orderItemId))
      .orderBy(desc(schema.designFiles.version)),
  ),

  /** Mark an item as not needing a design at all — the manual override from report section 8. */
  markNotRequired: adminOnly.input(z.object({ orderItemId: z.number() })).handler(async ({ context, input }) => {
    const [item] = await db
      .update(schema.orderItems)
      .set({ designStatus: "not_required" })
      .where(eq(schema.orderItems.id, input.orderItemId))
      .returning();
    if (!item) throw new ORPCError("NOT_FOUND");
    await maybeAdvanceOrder(item.orderId, context.user.id);
    return item;
  }),

  /**
   * One design submission can carry several files sharing the same version (e.g. a
   * t-shirt's front + back artwork) — reviewed as one unit, not file by file.
   */
  review: adminOnly
    .input(
      z.object({
        orderItemId: z.number(),
        version: z.number(),
        decision: z.enum(["approved", "changes_requested"]),
        reviewerNote: z.string().max(2000).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const files = await db
        .select()
        .from(schema.designFiles)
        .where(
          and(eq(schema.designFiles.orderItemId, input.orderItemId), eq(schema.designFiles.version, input.version)),
        );
      if (!files.length) throw new ORPCError("NOT_FOUND");

      await db
        .update(schema.designFiles)
        .set({
          status: input.decision,
          reviewerNote: input.reviewerNote,
          reviewedBy: context.user.id,
          reviewedAt: new Date(),
        })
        .where(
          and(eq(schema.designFiles.orderItemId, input.orderItemId), eq(schema.designFiles.version, input.version)),
        );

      const [item] = await db
        .update(schema.orderItems)
        .set({ designStatus: input.decision })
        .where(eq(schema.orderItems.id, input.orderItemId))
        .returning();
      if (!item) throw new ORPCError("NOT_FOUND");

      if (input.decision === "approved") await maybeAdvanceOrder(item.orderId, context.user.id);
      return item;
    }),
};
