import { and, asc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { base } from "../../__core/app";
import { db } from "../../database";
import * as schema from "../../database/schema";

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

        const [items, totalRows] = await Promise.all([
          db
            .select()
            .from(schema.products)
            .where(where)
            .orderBy(asc(schema.products.id))
            .limit(input.pageSize)
            .offset(offset),
          db.select({ id: schema.products.id }).from(schema.products).where(where),
        ]);

        return { items, total: totalRows.length, page: input.page, pageSize: input.pageSize };
      }),

    get: base.input(z.object({ slug: z.string() })).handler(async ({ input }) => {
      const [product] = await db.select().from(schema.products).where(eq(schema.products.slug, input.slug));
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

      return { ...product, images, variants };
    }),
  },
};
