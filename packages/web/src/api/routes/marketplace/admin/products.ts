import { asc, desc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly, requireAnyPermission, requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";
import { publicUrl } from "../../../lib/s3";
import { activeDiscountPercent } from "../../../lib/pricing";

const productInput = z.object({
  /** Optional on create: generated from the product type (e.g. PR-004) when omitted. */
  sku: z.string().min(1).max(60),
  /** Optional on create: generated from the English name when omitted. */
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
  /** 0 = no discount. */
  discountPercent: z.number().int().min(0).max(100).default(0),
  /** ISO date-time; null/omitted = the discount never expires. */
  discountEndsAt: z.string().datetime().nullable().optional(),
});

const SKU_PREFIX: Record<string, string> = { equipment: "EQ", printing: "PR", gift: "GF", service: "SV", other: "OT" };

/** Next free SKU for a product type, e.g. PR-004 after PR-003. */
async function generateSku(type: string) {
  const prefix = SKU_PREFIX[type] ?? "OT";
  const rows = await db
    .select({ sku: schema.products.sku })
    .from(schema.products)
    .where(like(schema.products.sku, `${prefix}-%`));
  const max = rows.reduce((acc, r) => {
    const n = Number(r.sku.slice(prefix.length + 1));
    return Number.isInteger(n) && n > acc ? n : acc;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Unique URL slug from the English name ("product" when it has no latin letters/digits). */
async function generateSlug(nameEn: string) {
  const base = slugify(nameEn).slice(0, 140) || "product";
  let candidate = base;
  for (let i = 2; ; i++) {
    const [clash] = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.slug, candidate));
    if (!clash) return candidate;
    candidate = `${base}-${i}`;
  }
}

function isUniqueViolation(err: unknown) {
  return /UNIQUE constraint failed/i.test(String((err as { message?: string })?.message ?? err)) ||
    /UNIQUE constraint failed/i.test(String((err as { cause?: { message?: string } })?.cause?.message ?? ""));
}

/** Fields a holder of only `edit_product_content` (no `manage_products`) may touch. */
const CONTENT_ONLY_FIELDS = ["nameEn", "nameAr", "descriptionEn", "descriptionAr"] as const;

const variantInput = z.object({
  name: z.string().min(1).max(120),
  sku: z.string().max(60).optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().default("JOD"),
  stockQty: z.number().int().min(0).nullable().optional(),
  rentalUnit: z.enum(["day", "week", "event"]).optional(),
});

/**
 * Product catalog management — report section 4 (/admin/products). `get`
 * and `list` never touch supplier tables (see admin/suppliers.ts for that —
 * a deliberately separate, more tightly permissioned route) so there is no
 * supplier data to leak here in the first place.
 */
export const products = {
  /** Catalog table: each product with a small cover photo, price range, discount and category. */
  list: adminOnly.handler(async () => {
    const [rows, images, variants, categories] = await Promise.all([
      db.select().from(schema.products).orderBy(desc(schema.products.id)),
      db.select().from(schema.productImages).orderBy(asc(schema.productImages.sortOrder), asc(schema.productImages.id)),
      db.select().from(schema.productVariants).where(eq(schema.productVariants.isActive, true)),
      db.select().from(schema.categories),
    ]);
    return rows.map((p) => {
      const cover = images.find((img) => img.productId === p.id);
      const prices = variants.filter((v) => v.productId === p.id).map((v) => v.priceCents);
      return {
        ...p,
        coverImageUrl: cover ? publicUrl(cover.s3Key) : null,
        minPriceCents: prices.length ? Math.min(...prices) : null,
        activeDiscountPercent: activeDiscountPercent(p),
        categoryNameEn: categories.find((c) => c.id === p.categoryId)?.nameEn ?? null,
      };
    });
  }),

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
    .input(productInput.extend({ sku: productInput.shape.sku.optional(), slug: productInput.shape.slug.optional() }))
    .handler(async ({ input }) => {
      const { discountEndsAt, ...rest } = input;
      try {
        const [product] = await db
          .insert(schema.products)
          .values({
            ...rest,
            sku: rest.sku?.trim() || (await generateSku(rest.type)),
            slug: rest.slug?.trim() || (await generateSlug(rest.nameEn)),
            discountEndsAt: discountEndsAt ? new Date(discountEndsAt) : null,
          })
          .returning();
        return product;
      } catch (err) {
        if (isUniqueViolation(err)) throw new ORPCError("CONFLICT", { message: "SKU or slug already exists" });
        throw err;
      }
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
    .input(
      productInput
        .partial()
        // null clears the category
        .extend({ id: z.number(), categoryId: z.number().nullable().optional() }),
    )
    .handler(async ({ context, input }) => {
      const { id, discountEndsAt, ...rest } = input;
      const hasFullAccess = context.permissions.includes("manage_products");
      const fields: Record<string, unknown> = hasFullAccess
        ? { ...rest, ...(discountEndsAt !== undefined ? { discountEndsAt: discountEndsAt ? new Date(discountEndsAt) : null } : {}) }
        : Object.fromEntries(Object.entries(rest).filter(([key]) => (CONTENT_ONLY_FIELDS as readonly string[]).includes(key)));
      if (Object.keys(fields).length === 0) {
        const [existing] = await db.select().from(schema.products).where(eq(schema.products.id, id));
        if (!existing) throw new ORPCError("NOT_FOUND");
        return existing;
      }
      try {
        const [product] = await db.update(schema.products).set(fields).where(eq(schema.products.id, id)).returning();
        if (!product) throw new ORPCError("NOT_FOUND");
        return product;
      } catch (err) {
        if (isUniqueViolation(err)) throw new ORPCError("CONFLICT", { message: "SKU or slug already exists" });
        throw err;
      }
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

  /**
   * Permanently delete a product that has never been ordered or quoted. Anything
   * referenced by an order or RFQ must be archived instead (setActive) so order
   * history stays intact.
   */
  remove: requirePermission("manage_products")
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [product] = await db.select().from(schema.products).where(eq(schema.products.id, input.id));
      if (!product) throw new ORPCError("NOT_FOUND");
      const [ordered] = await db.select({ id: schema.orderItems.id }).from(schema.orderItems).where(eq(schema.orderItems.productId, input.id)).limit(1);
      const [quoted] = await db.select({ id: schema.rfqRequests.id }).from(schema.rfqRequests).where(eq(schema.rfqRequests.productId, input.id)).limit(1);
      if (ordered || quoted) {
        throw new ORPCError("CONFLICT", { message: "This product appears in orders or quote requests, so it can only be archived." });
      }
      await db.delete(schema.cartItems).where(eq(schema.cartItems.productId, input.id));
      await db.update(schema.marketplaceBanners).set({ productId: null }).where(eq(schema.marketplaceBanners.productId, input.id));
      await db.delete(schema.products).where(eq(schema.products.id, input.id));
      return { ok: true };
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
