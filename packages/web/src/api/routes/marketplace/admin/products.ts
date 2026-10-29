import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";

const productInput = z.object({
  sku: z.string().min(1).max(60),
  slug: z.string().min(1).max(160),
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  descriptionEn: z.string().max(5000).optional(),
  descriptionAr: z.string().max(5000).optional(),
  categoryId: z.number().optional(),
  type: z.enum(["equipment", "printing", "gift", "service", "other"]).default("other"),
  fulfillmentType: z.enum(["pickup_rental", "delivery", "mixed_per_variant"]).default("delivery"),
  allowDirectPurchase: z.boolean().default(true),
  allowRfq: z.boolean().default(true),
});

const variantInput = z.object({
  name: z.string().min(1).max(120),
  sku: z.string().max(60).optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().default("JOD"),
  stockQty: z.number().int().min(0).optional(),
  rentalUnit: z.enum(["day", "week", "event"]).optional(),
});

/** Product catalog management — report section 4 (/admin/products). */
export const products = {
  list: adminOnly.handler(() => db.select().from(schema.products).orderBy(desc(schema.products.id))),

  get: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, input.id));
    if (!product) throw new ORPCError("NOT_FOUND");
    const [images, variants] = await Promise.all([
      db.select().from(schema.productImages).where(eq(schema.productImages.productId, input.id)).orderBy(asc(schema.productImages.sortOrder)),
      db.select().from(schema.productVariants).where(eq(schema.productVariants.productId, input.id)),
    ]);
    return { ...product, images, variants };
  }),

  create: adminOnly.input(productInput).handler(async ({ input }) => {
    const [product] = await db.insert(schema.products).values(input).returning();
    return product;
  }),

  update: adminOnly.input(productInput.partial().extend({ id: z.number() })).handler(async ({ input }) => {
    const { id, ...rest } = input;
    const [product] = await db.update(schema.products).set(rest).where(eq(schema.products.id, id)).returning();
    if (!product) throw new ORPCError("NOT_FOUND");
    return product;
  }),

  /** Products already referenced by past orders are archived, never hard-deleted. */
  setActive: adminOnly.input(z.object({ id: z.number(), isActive: z.boolean() })).handler(async ({ input }) => {
    const [product] = await db
      .update(schema.products)
      .set({ isActive: input.isActive })
      .where(eq(schema.products.id, input.id))
      .returning();
    if (!product) throw new ORPCError("NOT_FOUND");
    return product;
  }),

  images: {
    add: adminOnly
      .input(z.object({ productId: z.number(), s3Key: z.string(), altEn: z.string().optional(), altAr: z.string().optional() }))
      .handler(async ({ input }) => {
        const [image] = await db.insert(schema.productImages).values(input).returning();
        return image;
      }),
    remove: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
      await db.delete(schema.productImages).where(eq(schema.productImages.id, input.id));
      return { ok: true };
    }),
  },

  variants: {
    add: adminOnly.input(variantInput.extend({ productId: z.number() })).handler(async ({ input }) => {
      const [variant] = await db.insert(schema.productVariants).values(input).returning();
      return variant;
    }),
    update: adminOnly.input(variantInput.partial().extend({ id: z.number() })).handler(async ({ input }) => {
      const { id, ...rest } = input;
      const [variant] = await db.update(schema.productVariants).set(rest).where(eq(schema.productVariants.id, id)).returning();
      if (!variant) throw new ORPCError("NOT_FOUND");
      return variant;
    }),
    remove: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
      await db.update(schema.productVariants).set({ isActive: false }).where(eq(schema.productVariants.id, input.id));
      return { ok: true };
    }),
  },
};
