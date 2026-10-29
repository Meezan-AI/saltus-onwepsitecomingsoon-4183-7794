import { describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";

// `services/permissions.ts` imports `db` from "../database" (the real,
// Turso-backed singleton). Redirect every importer of that exact module to
// a throwaway, fully-migrated in-memory DB instead, so this test never
// touches production data.
vi.mock("../database", async () => {
  const { createTestDb } = await import("../database/test-helpers");
  const { db } = await createTestDb();
  return { db };
});

const { db } = await import("../database");
import * as schema from "../database/schema";
import { userHasPermission, permissionsForUser } from "./permissions";
import { seedUser } from "../database/test-helpers";

describe("permissions service (report item 9)", () => {
  it("userHasPermission is false for a user with no role assigned", async () => {
    const user = await seedUser(db, { role: "admin" });
    expect(await userHasPermission(user.id, "manage_orders")).toBe(false);
  });

  it("userHasPermission is true once the user holds a role granting that permission", async () => {
    const user = await seedUser(db, { role: "admin" });
    const [staffRole] = await db.select().from(schema.roles).where(eq(schema.roles.name, "staff"));
    await db.insert(schema.userRoles).values({ userId: user.id, roleId: staffRole.id });

    expect(await userHasPermission(user.id, "manage_orders")).toBe(true);
    expect(await userHasPermission(user.id, "manage_admins")).toBe(false); // staff doesn't hold this one
  });

  it("permissionsForUser dedupes across multiple roles granting the same permission", async () => {
    const user = await seedUser(db, { role: "admin" });
    const [staffRole] = await db.select().from(schema.roles).where(eq(schema.roles.name, "staff"));
    const [superAdminRole] = await db.select().from(schema.roles).where(eq(schema.roles.name, "super_admin"));
    await db.insert(schema.userRoles).values([
      { userId: user.id, roleId: staffRole.id },
      { userId: user.id, roleId: superAdminRole.id },
    ]);

    const keys = await permissionsForUser(user.id);
    expect(new Set(keys).size).toBe(keys.length); // no duplicates
    expect(keys).toContain("manage_orders"); // granted by both roles, appears once
    expect(keys).toContain("manage_admins"); // only super_admin grants this
  });
});
