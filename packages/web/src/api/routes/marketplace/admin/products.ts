import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly, requireAnyPermission, requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";
import { publicUrl } from "../../../lib/s3";

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

/** Fields a holder of only `edit_product_content` (no `manage_products`) may touch. */
const CONTENT_ONLY_FIELDS = ["nameEn", "nameAr", "descriptionEn", "descriptionAr"] as const;

const variantInput = z.object({
  name: z.string().min(1).max(120),
  sku: z.string().max(60).optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().default("JOD"),
  stockQty: z.number().int().min(0).optional(),
  rentalUnit: z.enum(["day", "week", "event"]).optional(),
});

/**
 * Product catalog management — report section 4 (/admin/products). `get`
 * and `list` never touch supplier tables (see admin/suppliers.ts for that —
 * a deliberately separate, more tightly permissioned route) so there is no
 * supplier data to leak here in the first place.
 */
export const products = {
  list: adminOnly.handler(() => db.select().from(schema.products).orderBy(desc(schema.products.id))),

  get: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, input.id));
    if (!product) throw new ORPCError("NOT_FOUND");
    const [images, variants] = await Promise.all([
      db.select().from(schema.productImages).where(eq(schema.productImages.productId, input.id)).orderBy(asc(schema.productImages.sortOrder)),
      db.select().from(schema.productVariants).where(eq(schema.productVariants.productId, input.id)),
    ]);
    return { ...product, images: images.map((img) => ({ ...img, url: publicUrl(img.s3Key) })), variants };
  }),

  create: requirePermission("manage_products")
    .input(productInput)
    .handler(async ({ input }) => {
      const [product] = await db.insert(schema.products).values(input).returning();
      return product;
    }),

  /**
   * A full catalog manager (`manage_products`) can change any field. A
   * content editor who only holds `edit_product_content` can call the same
   * endpoint, but anything outside `CONTENT_ONLY_FIELDS` — price, category,
   * fulfillment, SKU/slug — is silently dropped from their input rather
   * than applied, so the UI doesn't need two separate forms and a content
   * editor can never smuggle a price change through this endpoint.
   */
  update: requireAnyPermission(["manage_products", "edit_product_content"])
    .input(productInput.partial().extend({ id: z.number() }))
    .handler(async ({ context, input }) => {
      const { id, ...rest } = input;
      const hasFullAccess = context.permissions.includes("manage_products");
      const fields = hasFullAccess
        ? rest
        : Object.fromEntries(Object.entries(rest).filter(([key]) => (CONTENT_ONLY_FIELDS as readonly string[]).includes(key)));
      const [product] = await db.update(schema.products).set(fields).where(eq(schema.products.id, id)).returning();
      if (!product) throw new ORPCError("NOT_FOUND");
      return product;
    }),

  /** Products already referenced by past orders are archived, never hard-deleted. */
  setActive: requirePermission("manage_products")
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .handler(async ({ input }) => {
      const [product] = await db
        .update(schema.products)
        .set({ isActive: input.isActive })
        .where(eq(schema.products.id, input.id))
        .returning();
      if (!product) throw new ORPCError("NOT_FOUND");
      return product;
    }),

  images: {
    /** Public photos — a content editor manages these too, same as name/description. */
    add: requireAnyPermission(["manage_products", "edit_product_content"])
      .input(z.object({ productId: z.number(), s3Key: z.string(), altEn: z.string().optional(), altAr: z.string().optional() }))
      .handler(async ({ input }) => {
        const [image] = await db.insert(schema.productImages).values(input).returning();
        return image;
      }),
    remove: requireAnyPermission(["manage_products", "edit_product_content"])
      .input(z.object({ id: z.number() }))
      .handler(async ({ input }) => {
        await db.delete(schema.productImages).where(eq(schema.productImages.id, input.id));
        return { ok: true };
      }),
  },

  /** Pricing — never exposed to a content editor, only full catalog managers. */
  variants: {
    add: requirePermission("manage_products")
      .input(variantInput.extend({ productId: z.number() }))
      .handler(async ({ input }) => {
        const [variant] = await db.insert(schema.productVariants).values(input).returning();
        return variant;
      }),
    update: requirePermission("manage_products")
      .input(variantInput.partial().extend({ id: z.number() }))
      .handler(async ({ input }) => {
        const { id, ...rest } = input;
        const [variant] = await db.update(schema.productVariants).set(rest).where(eq(schema.productVariants.id, id)).returning();
        if (!variant) throw new ORPCError("NOT_FOUND");
        return variant;
      }),
    remove: requirePermission("manage_products")
      .input(z.object({ id: z.number() }))
      .handler(async ({ input }) => {
        await db.update(schema.productVariants).set({ isActive: false }).where(eq(schema.productVariants.id, input.id));
        return { ok: true };
      }),
  },
};
