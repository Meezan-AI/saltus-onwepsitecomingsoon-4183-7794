import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";

const categoryInput = z.object({
  nameEn: z.string().min(1).max(160),
  nameAr: z.string().min(1).max(160),
  slug: z.string().min(1).max(160),
  parentId: z.number().optional(),
  sortOrder: z.number().int().default(0),
});

/** Category management — report section 4 (/admin/categories). */
export const categories = {
  list: adminOnly.handler(() => db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder))),

  create: adminOnly.input(categoryInput).handler(async ({ input }) => {
    const [category] = await db.insert(schema.categories).values(input).returning();
    return category;
  }),

  update: adminOnly.input(categoryInput.partial().extend({ id: z.number() })).handler(async ({ input }) => {
    const { id, ...rest } = input;
    const [category] = await db.update(schema.categories).set(rest).where(eq(schema.categories.id, id)).returning();
    if (!category) throw new ORPCError("NOT_FOUND");
    return category;
  }),

  delete: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [inUse] = await db.select().from(schema.products).where(eq(schema.products.categoryId, input.id));
    if (inUse) throw new ORPCError("BAD_REQUEST", { message: "Category still has products — move them first" });
    await db.delete(schema.categories).where(eq(schema.categories.id, input.id));
    return { ok: true };
  }),
};
