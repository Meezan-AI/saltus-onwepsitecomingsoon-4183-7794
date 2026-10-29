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
const { seedUser } = await import("../../../database/test-helpers");
const { roles } = await import("./roles");
const { sessionHeaders } = await import("./test-auth-helpers");

/** An admin (`user.role === "admin"`, passes `adminOnly`) who additionally holds `roleName`. */
async function adminWithRole(roleName: "super_admin" | "staff") {
  const admin = await seedUser(db, { role: "admin" });
  const [role] = await db.select().from(schema.roles).where(eq(schema.roles.name, roleName));
  await db.insert(schema.userRoles).values({ userId: admin.id, roleId: role.id });
  return admin;
}

describe("admin/roles (report item 9 — RBAC)", () => {
  it("permissions.list exposes the seeded catalog to any admin", async () => {
    const admin = await seedUser(db, { role: "admin" }); // no role assigned at all
    const headers = sessionHeaders(admin);
    const list = await call(roles.permissions.list, undefined, { context: { headers } });
    expect(list.length).toBe(9);
  });

  it("create/update/setPermissions require the manage_admins permission, not just adminOnly", async () => {
    const plainAdmin = await seedUser(db, { role: "admin" }); // adminOnly passes, but holds no role/permission
    const headers = sessionHeaders(plainAdmin);

    await expect(
      call(roles.create, { name: "warehouse_lead" }, { context: { headers } }),
    ).rejects.toThrow(ORPCError);
  });

  it("super_admin (holds manage_admins) can create a role and set its permissions", async () => {
    const admin = await adminWithRole("super_admin");
    const headers = sessionHeaders(admin);

    const created = await call(roles.create, { name: "warehouse_lead", descriptionEn: "Warehouse lead" }, { context: { headers } });
    expect(created.isSystem).toBe(false);

    const [ordersPerm] = await db.select().from(schema.permissions).where(eq(schema.permissions.key, "manage_orders"));
    await call(roles.setPermissions, { roleId: created.id, permissionIds: [ordersPerm.id] }, { context: { headers } });

    const loaded = await call(roles.get, { id: created.id }, { context: { headers } });
    expect(loaded.permissions.map((p) => p.key)).toEqual(["manage_orders"]);
  });

  it("remove refuses a built-in (is_system) role", async () => {
    const admin = await adminWithRole("super_admin");
    const headers = sessionHeaders(admin);
    const [staffRole] = await db.select().from(schema.roles).where(eq(schema.roles.name, "staff"));

    await expect(call(roles.remove, { id: staffRole.id }, { context: { headers } })).rejects.toThrow(ORPCError);
  });

  it("users.assignRole rejects assigning the same role twice", async () => {
    const admin = await adminWithRole("super_admin");
    const headers = sessionHeaders(admin);
    const target = await seedUser(db, { role: "admin" });
    const [staffRole] = await db.select().from(schema.roles).where(eq(schema.roles.name, "staff"));

    await call(roles.users.assignRole, { userId: target.id, roleId: staffRole.id }, { context: { headers } });
    await expect(
      call(roles.users.assignRole, { userId: target.id, roleId: staffRole.id }, { context: { headers } }),
    ).rejects.toThrow(ORPCError);

    const assigned = await call(roles.users.listForUser, { userId: target.id }, { context: { headers } });
    expect(assigned.length).toBe(1);

    await call(roles.users.unassignRole, { userId: target.id, roleId: staffRole.id }, { context: { headers } });
    const afterUnassign = await call(roles.users.listForUser, { userId: target.id }, { context: { headers } });
    expect(afterUnassign.length).toBe(0);
  });
});
