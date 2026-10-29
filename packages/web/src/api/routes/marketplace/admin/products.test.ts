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
const { seedProduct } = await import("../../../database/test-helpers");
const { products } = await import("./products");
const { sessionHeaders, adminWithRole } = await import("./test-auth-helpers");

/**
 * Supplier confidentiality report, requirement 9: a content editor
 * (`edit_product_content` only, no `manage_products`) may touch a
 * product's public name/description, but never its price, category,
 * fulfillment, or SKU/slug — and never the suppliers endpoints at all
 * (covered separately in suppliers.test.ts).
 */
describe("admin/products — content editor vs full catalog manager split", () => {
  it("manager (manage_products) can update every field, including price-adjacent ones", async () => {
    const manager = await adminWithRole(db, "manager");
    const product = await seedProduct(db);

    const updated = await call(
      products.update,
      { id: product.id, nameEn: "Updated Name", fulfillmentType: "pickup_rental", allowRfq: false },
      { context: { headers: sessionHeaders(manager) } },
    );

    expect(updated.nameEn).toBe("Updated Name");
    expect(updated.fulfillmentType).toBe("pickup_rental");
    expect(updated.allowRfq).toBe(false);
  });

  it("content_editor can update name/description, but non-content fields are silently dropped, not applied", async () => {
    const editor = await adminWithRole(db, "content_editor");
    const product = await seedProduct(db, { type: "other" });
    const originalCategoryId = product.categoryId;
    const originalFulfillment = product.fulfillmentType;

    const updated = await call(
      products.update,
      {
        id: product.id,
        nameEn: "Content Editor Name",
        descriptionEn: "New public description",
        categoryId: 99, // must be dropped
        fulfillmentType: "pickup_rental", // must be dropped
        allowRfq: false, // must be dropped
      },
      { context: { headers: sessionHeaders(editor) } },
    );

    expect(updated.nameEn).toBe("Content Editor Name");
    expect(updated.descriptionEn).toBe("New public description");
    // Unchanged — the content-only filter dropped these before the DB write.
    expect(updated.categoryId).toBe(originalCategoryId);
    expect(updated.fulfillmentType).toBe(originalFulfillment);
  });

  it("content_editor is forbidden from create, setActive, and variants (pricing)", async () => {
    const editor = await adminWithRole(db, "content_editor");
    const headers = sessionHeaders(editor);
    const product = await seedProduct(db);

    await expect(
      call(products.create, { sku: "X-1", slug: "x-1", nameEn: "X", nameAr: "اكس" }, { context: { headers } }),
    ).rejects.toBeInstanceOf(ORPCError);

    await expect(
      call(products.setActive, { id: product.id, isActive: false }, { context: { headers } }),
    ).rejects.toBeInstanceOf(ORPCError);

    await expect(
      call(products.variants.add, { productId: product.id, name: "Default", priceCents: 1000 }, { context: { headers } }),
    ).rejects.toBeInstanceOf(ORPCError);
  });

  it("content_editor CAN add/remove public product photos (same bucket as name/description)", async () => {
    const editor = await adminWithRole(db, "content_editor");
    const headers = sessionHeaders(editor);
    const product = await seedProduct(db);

    const image = await call(
      products.images.add,
      { productId: product.id, s3Key: "product-images/test.png" },
      { context: { headers } },
    );
    expect(image.productId).toBe(product.id);

    await expect(call(products.images.remove, { id: image.id }, { context: { headers } })).resolves.toEqual({ ok: true });
  });

  it("sales (neither manage_products nor edit_product_content) is forbidden from update entirely", async () => {
    const sales = await adminWithRole(db, "sales");
    const product = await seedProduct(db);

    await expect(
      call(products.update, { id: product.id, nameEn: "Should not apply" }, { context: { headers: sessionHeaders(sales) } }),
    ).rejects.toBeInstanceOf(ORPCError);
  });

  it("list/get stay open to any admin regardless of RBAC role (no supplier data involved)", async () => {
    const editor = await adminWithRole(db, "content_editor");
    const headers = sessionHeaders(editor);
    const product = await seedProduct(db);

    const list = await call(products.list, undefined, { context: { headers } });
    expect(list.some((p) => p.id === product.id)).toBe(true);

    const got = await call(products.get, { id: product.id }, { context: { headers } });
    expect(got.id).toBe(product.id);
  });
});
