import { describe, it, expect, vi } from "vitest";
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
const { seedUser, seedProduct } = await import("../../../database/test-helpers");
const { suppliers } = await import("./suppliers");
const { sessionHeaders } = await import("./test-auth-helpers");

describe("admin/suppliers (report item 4)", () => {
  it("create + list a supplier", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);

    const created = await call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } });
    expect(created.isActive).toBe(true);

    const list = await call(suppliers.list, undefined, { context: { headers } });
    expect(list.some((s) => s.id === created.id)).toBe(true);
  });

  it("linkProduct rejects a duplicate (product, supplier) pair", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);
    const product = await seedProduct(db);
    const supplier = await call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } });

    await call(suppliers.linkProduct, { productId: product.id, supplierId: supplier.id }, { context: { headers } });

    await expect(
      call(suppliers.linkProduct, { productId: product.id, supplierId: supplier.id }, { context: { headers } }),
    ).rejects.toThrow(ORPCError);
  });

  it("get() returns the supplier with its linked products", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);
    const product = await seedProduct(db);
    const supplier = await call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } });
    await call(suppliers.linkProduct, { productId: product.id, supplierId: supplier.id, isPreferred: true }, { context: { headers } });

    const loaded = await call(suppliers.get, { id: supplier.id }, { context: { headers } });
    expect(loaded.products.length).toBe(1);
    expect(loaded.products[0].product.id).toBe(product.id);
  });

  it("setActive archives instead of hard-deleting", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);
    const supplier = await call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } });

    const archived = await call(suppliers.setActive, { id: supplier.id, isActive: false }, { context: { headers } });
    expect(archived.isActive).toBe(false);

    const list = await call(suppliers.list, undefined, { context: { headers } });
    expect(list.find((s) => s.id === supplier.id)).toBeTruthy(); // still there, just inactive
  });

  it("rejects a non-admin user", async () => {
    const customer = await seedUser(db, { role: "customer" });
    const headers = sessionHeaders(customer);

    await expect(
      call(suppliers.create, { nameEn: "Acme", nameAr: "أكمي" }, { context: { headers } }),
    ).rejects.toThrow(ORPCError);
  });
});
