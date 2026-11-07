import { describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";
import { call } from "@orpc/server";

vi.mock("../../database", async () => {
  const { createTestDb } = await import("../../database/test-helpers");
  const { db } = await createTestDb();
  return { db };
});
vi.mock("../../auth", () => ({
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

const { db } = await import("../../database");
const schema = await import("../../database/schema");
const { seedUser, seedProduct } = await import("../../database/test-helpers");
const { activeDiscountPercent, applyDiscount } = await import("../../lib/pricing");
const { products } = await import("./admin/products");
const { banners } = await import("./admin/banners");
const { catalog } = await import("./catalog");
const { cart } = await import("./cart");
const { orders } = await import("./orders");
const { sessionHeaders, adminWithRole } = await import("./admin/test-auth-helpers");

const future = () => new Date(Date.now() + 86_400_000);
const past = () => new Date(Date.now() - 86_400_000);

describe("pricing helpers", () => {
  it("ignores missing, out-of-range and expired discounts", () => {
    expect(activeDiscountPercent({ discountPercent: 0, discountEndsAt: null })).toBe(0);
    expect(activeDiscountPercent({ discountPercent: 150, discountEndsAt: null })).toBe(0);
    expect(activeDiscountPercent({ discountPercent: -5, discountEndsAt: null })).toBe(0);
    expect(activeDiscountPercent({ discountPercent: 20, discountEndsAt: past() })).toBe(0);
  });

  it("returns the percent while active", () => {
    expect(activeDiscountPercent({ discountPercent: 20, discountEndsAt: null })).toBe(20);
    expect(activeDiscountPercent({ discountPercent: 20, discountEndsAt: future() })).toBe(20);
  });

  it("applies the discount and rounds to whole fils", () => {
    expect(applyDiscount(10_000, 20)).toBe(8_000);
    expect(applyDiscount(999, 15)).toBe(849);
    expect(applyDiscount(5_000, 0)).toBe(5_000);
    expect(applyDiscount(5_000, 100)).toBe(0);
  });
});

describe("admin/products create + remove", () => {
  it("auto-generates a type-prefixed SKU and a unique slug", async () => {
    const manager = await adminWithRole(db, "manager");
    const ctx = { context: { headers: sessionHeaders(manager) } };
    const a = await call(products.create, { nameEn: "Gold Pen", nameAr: "قلم", type: "gift" }, ctx);
    const b = await call(products.create, { nameEn: "Gold Pen", nameAr: "قلم", type: "gift" }, ctx);
    expect(a.sku).toMatch(/^GF-\d{3}$/);
    expect(b.sku).toMatch(/^GF-\d{3}$/);
    expect(b.sku).not.toBe(a.sku);
    expect(a.slug).toBe("gold-pen");
    expect(b.slug).not.toBe(a.slug);
  });

  it("reports CONFLICT for a duplicate explicit SKU", async () => {
    const manager = await adminWithRole(db, "manager");
    const existing = await seedProduct(db);
    await expect(
      call(
        products.create,
        { nameEn: "Dup", nameAr: "مكرر", type: "other", sku: existing.sku },
        { context: { headers: sessionHeaders(manager) } },
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("stores a discount and lets the category be cleared with null", async () => {
    const manager = await adminWithRole(db, "manager");
    const ctx = { context: { headers: sessionHeaders(manager) } };
    const [cat] = await db.insert(schema.categories).values({ slug: "c-clear", nameEn: "C", nameAr: "ج" }).returning();
    const p = await call(products.create, { nameEn: "Disc", nameAr: "خصم", type: "other", categoryId: cat.id, discountPercent: 25 }, ctx);
    expect(p.discountPercent).toBe(25);
    expect(p.categoryId).toBe(cat.id);
    const cleared = await call(products.update, { id: p.id, categoryId: null }, ctx);
    expect(cleared.categoryId).toBeNull();
  });

  it("hard-deletes an unused product but refuses one that was ordered", async () => {
    const manager = await adminWithRole(db, "manager");
    const ctx = { context: { headers: sessionHeaders(manager) } };
    const unused = await seedProduct(db);
    await call(products.remove, { id: unused.id }, ctx);
    const gone = await db.select().from(schema.products).where(eq(schema.products.id, unused.id));
    expect(gone).toHaveLength(0);

    const customer = await seedUser(db);
    const ordered = await seedProduct(db);
    const [order] = await db
      .insert(schema.orders)
      .values({ orderNumber: `T-${ordered.id}`, userId: customer.id, fulfillmentType: "delivery", subtotalCents: 1000, totalCents: 1000 } as never)
      .returning();
    await db
      .insert(schema.orderItems)
      .values({ orderId: order.id, productId: ordered.id, nameSnapshot: "x", qty: 1, unitPriceCents: 1000, lineTotalCents: 1000 } as never);
    await expect(call(products.remove, { id: ordered.id }, ctx)).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("hero banners", () => {
  it("creates, reorders with move, edits and removes slides", async () => {
    const manager = await adminWithRole(db, "manager");
    const ctx = { context: { headers: sessionHeaders(manager) } };
    const make = (n: string) =>
      call(banners.create, { titleEn: n, titleAr: n, imageKey: `banners/${n}.jpg`, linkUrl: "/marketplace", isActive: true }, ctx);
    const a = await make("A");
    const b = await make("B");
    const c = await make("C");
    await call(banners.move, { id: c.id, direction: "up" }, ctx);
    let list = await call(banners.list, undefined, ctx);
    expect(list.map((x) => x.titleEn).filter((t) => ["A", "B", "C"].includes(t ?? ""))).toEqual(["A", "C", "B"]);
    // moving the first slide up is a no-op
    await call(banners.move, { id: a.id, direction: "up" }, ctx);
    const edited = await call(banners.update, { id: b.id, titleEn: "B2", isActive: false }, ctx);
    expect(edited.titleEn).toBe("B2");
    expect(edited.isActive).toBe(false);
    await call(banners.remove, { id: a.id }, ctx);
    list = await call(banners.list, undefined, ctx);
    expect(list.find((x) => x.id === a.id)).toBeUndefined();
  });

  it("requires manage_products", async () => {
    const editor = await adminWithRole(db, "content_editor");
    await expect(call(banners.list, undefined, { context: { headers: sessionHeaders(editor) } })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("public list shows active slides only and hides ones whose product is archived", async () => {
    const manager = await adminWithRole(db, "manager");
    const ctx = { context: { headers: sessionHeaders(manager) } };
    const live = await seedProduct(db, { slug: "live-prod" });
    const dead = await seedProduct(db, { slug: "dead-prod" });
    await db.update(schema.products).set({ discountPercent: 30 }).where(eq(schema.products.id, live.id));
    await db.update(schema.products).set({ isActive: false }).where(eq(schema.products.id, dead.id));
    const base = { titleAr: "ع", imageKey: "banners/x.jpg", isActive: true };
    await call(banners.create, { ...base, titleEn: "Live slide", productId: live.id }, ctx);
    await call(banners.create, { ...base, titleEn: "Archived slide", productId: dead.id }, ctx);
    await call(banners.create, { ...base, titleEn: "Hidden slide", linkUrl: "/x", isActive: false }, ctx);

    const pub = await call(catalog.banners.list, undefined, { context: { headers: new Headers() } });
    const titles = pub.map((s) => s.titleEn);
    expect(titles).toContain("Live slide");
    expect(titles).not.toContain("Archived slide");
    expect(titles).not.toContain("Hidden slide");
    const slide = pub.find((s) => s.titleEn === "Live slide")!;
    expect(slide.href).toBe("/marketplace/product/live-prod");
    expect(slide.discountPercent).toBe(30);
  });
});

describe("storefront discount flow", () => {
  it("shows the sale price in the catalog and freezes it into the order", async () => {
    const customer = await seedUser(db);
    const product = await seedProduct(db, { slug: "sale-prod" });
    await db.update(schema.products).set({ discountPercent: 20, discountEndsAt: future() }).where(eq(schema.products.id, product.id));
    const [variant] = await db
      .insert(schema.productVariants)
      .values({ productId: product.id, name: "Default", priceCents: 10_000 })
      .returning();

    const list = await call(catalog.products.list, { page: 1, pageSize: 60 }, { context: { headers: new Headers() } });
    const item = list.items.find((i) => i.id === product.id)!;
    expect(item.discountPercent).toBe(20);
    expect(item.minPriceCents).toBe(10_000);
    expect(item.minSalePriceCents).toBe(8_000);

    const detail = await call(catalog.products.get, { slug: "sale-prod" }, { context: { headers: new Headers() } });
    expect(detail.variants[0].salePriceCents).toBe(8_000);

    const [address] = await db
      .insert(schema.addresses)
      .values({ userId: customer.id, recipientName: "T", phone: "0790000000", city: "Amman", addressLine1: "1" })
      .returning();
    const [myCart] = await db.insert(schema.carts).values({ userId: customer.id }).returning();
    await db.insert(schema.cartItems).values({ cartId: myCart.id, productId: product.id, variantId: variant.id, qty: 2 });
    const headers = sessionHeaders(customer);

    const view = await call(cart.get, undefined, { context: { headers } });
    expect(view.items[0].unitPriceCents).toBe(8_000);

    const [order] = await call(orders.checkout, { deliveryAddressId: address.id }, { context: { headers } });
    const rows = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
    expect(rows[0].unitPriceCents).toBe(8_000);
    expect(rows[0].lineTotalCents).toBe(16_000);
    expect(order.subtotalCents).toBe(16_000);

    // A later price change must not rewrite history.
    await db.update(schema.products).set({ discountPercent: 0 }).where(eq(schema.products.id, product.id));
    const again = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
    expect(again[0].unitPriceCents).toBe(8_000);
  });

  it("charges full price once the discount has expired", async () => {
    const product = await seedProduct(db, { slug: "expired-prod" });
    await db.update(schema.products).set({ discountPercent: 50, discountEndsAt: past() }).where(eq(schema.products.id, product.id));
    await db.insert(schema.productVariants).values({ productId: product.id, name: "Default", priceCents: 4_000 });
    const detail = await call(catalog.products.get, { slug: "expired-prod" }, { context: { headers: new Headers() } });
    expect(detail.discountPercent).toBe(0);
    expect(detail.variants[0].salePriceCents).toBe(4_000);
  });
});
