import { describe, it, expect, vi, beforeEach } from "vitest";
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
const schema = await import("../../database/schema");
const { seedUser, seedProduct } = await import("../../database/test-helpers");
const { eventPlan } = await import("./event-plan");
const { eventPlanItems, eventPlans } = await import("./admin/event-plans");
const { sessionHeaders, adminWithRole } = await import("./admin/test-auth-helpers");
const { sendEmail } = await import("../../services/email");
const { priceLine, rentalMultiplier, summarizeLines } = await import("../../lib/event-plan-pricing");
const { eq } = await import("drizzle-orm");

const anon = { context: { headers: new Headers() } };

async function item(over: Partial<typeof schema.eventPlanItems.$inferInsert> = {}) {
  const [row] = await db
    .insert(schema.eventPlanItems)
    .values({ groupKey: "printed", nameEn: "Item", nameAr: "صنف", qtyMode: "one", ...over })
    .returning();
  return row;
}

async function pricedItem(opts: { price: number; rentalUnit?: string | null; discount?: number; variants?: number[] } = { price: 1000 }) {
  const product = await seedProduct(db);
  if (opts.discount) await db.update(schema.products).set({ discountPercent: opts.discount }).where(eq(schema.products.id, product.id));
  const prices = opts.variants ?? [opts.price];
  const variants = [];
  for (const [i, p] of prices.entries()) {
    const [v] = await db
      .insert(schema.productVariants)
      .values({ productId: product.id, name: `V${i}`, priceCents: p, rentalUnit: opts.rentalUnit ?? null })
      .returning();
    variants.push(v);
  }
  const it = await item({ productId: product.id, nameEn: "Priced" });
  return { it, variants, product };
}

const base = {
  eventType: "conference" as const,
  eventDate: "2027-03-01",
  eventDays: 3,
  setupDays: 1,
  city: "Amman",
  attendees: 200,
  contactName: "Sara Test",
  contactPhone: "079 123 4567",
  lang: "en" as const,
};

beforeEach(() => vi.mocked(sendEmail).mockClear());

describe("pricing rules", () => {
  it("multiplies by days or weeks and leaves other units alone", () => {
    expect(rentalMultiplier("day", 3)).toBe(3);
    expect(rentalMultiplier("week", 8)).toBe(2);
    expect(rentalMultiplier("event", 5)).toBe(1);
    expect(rentalMultiplier(null, 5)).toBe(1);
  });
  it("never invents a price", () => {
    expect(priceLine(null, 5, 2)).toEqual({ unitCents: null, multiplier: 1, totalCents: null });
    expect(priceLine({ salePriceCents: 500, rentalUnit: "day" }, 2, 3).totalCents).toBe(3000);
    const s = summarizeLines([{ totalCents: 100 }, { totalCents: null }]);
    expect(s).toEqual({ estimatedTotalCents: 100, unpricedCount: 1 });
    expect(summarizeLines([{ totalCents: null }]).estimatedTotalCents).toBeNull();
  });
});

describe("eventPlan.catalog", () => {
  it("lists only active items, with catalog prices only for linked products", async () => {
    const { it: linked } = await pricedItem({ price: 2500, discount: 20 });
    const plain = await item({ nameEn: "Plain" });
    const hidden = await item({ nameEn: "Hidden", isActive: false });
    const list = await call(eventPlan.catalog, undefined, anon);
    expect(list.find((i) => i.id === hidden.id)).toBeUndefined();
    expect(list.find((i) => i.id === plain.id)!.variants).toEqual([]);
    expect(list.find((i) => i.id === linked.id)!.variants[0].salePriceCents).toBe(2000);
  });
});

describe("eventPlan.submit", () => {
  it("needs a phone or an email, and rejects a bad phone", async () => {
    const it = await item();
    const line = { itemId: it.id, qty: 1 };
    await expect(call(eventPlan.submit, { ...base, contactPhone: "", lines: [line] }, anon)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(call(eventPlan.submit, { ...base, contactPhone: "abc", lines: [line] }, anon)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects duplicate items and requires an option when there are several", async () => {
    const it = await item();
    await expect(
      call(eventPlan.submit, { ...base, lines: [{ itemId: it.id, qty: 1 }, { itemId: it.id, qty: 2 }] }, anon),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const multi = await pricedItem({ price: 0, variants: [1000, 2000] });
    await expect(call(eventPlan.submit, { ...base, lines: [{ itemId: multi.it.id, qty: 1 }] }, anon)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    const ok = await call(eventPlan.submit, { ...base, lines: [{ itemId: multi.it.id, qty: 2, variantId: multi.variants[1].id }] }, anon);
    expect(ok.estimatedTotalCents).toBe(4000);
  });

  it("prices on the server: unpriced -> null, day rental x event days, discount applied", async () => {
    const plain = await item({ nameEn: "Service", qtyMode: "none", groupKey: "services" });
    const day = await pricedItem({ price: 10000, rentalUnit: "day", discount: 10 });
    const res = await call(
      eventPlan.submit,
      {
        ...base,
        // extra, unknown price fields from a tampering client are simply not part of the contract
        lines: [
          { itemId: plain.id, qty: 99 },
          { itemId: day.it.id, qty: 2, variantId: day.variants[0].id },
        ],
        ...({ estimatedTotalCents: 1 } as object),
      },
      anon,
    );
    // 10000 - 10% = 9000, x2 qty x3 days
    expect(res.estimatedTotalCents).toBe(54000);
    expect(res.unpricedCount).toBe(1);
    expect(res.reference).toMatch(/^EVT-\d{5}$/);

    const [row] = await db.select().from(schema.eventPlanRequests).where(eq(schema.eventPlanRequests.id, res.id));
    const lines = JSON.parse(row.itemsJson);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ qty: 1, totalCents: null }); // service ignores qty
    expect(lines[1]).toMatchObject({ unitCents: 9000, multiplier: 3, totalCents: 54000 });
    expect(row.contactPhone).toBe("+962791234567");
    expect(row.status).toBe("new");
  });

  it("resolves spec picks to names and rejects unknown ones", async () => {
    const it = await item({
      specsJson: JSON.stringify([{ nameEn: "Colour", nameAr: "اللون", values: [{ en: "Black", ar: "أسود" }] }]),
    });
    const res = await call(eventPlan.submit, { ...base, lines: [{ itemId: it.id, qty: 5, specs: [{ group: 0, value: 0 }] }] }, anon);
    const [row] = await db.select().from(schema.eventPlanRequests).where(eq(schema.eventPlanRequests.id, res.id));
    expect(JSON.parse(row.itemsJson)[0].specs).toEqual([{ nameEn: "Colour", nameAr: "اللون", valueEn: "Black", valueAr: "أسود" }]);
    await expect(
      call(eventPlan.submit, { ...base, lines: [{ itemId: it.id, qty: 1, specs: [{ group: 0, value: 9 }] }] }, anon),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("emails the contact desk with the customer as reply-to", async () => {
    const it = await item();
    const res = await call(eventPlan.submit, { ...base, contactEmail: "Buyer@Example.com", lines: [{ itemId: it.id, qty: 1 }] }, anon);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining(res.reference), replyTo: "buyer@example.com" }),
    );
  });

  it("stores nothing when the honeypot is filled", async () => {
    const it = await item();
    const before = (await db.select().from(schema.eventPlanRequests)).length;
    const res = await call(eventPlan.submit, { ...base, website: "http://spam", lines: [{ itemId: it.id, qty: 1 }] }, anon);
    expect(res.id).toBe(0);
    expect((await db.select().from(schema.eventPlanRequests)).length).toBe(before);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("links the request to a logged-in customer", async () => {
    const user = await seedUser(db);
    const it = await item();
    const res = await call(eventPlan.submit, { ...base, lines: [{ itemId: it.id, qty: 1 }] }, { context: { headers: sessionHeaders(user) } });
    const [row] = await db.select().from(schema.eventPlanRequests).where(eq(schema.eventPlanRequests.id, res.id));
    expect(row.userId).toBe(user.id);
  });
});

describe("admin event plans", () => {
  it("lets a manager read plans with their lines and change status; blocks customers", async () => {
    const it = await item();
    const res = await call(eventPlan.submit, { ...base, lines: [{ itemId: it.id, qty: 4 }] }, anon);
    const admin = await adminWithRole(db, "manager");
    const ctx = { context: { headers: sessionHeaders(admin) } };

    const list = await call(eventPlans.list, {}, ctx);
    expect(list.find((p) => p.id === res.id)).toMatchObject({ reference: res.reference, itemCount: 1 });
    const one = await call(eventPlans.get, { id: res.id }, ctx);
    expect(one.lines[0]).toMatchObject({ itemId: it.id, qty: 4 });
    await call(eventPlans.setStatus, { id: res.id, status: "quoted" }, ctx);
    expect((await call(eventPlans.list, { status: "quoted" }, ctx)).some((p) => p.id === res.id)).toBe(true);

    const customer = await seedUser(db);
    await expect(call(eventPlans.list, {}, { context: { headers: sessionHeaders(customer) } })).rejects.toThrow();
  });

  it("lets the admin add, edit and remove checklist items", async () => {
    const admin = await adminWithRole(db, "manager");
    const ctx = { context: { headers: sessionHeaders(admin) } };
    const created = await call(
      eventPlanItems.create,
      { groupKey: "gifts", nameEn: "Totes", nameAr: "حقائب", qtyMode: "attendees", specs: [], isActive: true },
      ctx,
    );
    const updated = await call(
      eventPlanItems.update,
      {
        id: created.id,
        groupKey: "gifts",
        nameEn: "Tote bags",
        nameAr: "حقائب",
        qtyMode: "attendees",
        specs: [{ nameEn: "Colour", nameAr: "اللون", values: [{ en: "Red", ar: "أحمر" }] }],
        isActive: true,
      },
      ctx,
    );
    expect(updated.nameEn).toBe("Tote bags");
    const listed = await call(eventPlanItems.list, undefined, ctx);
    expect(listed.find((i) => i.id === created.id)!.specs).toHaveLength(1);
    await call(eventPlanItems.remove, { id: created.id }, ctx);
    expect((await call(eventPlanItems.list, undefined, ctx)).some((i) => i.id === created.id)).toBe(false);

    const customer = await seedUser(db);
    await expect(call(eventPlanItems.list, undefined, { context: { headers: sessionHeaders(customer) } })).rejects.toThrow();
  });
});
