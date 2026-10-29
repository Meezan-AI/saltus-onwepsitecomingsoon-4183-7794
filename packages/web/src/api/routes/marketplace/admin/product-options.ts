import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";

const groupInput = z.object({
  productId: z.number(),
  nameEn: z.string().min(1).max(120),
  nameAr: z.string().min(1).max(120),
  sortOrder: z.number().int().default(0),
});

const valueInput = z.object({
  groupId: z.number(),
  valueEn: z.string().min(1).max(120),
  valueAr: z.string().min(1).max(120),
  priceDeltaCents: z.number().int().default(0),
  sortOrder: z.number().int().default(0),
});

/**
 * Product options / attributes, report item 3 — e.g. a "Color" group with
 * "Red" / "Blue" values, or a "Size" group with "S" / "M" / "L". These
 * describe the choices a customer can pick; they do not replace
 * `product_variants` (the priceable SKU), they describe what a variant
 * represents. Deleting a group cascades to its values (see schema.ts).
 */
export const productOptions = {
  /** Every option group + its values for one product, in display order. */
  forProduct: adminOnly.input(z.object({ productId: z.number() })).handler(async ({ input }) => {
    const groups = await db
      .select()
      .from(schema.productOptionGroups)
      .where(eq(schema.productOptionGroups.productId, input.productId))
      .orderBy(asc(schema.productOptionGroups.sortOrder));

    const groupsWithValues = await Promise.all(
      groups.map(async (group) => ({
        ...group,
        values: await db
          .select()
          .from(schema.productOptionValues)
          .where(eq(schema.productOptionValues.groupId, group.id))
          .orderBy(asc(schema.productOptionValues.sortOrder)),
      })),
    );
    return groupsWithValues;
  }),

  groups: {
    create: adminOnly.input(groupInput).handler(async ({ input }) => {
      const [group] = await db.insert(schema.productOptionGroups).values(input).returning();
      return group;
    }),

    update: adminOnly.input(groupInput.partial().extend({ id: z.number() })).handler(async ({ input }) => {
      const { id, ...rest } = input;
      const [group] = await db
        .update(schema.productOptionGroups)
        .set(rest)
        .where(eq(schema.productOptionGroups.id, id))
        .returning();
      if (!group) throw new ORPCError("NOT_FOUND");
      return group;
    }),

    /** Hard delete — this is an attribute definition, not a transactional record; its values cascade. */
    remove: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
      await db.delete(schema.productOptionGroups).where(eq(schema.productOptionGroups.id, input.id));
      return { ok: true };
    }),
  },

  values: {
    create: adminOnly.input(valueInput).handler(async ({ input }) => {
      const [value] = await db.insert(schema.productOptionValues).values(input).returning();
      return value;
    }),

    update: adminOnly.input(valueInput.partial().extend({ id: z.number() })).handler(async ({ input }) => {
      const { id, ...rest } = input;
      const [value] = await db
        .update(schema.productOptionValues)
        .set(rest)
        .where(eq(schema.productOptionValues.id, id))
        .returning();
      if (!value) throw new ORPCError("NOT_FOUND");
      return value;
    }),

    remove: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
      await db.delete(schema.productOptionValues).where(eq(schema.productOptionValues.id, input.id));
      return { ok: true };
    }),
  },
};
