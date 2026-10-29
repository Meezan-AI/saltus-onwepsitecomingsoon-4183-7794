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
const { seedUser } = await import("../../database/test-helpers");
const { account } = await import("./account");
const { sessionHeaders } = await import("./admin/test-auth-helpers");

describe("account (myPermissions — report item 9 RBAC)", () => {
  it("returns an empty list for a plain customer", async () => {
    const customer = await seedUser(db, { role: "customer" });
    const result = await call(account.myPermissions, undefined, { context: { headers: sessionHeaders(customer) } });
    expect(result).toEqual([]);
  });

  it("returns an empty list for an admin holding no role", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const result = await call(account.myPermissions, undefined, { context: { headers: sessionHeaders(admin) } });
    expect(result).toEqual([]);
  });

  it("returns every permission key granted by the admin's assigned role", async () => {
    const admin = await seedUser(db, { role: "admin" });
    const [staffRole] = await db.select().from(schema.roles).where(eq(schema.roles.name, "staff"));
    await db.insert(schema.userRoles).values({ userId: admin.id, roleId: staffRole.id });

    const result = await call(account.myPermissions, undefined, { context: { headers: sessionHeaders(admin) } });
    expect(result).toContain("manage_orders");
    expect(result).not.toContain("manage_admins");
  });
});
