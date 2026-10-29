import { eq } from "drizzle-orm";
import { z } from "zod";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ORPCError } from "@orpc/server";
import { adminOnly, authed } from "../../middleware/auth";
import { db } from "../../database";
import * as schema from "../../database/schema";
import { publicUrl, s3 } from "../../lib/s3";

function sanitize(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export const uploads = {
  /** Admin only — product photos are public (shown on the storefront). */
  presignProductImage: adminOnly
    .input(z.object({ filename: z.string(), contentType: z.string() }))
    .handler(async ({ input }) => {
      const key = `product-images/${Date.now()}-${sanitize(input.filename)}`;
      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          ContentType: input.contentType,
          ACL: "public-read",
        }),
        { expiresIn: 600, signableHeaders: new Set(["x-amz-acl"]) },
      );
      return { url, key, publicUrl: publicUrl(key) };
    }),

  /**
   * Customer — design files for one of their own order items. Uploaded
   * without a public ACL: these are the customer's own artwork/briefs, not
   * public assets, so they are read back only via `designFileUrl` below.
   */
  presignDesignFile: authed
    .input(z.object({ orderItemId: z.number(), filename: z.string(), contentType: z.string() }))
    .handler(async ({ context, input }) => {
      const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, input.orderItemId));
      if (!item) throw new ORPCError("NOT_FOUND");
      const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, item.orderId));
      if (!order || order.userId !== context.user.id) throw new ORPCError("FORBIDDEN");

      const key = `design-files/${order.id}/${Date.now()}-${sanitize(input.filename)}`;
      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: input.contentType }),
        { expiresIn: 600 },
      );
      return { url, key };
    }),

  /** Short-lived GET link for a private design file — the order's owner or an admin only. */
  designFileUrl: authed.input(z.object({ designFileId: z.number() })).handler(async ({ context, input }) => {
    const [file] = await db.select().from(schema.designFiles).where(eq(schema.designFiles.id, input.designFileId));
    if (!file) throw new ORPCError("NOT_FOUND");
    const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, file.orderItemId));
    if (!item) throw new ORPCError("NOT_FOUND");
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, item.orderId));
    const role = (context.user as { role?: string | null }).role;
    if (!order || (order.userId !== context.user.id && role !== "admin")) throw new ORPCError("FORBIDDEN");

    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: file.s3Key }), {
      expiresIn: 600,
    });
    return { url };
  }),
};
