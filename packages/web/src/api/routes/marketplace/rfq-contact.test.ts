import { describe, it, expect, vi } from "vitest";
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
vi.mock("../../services/email", () => ({ sendEmail: vi.fn(async () => ({ sent: true })) }));

const { db } = await import("../../database");
const { seedUser, seedProduct } = await import("../../database/test-helpers");
const { rfq } = await import("./rfq");
const { rfqs: adminRfqs } = await import("./admin/rfqs");
const { sessionHeaders, adminWithRole } = await import("./admin/test-auth-helpers");
const { sendEmail } = await import("../../services/email");
const { normalizePhone } = await import("../../services/phone");

async function setup() {
  const customer = await seedUser(db);
  const product = await seedProduct(db);
  return { product, headers: sessionHeaders(customer) };
}

describe("normalizePhone", () => {
  it("normalises Jordanian and international formats to E.164", () => {
    expect(normalizePhone("079 588 1811")).toBe("+962795881811");
    expect(normalizePhone("795881811")).toBe("+962795881811");
    expect(normalizePhone("+962 79 588 1811")).toBe("+962795881811");
    expect(normalizePhone("00962795881811")).toBe("+962795881811");
    expect(normalizePhone("962795881811")).toBe("+962795881811");
    expect(normalizePhone("+44 7700 900123")).toBe("+447700900123");
  });
  it("rejects garbage", () => {
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("0212345")).toBeNull();
  });
});

describe("rfq.create contact details", () => {
  it("requires an email or a WhatsApp number", async () => {
    const c = await setup();
    await expect(
      call(rfq.create, { productId: c.product.id, qty: 1 }, { context: { headers: c.headers } }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      call(rfq.create, { productId: c.product.id, qty: 1, contactEmail: "", contactWhatsapp: "" }, { context: { headers: c.headers } }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an invalid WhatsApp number", async () => {
    const c = await setup();
    await expect(
      call(rfq.create, { productId: c.product.id, qty: 1, contactWhatsapp: "not a number" }, { context: { headers: c.headers } }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an invalid email", async () => {
    const c = await setup();
    await expect(
      call(rfq.create, { productId: c.product.id, qty: 1, contactEmail: "nope" }, { context: { headers: c.headers } }),
    ).rejects.toThrow();
  });

  it("stores a normalised WhatsApp number and lowercased email, and notifies Saltus", async () => {
    const c = await setup();
    const created = await call(
      rfq.create,
      { productId: c.product.id, qty: 3, contactEmail: "Buyer@Example.com", contactWhatsapp: "079 123 4567" },
      { context: { headers: c.headers } },
    );
    expect(created).toMatchObject({ contactEmail: "buyer@example.com", contactWhatsapp: "+962791234567" });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining(`RFQ-${created.id}`), replyTo: "buyer@example.com" }),
    );

    const mine = await call(rfq.get, { id: created.id }, { context: { headers: c.headers } });
    expect(mine.contactWhatsapp).toBe("+962791234567");
  });

  it("accepts WhatsApp only, and returns the contact to the admin", async () => {
    const c = await setup();
    const created = await call(
      rfq.create,
      { productId: c.product.id, qty: 1, contactWhatsapp: "+962795881811" },
      { context: { headers: c.headers } },
    );
    expect(created.contactEmail).toBeNull();
    const admin = await adminWithRole(db, "manager");
    const detail = await call(adminRfqs.get, { id: created.id }, { context: { headers: sessionHeaders(admin) } });
    expect(detail).toMatchObject({ contactWhatsapp: "+962795881811", contactEmail: null });
  });
});
