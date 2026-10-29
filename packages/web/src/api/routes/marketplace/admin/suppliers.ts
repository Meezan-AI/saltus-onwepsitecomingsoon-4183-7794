import { desc, eq, and } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";

const supplierInput = z.object({
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  contactName: z.string().max(200).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

const linkInput = z.object({
  productId: z.number(),
  supplierId: z.number(),
  costPriceCents: z.number().int().min(0).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  isPreferred: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

/**
 * Supplier management, report item 4 — a vendor Saltus sources products
 * from, and the many-to-many links tying them to the products they supply
 * (report decision: one product can have several suppliers, for price
 * comparison). Suppliers are archived (`isActive: false`), never
 * hard-deleted, matching the convention in admin/products.ts.
 */
export const suppliers = {
  list: adminOnly.handler(() => db.select().from(schema.suppliers).orderBy(desc(schema.suppliers.id))),

  get: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [supplier] = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, input.id));
    if (!supplier) throw new ORPCError("NOT_FOUND");
    const links = await db
      .select({
        id: schema.productSuppliers.id,
        productId: schema.productSuppliers.productId,
        supplierId: schema.productSuppliers.supplierId,
        costPriceCents: schema.productSuppliers.costPriceCents,
        leadTimeDays: schema.productSuppliers.leadTimeDays,
        isPreferred: schema.productSuppliers.isPreferred,
        notes: schema.productSuppliers.notes,
        product: schema.products,
      })
      .from(schema.productSuppliers)
      .innerJoin(schema.products, eq(schema.productSuppliers.productId, schema.products.id))
      .where(eq(schema.productSuppliers.supplierId, input.id));
    return { ...supplier, products: links };
  }),

  create: adminOnly.input(supplierInput).handler(async ({ input }) => {
    const [supplier] = await db.insert(schema.suppliers).values(input).returning();
    return supplier;
  }),

  update: adminOnly.input(supplierInput.partial().extend({ id: z.number() })).handler(async ({ input }) => {
    const { id, ...rest } = input;
    const [supplier] = await db.update(schema.suppliers).set(rest).where(eq(schema.suppliers.id, id)).returning();
    if (!supplier) throw new ORPCError("NOT_FOUND");
    return supplier;
  }),

  setActive: adminOnly.input(z.object({ id: z.number(), isActive: z.boolean() })).handler(async ({ input }) => {
    const [supplier] = await db
      .update(schema.suppliers)
      .set({ isActive: input.isActive })
      .where(eq(schema.suppliers.id, input.id))
      .returning();
    if (!supplier) throw new ORPCError("NOT_FOUND");
    return supplier;
  }),

  /** Which suppliers a given product can be sourced from. */
  linksForProduct: adminOnly.input(z.object({ productId: z.number() })).handler(({ input }) =>
    db
      .select({
        id: schema.productSuppliers.id,
        productId: schema.productSuppliers.productId,
        supplierId: schema.productSuppliers.supplierId,
        costPriceCents: schema.productSuppliers.costPriceCents,
        leadTimeDays: schema.productSuppliers.leadTimeDays,
        isPreferred: schema.productSuppliers.isPreferred,
        notes: schema.productSuppliers.notes,
        supplier: schema.suppliers,
      })
      .from(schema.productSuppliers)
      .innerJoin(schema.suppliers, eq(schema.productSuppliers.supplierId, schema.suppliers.id))
      .where(eq(schema.productSuppliers.productId, input.productId)),
  ),

  linkProduct: adminOnly.input(linkInput).handler(async ({ input }) => {
    const existing = await db
      .select()
      .from(schema.productSuppliers)
      .where(
        and(
          eq(schema.productSuppliers.productId, input.productId),
          eq(schema.productSuppliers.supplierId, input.supplierId),
        ),
      );
    if (existing.length) throw new ORPCError("BAD_REQUEST", { message: "This supplier is already linked to this product" });
    const [link] = await db.insert(schema.productSuppliers).values(input).returning();
    return link;
  }),

  updateLink: adminOnly
    .input(
      z.object({
        id: z.number(),
        costPriceCents: z.number().int().min(0).optional(),
        leadTimeDays: z.number().int().min(0).optional(),
        isPreferred: z.boolean().optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { id, ...rest } = input;
      const [link] = await db.update(schema.productSuppliers).set(rest).where(eq(schema.productSuppliers.id, id)).returning();
      if (!link) throw new ORPCError("NOT_FOUND");
      return link;
    }),

  unlinkProduct: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db.delete(schema.productSuppliers).where(eq(schema.productSuppliers.id, input.id));
    return { ok: true };
  }),
};
