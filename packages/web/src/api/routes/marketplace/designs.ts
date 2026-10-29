import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed } from "../../middleware/auth";
import { db } from "../../database";
import * as schema from "../../database/schema";

async function assertOwnsOrderItem(orderItemId: number, userId: string) {
  const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, orderItemId));
  if (!item) throw new ORPCError("NOT_FOUND");
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, item.orderId));
  if (!order || order.userId !== userId) throw new ORPCError("FORBIDDEN");
  return item;
}

/**
 * Design upload → review → approval, customer-facing half (report section 8).
 * Files themselves go to Tigris via routes/marketplace/uploads.ts#presignDesignFile
 * — this file only records the metadata and drives the item's designStatus.
 * Admin review actions live in routes/marketplace/admin/design-reviews.ts.
 */
export const designs = {
  listForItem: authed.input(z.object({ orderItemId: z.number() })).handler(async ({ context, input }) => {
    await assertOwnsOrderItem(input.orderItemId, context.user.id);
    return db
      .select()
      .from(schema.designFiles)
      .where(eq(schema.designFiles.orderItemId, input.orderItemId))
      .orderBy(desc(schema.designFiles.version));
  }),

  /** Records a file already uploaded to Tigris (see uploads.presignDesignFile) as a new version. */
  submit: authed
    .input(
      z.object({
        orderItemId: z.number(),
        s3Key: z.string(),
        fileName: z.string(),
        mimeType: z.string().optional(),
        sizeBytes: z.number().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const item = await assertOwnsOrderItem(input.orderItemId, context.user.id);

      const previous = await db
        .select({ version: schema.designFiles.version })
        .from(schema.designFiles)
        .where(eq(schema.designFiles.orderItemId, input.orderItemId))
        .orderBy(desc(schema.designFiles.version))
        .limit(1);
      const nextVersion = (previous[0]?.version ?? 0) + 1;

      const [file] = await db
        .insert(schema.designFiles)
        .values({
          orderItemId: input.orderItemId,
          s3Key: input.s3Key,
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          version: nextVersion,
          uploadedBy: context.user.id,
          status: "submitted",
        })
        .returning();

      await db.update(schema.orderItems).set({ designStatus: "submitted" }).where(eq(schema.orderItems.id, item.id));

      // First design upload on the order moves it out of "design_pending" and into the admin's review queue.
      const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, item.orderId));
      if (order?.status === "design_pending") {
        await db.update(schema.orders).set({ status: "design_in_review" }).where(eq(schema.orders.id, order.id));
      }

      return file;
    }),
};
