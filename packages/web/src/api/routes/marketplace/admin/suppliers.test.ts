import { describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";
import { call, ORPCError } from "@orpc/server";

vi.mock("../../../database", async () => {
  const { createTestDb } = await import("../../../database/test-helpers");
  const { db } = await createTestDb();
  return { db };
});
vi.mock("../../../auth", () => ({
  auth: {
    api: {
      getSession: async ({ headers }: { headers: Headers }) => {
        const raw = headers.get("x-test-session");
        if (!raw) return null;
        const { user } = JSON.parse(raw);
        return { user, session: { id: "test-session", userId: user.id } };
      },
    },
  },
}));

const { db } = await import("../../../database");
const schema = await import("../../../database/schema");
const { seedUser, seedProduct } = await import("../../../database/test-helpers");
const { suppliers } = await import("./suppliers");
const { sessionHeaders, adminWithRole } = await import("./test-auth-helpers");

const SENSITIVE_SUPPLIER = {
  nameEn: "Acme Fabrication",
  nameAr: "أكمي للتصنيع",
  contactName: "Khalid Supplier Contact",
  email: "khalid@acme-supplier.test",
  phone: "+962790000000",
  address: "Industrial City, Amman",
  notes: "Gives us a 15% discount if we pay net-15 instead of net-30.",
  coverageArea: "Amman, Zarqa, Irbid",
  agreementRef: "AGR-2026-0042",
};

describe("admin/suppliers (report item 4, confidentiality report)", () => {
  it("manager (holds manage_suppliers) can create + list a supplier", async () => {
    const admin = await adminWithRole(db, "manager");
    const headers = sessionHeaders(admin);

    const created = await call(suppliers.create, SENSITIVE_SUPPLIER, { context: { headers } });
    expect(created.isActive).toBe(true);
    expect(created.coverageArea).toBe(SENSITIVE_SUPPLIER.coverageArea);
    expect(created.agreementRef).toBe(SENSITIVE_SUPPLIER.agreementRef);

    const list = await call(suppliers.list, undefined, { context: { headers } });
    expect(list.some((s) => s.id === created.id)).toBe(true);
  });

  it("accounting (also holds manage_suppliers) can read supplier cost data", async () => {
    const admin = await adminWithRole(db, "accounting");
    const headers = sessionHeaders(admin);
    const product = await seedProduct(db);
    const supplier = await call(suppliers.create, SENSITIVE_SUPPLIER, { context: { headers } });

    const link = await call(
      suppliers.linkProduct,
      { productId: product.id, supplierId: supplier.id, costPriceCents: 12000, supplierSku: "ACME-SKU-77" },
      { context: { headers } },
    );
    expect(link.costPriceCents).toBe(12000);
    expect(link.supplierSku).toBe("ACME-SKU-77");

    const links = await call(suppliers.linksForProduct, { productId: product.id }, { context: { headers } });
    expect(links[0].costPriceCents).toBe(12000);
    expect(links[0].supplier.nameEn).toBe(SENSITIVE_SUPPLIER.nameEn);
  });

  it("linkProduct rejects a duplicate (product, supplier) pair", async () => {
    const admin = await adminWithRole(db, "manager");
    const headers = sessionHeaders(admin);
    const product = await seedProduct(db);
    const supplier = await call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } });

    await call(suppliers.linkProduct, { productId: product.id, supplierId: supplier.id }, { context: { headers } });

    await expect(
      call(suppliers.linkProduct, { productId: product.id, supplierId: supplier.id }, { context: { headers } }),
    ).rejects.toThrow(ORPCError);
  });

  it("get() returns the supplier with its linked products", async () => {
    const admin = await adminWithRole(db, "manager");
    const headers = sessionHeaders(admin);
    const product = await seedProduct(db);
    const supplier = await call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } });
    await call(suppliers.linkProduct, { productId: product.id, supplierId: supplier.id, isPreferred: true }, { context: { headers } });

    const loaded = await call(suppliers.get, { id: supplier.id }, { context: { headers } });
    expect(loaded.products.length).toBe(1);
    expect(loaded.products[0].product.id).toBe(product.id);
  });

  it("setActive archives instead of hard-deleting", async () => {
    const admin = await adminWithRole(db, "manager");
    const headers = sessionHeaders(admin);
    const supplier = await call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } });

    const archived = await call(suppliers.setActive, { id: supplier.id, isActive: false }, { context: { headers } });
    expect(archived.isActive).toBe(false);

    const list = await call(suppliers.list, undefined, { context: { headers } });
    expect(list.find((s) => s.id === supplier.id)).toBeTruthy(); // still there, just inactive
  });

  it("rejects a non-admin user outright", async () => {
    const customer = await seedUser(db, { role: "customer" });
    const headers = sessionHeaders(customer);

    await expect(
      call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } }),
    ).rejects.toThrow(ORPCError);
  });

  // ---------------------------------------------------------------------
  // Confidentiality report, requirement: "اختبار صلاحيات يثبت أن المستخدم
  // غير المصرح له لا يستطيع الوصول إلى بيانات المورد الداخلية" — an admin
  // user who IS allowed into the dashboard but whose role does not grant
  // `manage_suppliers` must still be rejected on every supplier endpoint,
  // read or write.
  // ---------------------------------------------------------------------
  describe("roles without manage_suppliers are forbidden from every supplier endpoint", () => {
    it.each(["sales", "content_editor"])("%s role is rejected on list/get/create/link", async (roleName) => {
      const admin = await adminWithRole(db, roleName);
      const headers = sessionHeaders(admin);
      const product = await seedProduct(db);

      await expect(call(suppliers.list, undefined, { context: { headers } })).rejects.toThrow(ORPCError);
      await expect(
        call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } }),
      ).rejects.toThrow(ORPCError);
      await expect(call(suppliers.get, { id: 1 }, { context: { headers } })).rejects.toThrow(ORPCError);
      await expect(
        call(suppliers.linksForProduct, { productId: product.id }, { context: { headers } }),
      ).rejects.toThrow(ORPCError);
      await expect(
        call(suppliers.linkProduct, { productId: product.id, supplierId: 1 }, { context: { headers } }),
      ).rejects.toThrow(ORPCError);
    });

    it("an admin holding zero roles at all is rejected too (adminOnly alone isn't enough)", async () => {
      const admin = await seedUser(db, { role: "admin" }); // no userRoles row whatsoever
      const headers = sessionHeaders(admin);
      await expect(call(suppliers.list, undefined, { context: { headers } })).rejects.toThrow(ORPCError);
    });
  });

  // ---------------------------------------------------------------------
  // Confidentiality report, requirement: every view/edit of sensitive
  // supplier data is written to the audit log.
  // ---------------------------------------------------------------------
  describe("audit logging", () => {
    it("writes a 'view' entry for list/get/linksForProduct and a 'create'/'update' entry for writes", async () => {
      const admin = await adminWithRole(db, "manager");
      const headers = sessionHeaders(admin);
      const product = await seedProduct(db);

      const supplier = await call(suppliers.create, SENSITIVE_SUPPLIER, { context: { headers } });
      await call(suppliers.list, undefined, { context: { headers } });
      await call(suppliers.get, { id: supplier.id }, { context: { headers } });
      await call(suppliers.linkProduct, { productId: product.id, supplierId: supplier.id }, { context: { headers } });
      await call(suppliers.linksForProduct, { productId: product.id }, { context: { headers } });
      await call(suppliers.setActive, { id: supplier.id, isActive: false }, { context: { headers } });

      const logs = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, admin.id));
      const actions = logs.map((l) => `${l.action}:${l.entityType}`);

      expect(actions).toContain("create:supplier");
      expect(actions).toContain("view:supplier"); // list + get
      expect(actions).toContain("create:product_supplier_link");
      expect(actions).toContain("view:product_supplier_link"); // linksForProduct
      expect(actions).toContain("update:supplier"); // setActive

      // Every entry is attributed to the actual actor, never anonymous.
      expect(logs.every((l) => l.actorUserId === admin.id)).toBe(true);
    });

    it("a rejected (forbidden) call writes no audit entry at all", async () => {
      const blocked = await adminWithRole(db, "sales");
      const headers = sessionHeaders(blocked);

      await expect(call(suppliers.list, undefined, { context: { headers } })).rejects.toThrow(ORPCError);

      const logs = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, blocked.id));
      expect(logs.length).toBe(0);
    });
  });
});
