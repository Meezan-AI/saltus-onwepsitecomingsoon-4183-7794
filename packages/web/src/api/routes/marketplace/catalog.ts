import { and, asc, eq, inArray, like, or } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { base } from "../../__core/app";
import { db } from "../../database";
import * as schema from "../../database/schema";
import { publicUrl } from "../../lib/s3";

/**
 * Explicit public-safe column list for a storefront product (supplier
 * confidentiality report, requirement 10) — every field a customer is
 * allowed to see, and nothing else. This is deliberately NOT `select()`
 * (which would return every column `products` ever grows) specifically so
 * that if a supplier-identifying column is ever added to `products` by
 * mistake, it does not silently start appearing on the storefront: this
 * list has to be edited on purpose first. Supplier id/name/contact/cost/
 * SKU/notes live on separate tables (`suppliers`, `product_suppliers`)
 * that this file never joins or imports at all — see admin/suppliers.ts.
 */
const PUBLIC_PRODUCT_COLUMNS = {
  id: schema.products.id,
  sku: schema.products.sku,
  slug: schema.products.slug,
  nameEn: schema.products.nameEn,
  nameAr: schema.products.nameAr,
  descriptionEn: schema.products.descriptionEn,
  descriptionAr: schema.products.descriptionAr,
  categoryId: schema.products.categoryId,
  type: schema.products.type,
  fulfillmentType: schema.products.fulfillmentType,
  allowDirectPurchase: schema.products.allowDirectPurchase,
  allowRfq: schema.products.allowRfq,
  isActive: schema.products.isActive,
};

/**
 * Public storefront catalog — categories and products, no auth required.
 * Mirrors report section 3 (storefront pages).
 */
export const catalog = {
  categories: {
    list: base.handler(() =>
      db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder)),
    ),
  },

  products: {
    list: base
      .input(
        z.object({
          categorySlug: z.string().optional(),
          q: z.string().max(120).optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(60).default(24),
        }),
      )
      .handler(async ({ input }) => {
        const filters = [eq(schema.products.isActive, true)];

        if (input.categorySlug) {
          const [category] = await db
            .select({ id: schema.categories.id })
            .from(schema.categories)
            .where(eq(schema.categories.slug, input.categorySlug));
          if (!category) return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
          filters.push(eq(schema.products.categoryId, category.id));
        }

        if (input.q) {
          const needle = `%${input.q}%`;
          filters.push(
            or(like(schema.products.nameEn, needle), like(schema.products.nameAr, needle))!,
          );
        }

        const where = and(...filters);
        const offset = (input.page - 1) * input.pageSize;

        const [rows, totalRows] = await Promise.all([
          db
            .select(PUBLIC_PRODUCT_COLUMNS)
            .from(schema.products)
            .where(where)
            .orderBy(asc(schema.products.id))
            .limit(input.pageSize)
            .offset(offset),
          db.select({ id: schema.products.id }).from(schema.products).where(where),
        ]);

        const productIds = rows.map((p) => p.id);
        const [images, variants] = productIds.length
          ? await Promise.all([
              db
                .select()
                .from(schema.productImages)
                .where(inArray(schema.productImages.productId, productIds))
                .orderBy(asc(schema.productImages.sortOrder)),
              db
                .select()
                .from(schema.productVariants)
                .where(
                  and(
                    inArray(schema.productVariants.productId, productIds),
                    eq(schema.productVariants.isActive, true),
                  ),
                ),
            ])
          : [[], []];

        // One cheap image + the lowest active variant price per card — the grid never
        // needs the full image gallery or every variant, just enough to render a card.
        const items = rows.map((product) => {
          const cover = images.find((img) => img.productId === product.id);
          const productVariants = variants.filter((v) => v.productId === product.id);
          const minPriceCents = productVariants.length
            ? Math.min(...productVariants.map((v) => v.priceCents))
            : null;
          return {
            ...product,
            coverImageUrl: cover ? publicUrl(cover.s3Key) : null,
            minPriceCents,
            currency: productVariants[0]?.currency ?? "JOD",
          };
        });

        return { items, total: totalRows.length, page: input.page, pageSize: input.pageSize };
      }),

    get: base.input(z.object({ slug: z.string() })).handler(async ({ input }) => {
      const [product] = await db.select(PUBLIC_PRODUCT_COLUMNS).from(schema.products).where(eq(schema.products.slug, input.slug));
      if (!product || !product.isActive) throw new ORPCError("NOT_FOUND", { message: "Product not found" });

      const [images, variants] = await Promise.all([
        db
          .select()
          .from(schema.productImages)
          .where(eq(schema.productImages.productId, product.id))
          .orderBy(asc(schema.productImages.sortOrder)),
        db
          .select()
          .from(schema.productVariants)
          .where(and(eq(schema.productVariants.productId, product.id), eq(schema.productVariants.isActive, true))),
      ]);

      return {
        ...product,
        images: images.map((img) => ({ ...img, url: publicUrl(img.s3Key) })),
        variants,
      };
    }),
  },
};
