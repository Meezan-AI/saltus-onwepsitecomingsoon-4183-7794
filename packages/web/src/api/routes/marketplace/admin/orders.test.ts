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
const { seedUser, seedOrder } = await import("../../../database/test-helpers");
const { orders } = await import("./orders");
const { sessionHeaders } = await import("./test-auth-helpers");

describe("admin/orders — status-history wiring (report item 8)", () => {
  it("updateStatus writes a history row when the status actually changes", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);
    const customer = await seedUser(db);
    const order = await seedOrder(db, customer.id, { status: "design_pending" });

    const updated = await call(orders.updateStatus, { id: order.id, status: "design_in_review", note: "manual move" }, { context: { headers } });
    expect(updated.status).toBe("design_in_review");

    const history = await call(orders.history, { orderId: order.id }, { context: { headers } });
    expect(history.length).toBe(1);
    expect(history[0]).toMatchObject({ fromStatus: "design_pending", toStatus: "design_in_review", note: "manual move" });
    expect(history[0].changedByName).toBe(admin.name);
  });

  it("updateStatus writes no history row when the status is set to its current value", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);
    const customer = await seedUser(db);
    const order = await seedOrder(db, customer.id, { status: "design_pending" });

    await call(orders.updateStatus, { id: order.id, status: "design_pending" }, { context: { headers } });

    const history = await call(orders.history, { orderId: order.id }, { context: { headers } });
    expect(history.length).toBe(0);
  });

  it("confirmPayment advances design_approved -> payment_confirmed and logs it", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);
    const customer = await seedUser(db);
    const order = await seedOrder(db, customer.id, { status: "design_approved" });

    const updated = await call(orders.confirmPayment, { id: order.id, reference: "BANK-123" }, { context: { headers } });
    expect(updated.status).toBe("payment_confirmed");
    expect(updated.paymentStatus).toBe("paid");

    const history = await call(orders.history, { orderId: order.id }, { context: { headers } });
    expect(history.length).toBe(1);
    expect(history[0]).toMatchObject({ fromStatus: "design_approved", toStatus: "payment_confirmed", note: "Manual payment confirmed" });

    const [intent] = await db.select().from(schema.paymentIntents).where(eq(schema.paymentIntents.orderId, order.id));
    expect(intent.provider).toBe("manual");
  });

  it("confirmPayment leaves status untouched (and logs nothing) when order isn't awaiting payment", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const headers = sessionHeaders(admin);
    const customer = await seedUser(db);
    const order = await seedOrder(db, customer.id, { status: "completed" });

    const updated = await call(orders.confirmPayment, { id: order.id }, { context: { headers } });
    expect(updated.status).toBe("completed");

    const history = await call(orders.history, { orderId: order.id }, { context: { headers } });
    expect(history.length).toBe(0);
  });

  it("rejects a non-admin caller", async () => {
    const customer = await seedUser(db, { role: "customer" });
    const headers = sessionHeaders(customer);
    const order = await seedOrder(db, customer.id);

    await expect(
      call(orders.updateStatus, { id: order.id, status: "cancelled" }, { context: { headers } }),
    ).rejects.toThrow(ORPCError);
  });
});
