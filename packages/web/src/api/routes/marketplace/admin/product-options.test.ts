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
const { productOptions } = await import("./product-options");
const { sessionHeaders } = await import("./test-auth-helpers");

describe("admin/product-options (report item 3)", () => {
  it("creates a group with values and reads them back nested, in sort order", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);
    const product = await seedProduct(db);

    const group = await call(
      productOptions.groups.create,
      { productId: product.id, nameEn: "Size", nameAr: "المقاس", sortOrder: 0 },
      { context: { headers } },
    );
    await call(productOptions.values.create, { groupId: group.id, valueEn: "Large", valueAr: "كبير", priceDeltaCents: 500, sortOrder: 1 }, { context: { headers } });
    await call(productOptions.values.create, { groupId: group.id, valueEn: "Small", valueAr: "صغير", priceDeltaCents: 0, sortOrder: 0 }, { context: { headers } });

    const result = await call(productOptions.forProduct, { productId: product.id }, { context: { headers } });
    expect(result.length).toBe(1);
    expect(result[0].values.map((v) => v.valueEn)).toEqual(["Small", "Large"]); // sortOrder 0 before 1
  });

  it("groups.remove cascades to its values", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);
    const product = await seedProduct(db);
    const group = await call(productOptions.groups.create, { productId: product.id, nameEn: "Color", nameAr: "اللون", sortOrder: 0 }, { context: { headers } });
    await call(productOptions.values.create, { groupId: group.id, valueEn: "Red", valueAr: "أحمر", priceDeltaCents: 0, sortOrder: 0 }, { context: { headers } });

    await call(productOptions.groups.remove, { id: group.id }, { context: { headers } });

    const result = await call(productOptions.forProduct, { productId: product.id }, { context: { headers } });
    expect(result.length).toBe(0);
  });

  it("values.update 404s for a missing value", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);

    await expect(
      call(productOptions.values.update, { id: 999999, valueEn: "x" }, { context: { headers } }),
    ).rejects.toThrow(ORPCError);
  });
});
