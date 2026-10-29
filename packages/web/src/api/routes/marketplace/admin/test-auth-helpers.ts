// Test-only helper — builds the fake "logged in as" Headers that the mocked
// `auth.api.getSession` (see each *.test.ts's `vi.mock("../../../auth", ...)`)
// reads to decide who the request is from, so `adminOnly`/`requirePermission`
// run their real logic against a real (test) session user, not a mock bypass.
export function sessionHeaders(user: { id: string; role: string }) {
  return new Headers({ "x-test-session": JSON.stringify({ user }) });
}

/**
 * An admin (`user.role === "admin"`, passes `adminOnly`) who additionally
 * holds the named seeded role (see drizzle/0002_seed_rbac.sql and
 * 0004_seed_business_roles.sql) — e.g. "super_admin", "staff", "manager",
 * "sales", "accounting", "content_editor". Used by every test that needs a
 * specific `requirePermission` check to pass or fail deterministically.
 */
export async function adminWithRole(
  db: Parameters<typeof import("../../../database/test-helpers").seedUser>[0],
  roleName: string,
) {
  const { seedUser } = await import("../../../database/test-helpers");
  const schema = await import("../../../database/schema");
  const { eq } = await import("drizzle-orm");
  const admin = await seedUser(db, { role: "admin" });
  const [role] = await db.select().from(schema.roles).where(eq(schema.roles.name, roleName));
  if (!role) throw new Error(`Role not seeded: ${roleName}`);
  await db.insert(schema.userRoles).values({ userId: admin.id, roleId: role.id });
  return admin;
}
