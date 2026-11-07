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
const { cart } = await import("./cart");
const { orders } = await import("./orders");
const { designReviews } = await import("./admin/design-reviews");
const { sessionHeaders } = await import("./admin/test-auth-helpers");

type User = Awaited<ReturnType<typeof seedUser>>;

/** A customer with an address and a cart holding one line per entry in `lines`. */
async function setup(lineCount = 1) {
  const customer = await seedUser(db);
  const [address] = await db
    .insert(schema.addresses)
    .values({ userId: customer.id, recipientName: "Test", phone: "0790000000", city: "Amman", addressLine1: "1 Street" })
    .returning();
  const [myCart] = await db.insert(schema.carts).values({ userId: customer.id }).returning();
  const itemIds: number[] = [];
  for (let i = 0; i < lineCount; i++) {
    const product = await seedProduct(db);
    const [variant] = await db
      .insert(schema.productVariants)
      .values({ productId: product.id, name: "Default", priceCents: 5000 })
      .returning();
    const [item] = await db
      .insert(schema.cartItems)
      .values({ cartId: myCart.id, productId: product.id, variantId: variant.id, qty: 2 })
      .returning();
    itemIds.push(item.id);
  }
  return { customer, address, itemIds, headers: sessionHeaders(customer) };
}

const file = (itemId: number, name = "logo.pdf") => ({
  s3Key: `design-files/cart-${itemId}/123-${name}`,
  fileName: name,
  mimeType: "application/pdf",
  sizeBytes: 100,
});

async function checkoutOne(c: { customer: User; address: { id: number }; headers: Headers }) {
  const [order] = await call(orders.checkout, { deliveryAddressId: c.address.id }, { context: { headers: c.headers } });
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  return { order, items };
}

describe("cart.setItemDesign", () => {
  it("rejects a file key that doesn't belong to this cart item", async () => {
    const c = await setup();
    await expect(
      call(
        cart.setItemDesign,
        { itemId: c.itemIds[0], mode: "own", files: [file(c.itemIds[0] + 999)] },
        { context: { headers: c.headers } },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a brief when asking Saltus to design it", async () => {
    const c = await setup();
    await expect(
      call(cart.setItemDesign, { itemId: c.itemIds[0], mode: "request", brief: "  ", files: [] }, { context: { headers: c.headers } }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns NOT_FOUND for another customer's cart item", async () => {
    const owner = await setup();
    const other = await seedUser(db);
    await expect(
      call(cart.setItemDesign, { itemId: owner.itemIds[0], mode: "later", files: [] }, { context: { headers: sessionHeaders(other) } }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("stores the choice and returns parsed files with the cart", async () => {
    const c = await setup();
    const id = c.itemIds[0];
    const result = await call(
      cart.setItemDesign,
      { itemId: id, mode: "request", brief: " Blue logo on white ", files: [file(id)] },
      { context: { headers: c.headers } },
    );
    expect(result.items[0]).toMatchObject({ designMode: "request", designBrief: "Blue logo on white" });
    expect(result.items[0].designFiles).toHaveLength(1);
  });

  it("drops brief and files when switching to 'none'", async () => {
    const c = await setup();
    const id = c.itemIds[0];
    await call(cart.setItemDesign, { itemId: id, mode: "own", brief: "x", files: [file(id)] }, { context: { headers: c.headers } });
    const result = await call(cart.setItemDesign, { itemId: id, mode: "none", files: [] }, { context: { headers: c.headers } });
    expect(result.items[0]).toMatchObject({ designMode: "none", designBrief: null, designFiles: [] });
  });
});

describe("checkout with design choices", () => {
  it("own design with files → submitted line, files saved as v1, order goes to review", async () => {
    const c = await setup();
    const id = c.itemIds[0];
    await call(cart.setItemDesign, { itemId: id, mode: "own", files: [file(id)] }, { context: { headers: c.headers } });
    const { order, items } = await checkoutOne(c);
    expect(items[0]).toMatchObject({ designStatus: "submitted", designMode: "own" });
    expect(order.status).toBe("design_in_review");
    const files = await db.select().from(schema.designFiles).where(eq(schema.designFiles.orderItemId, items[0].id));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ version: 1, status: "submitted", uploadedBy: c.customer.id });
  });

  it("design request → design_requested line with the brief, order goes to review", async () => {
    const c = await setup();
    await call(cart.setItemDesign, { itemId: c.itemIds[0], mode: "request", brief: "Make a poster", files: [] }, { context: { headers: c.headers } });
    const { order, items } = await checkoutOne(c);
    expect(items[0]).toMatchObject({ designStatus: "design_requested", designMode: "request", designBrief: "Make a poster" });
    expect(order.status).toBe("design_in_review");
  });

  it("no design needed on every line → not_required and order is design_approved", async () => {
    const c = await setup();
    await call(cart.setItemDesign, { itemId: c.itemIds[0], mode: "none", files: [] }, { context: { headers: c.headers } });
    const { order, items } = await checkoutOne(c);
    expect(items[0].designStatus).toBe("not_required");
    expect(order.status).toBe("design_approved");
  });

  it("decide later → pending_upload and order stays design_pending", async () => {
    const c = await setup();
    await call(cart.setItemDesign, { itemId: c.itemIds[0], mode: "later", files: [] }, { context: { headers: c.headers } });
    const { order, items } = await checkoutOne(c);
    expect(items[0].designStatus).toBe("pending_upload");
    expect(order.status).toBe("design_pending");
  });

  it("a cart line with no choice defaults to 'later'", async () => {
    const c = await setup();
    const { order, items } = await checkoutOne(c);
    expect(items[0]).toMatchObject({ designStatus: "pending_upload", designMode: "later" });
    expect(order.status).toBe("design_pending");
  });
});

describe("admin designReviews.completeRequested", () => {
  it("approves the line and advances the order once every line is resolved", async () => {
    const c = await setup(2);
    await call(cart.setItemDesign, { itemId: c.itemIds[0], mode: "request", brief: "Logo please", files: [] }, { context: { headers: c.headers } });
    await call(cart.setItemDesign, { itemId: c.itemIds[1], mode: "none", files: [] }, { context: { headers: c.headers } });
    const { order, items } = await checkoutOne(c);
    const requested = items.find((i) => i.designStatus === "design_requested")!;

    const admin = await seedUser(db, { role: "admin" });
    await call(designReviews.completeRequested, { orderItemId: requested.id }, { context: { headers: sessionHeaders(admin) } });

    const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, requested.id));
    expect(item.designStatus).toBe("approved");
    const [after] = await db.select().from(schema.orders).where(eq(schema.orders.id, order.id));
    expect(after.status).toBe("design_approved");
  });

  it("refuses a line that isn't a design request", async () => {
    const c = await setup();
    await call(cart.setItemDesign, { itemId: c.itemIds[0], mode: "later", files: [] }, { context: { headers: c.headers } });
    const { items } = await checkoutOne(c);
    const admin = await seedUser(db, { role: "admin" });
    await expect(
      call(designReviews.completeRequested, { orderItemId: items[0].id }, { context: { headers: sessionHeaders(admin) } }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("is admin-only", async () => {
    const c = await setup();
    await expect(
      call(designReviews.completeRequested, { orderItemId: 1 }, { context: { headers: c.headers } }),
    ).rejects.toBeTruthy();
  });
});
