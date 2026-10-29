import { asc, eq, and } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly, requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";

const roleInput = z.object({
  name: z.string().min(1).max(80),
  descriptionEn: z.string().max(500).optional(),
  descriptionAr: z.string().max(500).optional(),
});

/**
 * Admin RBAC — report item 9. `permissions` are seeded by migration (see
 * drizzle/0002_seed_rbac.sql) and read-only here; `roles` are editable
 * bundles of those permissions; `user_roles` assigns roles to admin users.
 * Mutating endpoints require "manage_admins" (see middleware/auth.ts#requirePermission)
 * so an admin without that permission can't grant themselves — or anyone —
 * more access. Reads stay on the broader `adminOnly` gate like every other
 * admin list/get endpoint.
 */
export const roles = {
  permissions: {
    list: adminOnly.handler(() => db.select().from(schema.permissions).orderBy(asc(schema.permissions.key))),
  },

  list: adminOnly.handler(() => db.select().from(schema.roles).orderBy(asc(schema.roles.name))),

  get: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [role] = await db.select().from(schema.roles).where(eq(schema.roles.id, input.id));
    if (!role) throw new ORPCError("NOT_FOUND");
    const perms = await db
      .select({ id: schema.permissions.id, key: schema.permissions.key })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.rolePermissions.roleId, role.id));
    return { ...role, permissions: perms };
  }),

  create: requirePermission("manage_admins")
    .input(roleInput)
    .handler(async ({ input }) => {
      const [role] = await db.insert(schema.roles).values(input).returning();
      return role;
    }),

  update: requirePermission("manage_admins")
    .input(roleInput.partial().extend({ id: z.number() }))
    .handler(async ({ input }) => {
      const { id, ...rest } = input;
      const [role] = await db.update(schema.roles).set(rest).where(eq(schema.roles.id, id)).returning();
      if (!role) throw new ORPCError("NOT_FOUND");
      return role;
    }),

  /** Seeded roles (super_admin, staff) can't be removed — only their permission set changes. */
  remove: requirePermission("manage_admins")
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [role] = await db.select().from(schema.roles).where(eq(schema.roles.id, input.id));
      if (!role) throw new ORPCError("NOT_FOUND");
      if (role.isSystem) throw new ORPCError("BAD_REQUEST", { message: "This role is built-in and can't be removed" });
      await db.delete(schema.roles).where(eq(schema.roles.id, input.id));
      return { ok: true };
    }),

  /** Replaces a role's whole permission set in one call. */
  setPermissions: requirePermission("manage_admins")
    .input(z.object({ roleId: z.number(), permissionIds: z.array(z.number()) }))
    .handler(async ({ input }) => {
      const [role] = await db.select().from(schema.roles).where(eq(schema.roles.id, input.roleId));
      if (!role) throw new ORPCError("NOT_FOUND");
      await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, input.roleId));
      if (input.permissionIds.length) {
        await db
          .insert(schema.rolePermissions)
          .values(input.permissionIds.map((permissionId) => ({ roleId: input.roleId, permissionId })));
      }
      return { ok: true };
    }),

  users: {
    /** Every "admin"-role user, for the role-assignment picker. */
    list: adminOnly.handler(() =>
      db
        .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
        .from(schema.user)
        .where(eq(schema.user.role, "admin"))
        .orderBy(asc(schema.user.name)),
    ),

    /** Roles held by one admin user. */
    listForUser: adminOnly.input(z.object({ userId: z.string() })).handler(({ input }) =>
      db
        .select({ id: schema.userRoles.id, role: schema.roles })
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(eq(schema.userRoles.userId, input.userId)),
    ),

    assignRole: requirePermission("manage_admins")
      .input(z.object({ userId: z.string(), roleId: z.number() }))
      .handler(async ({ context, input }) => {
        const existing = await db
          .select()
          .from(schema.userRoles)
          .where(and(eq(schema.userRoles.userId, input.userId), eq(schema.userRoles.roleId, input.roleId)));
        if (existing.length) throw new ORPCError("BAD_REQUEST", { message: "User already has this role" });
        const [assignment] = await db
          .insert(schema.userRoles)
          .values({ userId: input.userId, roleId: input.roleId, assignedBy: context.user.id })
          .returning();
        return assignment;
      }),

    unassignRole: requirePermission("manage_admins")
      .input(z.object({ userId: z.string(), roleId: z.number() }))
      .handler(async ({ input }) => {
        await db
          .delete(schema.userRoles)
          .where(and(eq(schema.userRoles.userId, input.userId), eq(schema.userRoles.roleId, input.roleId)));
        return { ok: true };
      }),
  },
};
