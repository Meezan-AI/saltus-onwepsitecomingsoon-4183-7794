import { desc, eq, and } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";
import { recordAuditLog } from "../../../services/audit-log";

const supplierInput = z.object({
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  contactName: z.string().max(200).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  coverageArea: z.string().max(500).optional(),
  agreementRef: z.string().max(500).optional(),
});

const linkInput = z.object({
  productId: z.number(),
  supplierId: z.number(),
  costPriceCents: z.number().int().min(0).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  isPreferred: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  supplierSku: z.string().max(120).optional(),
  alternativeSupplierId: z.number().optional(),
});

/**
 * Supplier management, report item 4 — a vendor Saltus sources products
 * from, and the many-to-many links tying them to the products they supply
 * (report decision: one product can have several suppliers, for price
 * comparison). Suppliers are archived (`isActive: false`), never
 * hard-deleted, matching the convention in admin/products.ts.
 *
 * Confidentiality report: supplier identity, contact, cost, SKU, lead time
 * and internal notes are the most sensitive data admin holds about its
 * vendors — a customer must never see it (enforced by catalog.ts never
 * joining these tables at all) and only the admins whose role grants
 * `manage_suppliers` may read or write it here (requirement 7/8). Every
 * call — reads included — is written to `audit_logs` (requirement 9).
 */
export const suppliers = {
  list: requirePermission("manage_suppliers").handler(async ({ context }) => {
    const rows = await db.select().from(schema.suppliers).orderBy(desc(schema.suppliers.id));
    await recordAuditLog({ actorUserId: context.user.id, action: "view", entityType: "supplier", metadata: { op: "list", count: rows.length } });
    return rows;
  }),

  get: requirePermission("manage_suppliers")
    .input(z.object({ id: z.number() }))
    .handler(async ({ context, input }) => {
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
          supplierSku: schema.productSuppliers.supplierSku,
          alternativeSupplierId: schema.productSuppliers.alternativeSupplierId,
          product: schema.products,
        })
        .from(schema.productSuppliers)
        .innerJoin(schema.products, eq(schema.productSuppliers.productId, schema.products.id))
        .where(eq(schema.productSuppliers.supplierId, input.id));
      await recordAuditLog({ actorUserId: context.user.id, action: "view", entityType: "supplier", entityId: input.id });
      return { ...supplier, products: links };
    }),

  create: requirePermission("manage_suppliers")
    .input(supplierInput)
    .handler(async ({ context, input }) => {
      const [supplier] = await db.insert(schema.suppliers).values(input).returning();
      await recordAuditLog({ actorUserId: context.user.id, action: "create", entityType: "supplier", entityId: supplier.id });
      return supplier;
    }),

  update: requirePermission("manage_suppliers")
    .input(supplierInput.partial().extend({ id: z.number() }))
    .handler(async ({ context, input }) => {
      const { id, ...rest } = input;
      const [supplier] = await db.update(schema.suppliers).set(rest).where(eq(schema.suppliers.id, id)).returning();
      if (!supplier) throw new ORPCError("NOT_FOUND");
      await recordAuditLog({ actorUserId: context.user.id, action: "update", entityType: "supplier", entityId: id, metadata: { fields: Object.keys(rest) } });
      return supplier;
    }),

  setActive: requirePermission("manage_suppliers")
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .handler(async ({ context, input }) => {
      const [supplier] = await db
        .update(schema.suppliers)
        .set({ isActive: input.isActive })
        .where(eq(schema.suppliers.id, input.id))
        .returning();
      if (!supplier) throw new ORPCError("NOT_FOUND");
      await recordAuditLog({ actorUserId: context.user.id, action: "update", entityType: "supplier", entityId: input.id, metadata: { isActive: input.isActive } });
      return supplier;
    }),

  /** Which suppliers a given product can be sourced from. */
  linksForProduct: requirePermission("manage_suppliers")
    .input(z.object({ productId: z.number() }))
    .handler(async ({ context, input }) => {
      const rows = await db
        .select({
          id: schema.productSuppliers.id,
          productId: schema.productSuppliers.productId,
          supplierId: schema.productSuppliers.supplierId,
          costPriceCents: schema.productSuppliers.costPriceCents,
          leadTimeDays: schema.productSuppliers.leadTimeDays,
          isPreferred: schema.productSuppliers.isPreferred,
          notes: schema.productSuppliers.notes,
          supplierSku: schema.productSuppliers.supplierSku,
          alternativeSupplierId: schema.productSuppliers.alternativeSupplierId,
          supplier: schema.suppliers,
        })
        .from(schema.productSuppliers)
        .innerJoin(schema.suppliers, eq(schema.productSuppliers.supplierId, schema.suppliers.id))
        .where(eq(schema.productSuppliers.productId, input.productId));
      await recordAuditLog({
        actorUserId: context.user.id,
        action: "view",
        entityType: "product_supplier_link",
        metadata: { op: "linksForProduct", productId: input.productId },
      });
      return rows;
    }),

  linkProduct: requirePermission("manage_suppliers")
    .input(linkInput)
    .handler(async ({ context, input }) => {
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
      await recordAuditLog({
        actorUserId: context.user.id,
        action: "create",
        entityType: "product_supplier_link",
        entityId: link.id,
        metadata: { productId: input.productId, supplierId: input.supplierId },
      });
      return link;
    }),

  updateLink: requirePermission("manage_suppliers")
    .input(
      z.object({
        id: z.number(),
        costPriceCents: z.number().int().min(0).optional(),
        leadTimeDays: z.number().int().min(0).optional(),
        isPreferred: z.boolean().optional(),
        notes: z.string().max(2000).optional(),
        supplierSku: z.string().max(120).optional(),
        alternativeSupplierId: z.number().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { id, ...rest } = input;
      const [link] = await db.update(schema.productSuppliers).set(rest).where(eq(schema.productSuppliers.id, id)).returning();
      if (!link) throw new ORPCError("NOT_FOUND");
      await recordAuditLog({ actorUserId: context.user.id, action: "update", entityType: "product_supplier_link", entityId: id, metadata: { fields: Object.keys(rest) } });
      return link;
    }),

  unlinkProduct: requirePermission("manage_suppliers")
    .input(z.object({ id: z.number() }))
    .handler(async ({ context, input }) => {
      await db.delete(schema.productSuppliers).where(eq(schema.productSuppliers.id, input.id));
      await recordAuditLog({ actorUserId: context.user.id, action: "delete", entityType: "product_supplier_link", entityId: input.id });
      return { ok: true };
    }),
};
