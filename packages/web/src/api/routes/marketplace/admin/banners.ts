import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";
import { publicUrl } from "../../../lib/s3";

const text = (max: number) => z.string().trim().max(max).nullable().optional();

const bannerInput = z.object({
  titleEn: text(120),
  titleAr: text(120),
  subtitleEn: text(240),
  subtitleAr: text(240),
  badgeEn: text(40),
  badgeAr: text(40),
  ctaEn: text(40),
  ctaAr: text(40),
  imageKey: z.string().min(1).max(500),
  productId: z.number().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  linkUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "Link must start with / or http(s)://")
    .nullable()
    .optional(),
  isActive: z.boolean().default(true),
});

/** Empty strings from the form become null so "no title" is a single state. */
function clean<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, v === "" ? null : v])) as T;
}

/**
 * Marketplace hero slides — the admin adds, edits, reorders and removes them.
 * Same permission as the product catalog: whoever manages products manages the hero.
 */
export const banners = {
  list: requirePermission("manage_products").handler(async () => {
    const rows = await db.select().from(schema.marketplaceBanners).orderBy(asc(schema.marketplaceBanners.sortOrder), asc(schema.marketplaceBanners.id));
    const products = await db.select({ id: schema.products.id, nameEn: schema.products.nameEn }).from(schema.products);
    const categories = await db.select({ id: schema.categories.id, nameEn: schema.categories.nameEn }).from(schema.categories);
    return rows.map((b) => ({
      ...b,
      imageUrl: publicUrl(b.imageKey),
      productName: products.find((p) => p.id === b.productId)?.nameEn ?? null,
      categoryName: categories.find((c) => c.id === b.categoryId)?.nameEn ?? null,
    }));
  }),

  create: requirePermission("manage_products")
    .input(bannerInput)
    .handler(async ({ input }) => {
      const rows = await db.select({ sortOrder: schema.marketplaceBanners.sortOrder }).from(schema.marketplaceBanners);
      const next = rows.reduce((m, r) => Math.max(m, r.sortOrder), -1) + 1;
      const [banner] = await db
        .insert(schema.marketplaceBanners)
        .values({ ...clean(input), linkUrl: input.linkUrl || null, sortOrder: next })
        .returning();
      return banner;
    }),

  update: requirePermission("manage_products")
    .input(bannerInput.partial().extend({ id: z.number() }))
    .handler(async ({ input }) => {
      const { id, ...rest } = input;
      const [banner] = await db.update(schema.marketplaceBanners).set(clean(rest)).where(eq(schema.marketplaceBanners.id, id)).returning();
      if (!banner) throw new ORPCError("NOT_FOUND");
      return banner;
    }),

  remove: requirePermission("manage_products")
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.marketplaceBanners).where(eq(schema.marketplaceBanners.id, input.id));
      return { ok: true };
    }),

  /** Swap a slide with its neighbour in the current order. */
  move: requirePermission("manage_products")
    .input(z.object({ id: z.number(), direction: z.enum(["up", "down"]) }))
    .handler(async ({ input }) => {
      const rows = await db.select().from(schema.marketplaceBanners).orderBy(asc(schema.marketplaceBanners.sortOrder), asc(schema.marketplaceBanners.id));
      const index = rows.findIndex((r) => r.id === input.id);
      if (index === -1) throw new ORPCError("NOT_FOUND");
      const target = input.direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= rows.length) return { ok: true };
      const ordered = [...rows];
      [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
      // Re-number every slide so equal sortOrder values (e.g. after deletes) can't make a swap a no-op.
      for (let i = 0; i < ordered.length; i++) {
        if (ordered[i].sortOrder !== i) {
          await db.update(schema.marketplaceBanners).set({ sortOrder: i }).where(eq(schema.marketplaceBanners.id, ordered[i].id));
        }
      }
      return { ok: true };
    }),
};

/** Where a slide leads: product page, else category filter, else a custom link. null = not clickable. */
export function bannerHref(
  banner: { productId: number | null; categoryId: number | null; linkUrl: string | null },
  product: { slug: string } | undefined,
  category: { slug: string } | undefined,
) {
  if (banner.productId && product) return `/marketplace/product/${product.slug}`;
  if (banner.categoryId && category) return `/marketplace?category=${encodeURIComponent(category.slug)}`;
  return banner.linkUrl || null;
}
