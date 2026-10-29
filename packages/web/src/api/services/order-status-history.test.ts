import { describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("../database", async () => {
  const { createTestDb } = await import("../database/test-helpers");
  const { db } = await createTestDb();
  return { db };
});

const { db } = await import("../database");
import * as schema from "../database/schema";
import { recordOrderStatusChange } from "./order-status-history";
import { seedUser, seedOrder } from "../database/test-helpers";

describe("order-status-history service (report item 8)", () => {
  it("writes a row with the given from/to status and changedBy", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const customer = await seedUser(db);
    const order = await seedOrder(db, customer.id);

    await recordOrderStatusChange({
      orderId: order.id,
      fromStatus: "design_pending",
      toStatus: "design_in_review",
      changedBy: admin.id,
      note: "First design file submitted",
    });

    const rows = await db.select().from(schema.orderStatusHistory).where(eq(schema.orderStatusHistory.orderId, order.id));
    expect(rows.length).toBe(1);
    expect(rows[0]).toMatchObject({
      fromStatus: "design_pending",
      toStatus: "design_in_review",
      changedBy: admin.id,
      note: "First design file submitted",
    });
  });

  it("allows fromStatus: null (order-created entry) and changedBy: null (system change)", async () => {
    const customer = await seedUser(db);
    const order = await seedOrder(db, customer.id);

    await recordOrderStatusChange({ orderId: order.id, fromStatus: null, toStatus: "design_pending", changedBy: null, note: "Order created at checkout" });

    const [row] = await db.select().from(schema.orderStatusHistory).where(eq(schema.orderStatusHistory.orderId, order.id));
    expect(row.fromStatus).toBeNull();
    expect(row.changedBy).toBeNull();
  });

  it("does not touch orders.status itself — only logs", async () => {
    const customer = await seedUser(db);
    const order = await seedOrder(db, customer.id, { status: "design_pending" });

    await recordOrderStatusChange({ orderId: order.id, fromStatus: "design_pending", toStatus: "payment_confirmed", changedBy: null });

    const [reloaded] = await db.select().from(schema.orders).where(eq(schema.orders.id, order.id));
    expect(reloaded.status).toBe("design_pending"); // unchanged by the history write
  });
});
