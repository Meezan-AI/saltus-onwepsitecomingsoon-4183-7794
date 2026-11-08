import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";
import { GROUP_KEYS, PLAN_STATUSES, parseLines, parseSpecs, planReference, specGroupSchema } from "../../../services/event-plan";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const itemInput = z.object({
  groupKey: z.enum(GROUP_KEYS),
  nameEn: z.string().trim().min(1).max(120),
  nameAr: z.string().trim().min(1).max(120),
  descEn: optionalText(300),
  descAr: optionalText(300),
  productId: z.number().int().nullable().optional(),
  qtyMode: z.enum(["attendees", "one", "none"]),
  unitEn: optionalText(40),
  unitAr: optionalText(40),
  specs: z.array(specGroupSchema).max(12),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean(),
});

function toRow(input: z.infer<typeof itemInput>) {
  const { specs, ...rest } = input;
  return {
    ...rest,
    descEn: rest.descEn || null,
    descAr: rest.descAr || null,
    unitEn: rest.unitEn || null,
    unitAr: rest.unitAr || null,
    productId: rest.productId ?? null,
    specsJson: JSON.stringify(specs),
  };
}

/** Admin → Planner items: the editable checklist behind «جهّز مؤتمرك». Same permission as the product catalog. */
export const eventPlanItems = {
  list: requirePermission("manage_products").handler(async () => {
    const [rows, products] = await Promise.all([
      db.select().from(schema.eventPlanItems).orderBy(asc(schema.eventPlanItems.sortOrder), asc(schema.eventPlanItems.id)),
      db.select({ id: schema.products.id, nameEn: schema.products.nameEn, isActive: schema.products.isActive }).from(schema.products),
    ]);
    return rows.map((r) => ({
      ...r,
      specs: parseSpecs(r.specsJson),
      productName: products.find((p) => p.id === r.productId)?.nameEn ?? null,
    }));
  }),

  create: requirePermission("manage_products")
    .input(itemInput)
    .handler(async ({ input }) => {
      const rows = await db.select({ sortOrder: schema.eventPlanItems.sortOrder }).from(schema.eventPlanItems);
      const next = rows.reduce((m, r) => Math.max(m, r.sortOrder), 0) + 10;
      const [item] = await db
        .insert(schema.eventPlanItems)
        .values({ ...toRow(input), sortOrder: input.sortOrder ?? next })
        .returning();
      return item;
    }),

  update: requirePermission("manage_products")
    .input(itemInput.extend({ id: z.number().int() }))
    .handler(async ({ input }) => {
      const { id, ...rest } = input;
      const [item] = await db.update(schema.eventPlanItems).set(toRow(rest)).where(eq(schema.eventPlanItems.id, id)).returning();
      if (!item) throw new ORPCError("NOT_FOUND");
      return item;
    }),

  remove: requirePermission("manage_products")
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input }) => {
      await db.delete(schema.eventPlanItems).where(eq(schema.eventPlanItems.id, input.id));
      return { ok: true };
    }),
};

/** Admin → Event plans: submitted planner requests. Same permission as RFQs. */
export const eventPlans = {
  list: requirePermission("manage_rfqs")
    .input(z.object({ status: z.enum(PLAN_STATUSES).optional() }))
    .handler(async ({ input }) => {
      const rows = await db
        .select()
        .from(schema.eventPlanRequests)
        .where(input.status ? eq(schema.eventPlanRequests.status, input.status) : undefined)
        .orderBy(desc(schema.eventPlanRequests.id));
      return rows.map(({ itemsJson, ...r }) => ({
        ...r,
        reference: planReference(r.id),
        itemCount: parseLines(itemsJson).length,
      }));
    }),

  get: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input }) => {
      const [row] = await db.select().from(schema.eventPlanRequests).where(eq(schema.eventPlanRequests.id, input.id));
      if (!row) throw new ORPCError("NOT_FOUND");
      const { itemsJson, ...rest } = row;
      return { ...rest, reference: planReference(row.id), lines: parseLines(itemsJson) };
    }),

  setStatus: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int(), status: z.enum(PLAN_STATUSES) }))
    .handler(async ({ input }) => {
      const [row] = await db
        .update(schema.eventPlanRequests)
        .set({ status: input.status })
        .where(eq(schema.eventPlanRequests.id, input.id))
        .returning();
      if (!row) throw new ORPCError("NOT_FOUND");
      return { id: row.id, status: row.status };
    }),
};
