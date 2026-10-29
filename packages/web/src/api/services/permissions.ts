import { and, eq } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";

/**
 * True if the user holds a role (see `user_roles` → `role_permissions` →
 * `permissions`) that grants `key`. Used by middleware/auth.ts#requirePermission.
 * A user can hold several roles; any one of them granting the permission is enough.
 */
export async function userHasPermission(userId: string, key: string): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.permissions.id })
    .from(schema.userRoles)
    .innerJoin(schema.rolePermissions, eq(schema.userRoles.roleId, schema.rolePermissions.roleId))
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(and(eq(schema.userRoles.userId, userId), eq(schema.permissions.key, key)))
    .limit(1);
  return Boolean(row);
}

/** All permission keys granted to the user across every role they hold. */
export async function permissionsForUser(userId: string): Promise<string[]> {
  const rows = await db
    .select({ key: schema.permissions.key })
    .from(schema.userRoles)
    .innerJoin(schema.rolePermissions, eq(schema.userRoles.roleId, schema.rolePermissions.roleId))
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(eq(schema.userRoles.userId, userId));
  return [...new Set(rows.map((r) => r.key))];
}
