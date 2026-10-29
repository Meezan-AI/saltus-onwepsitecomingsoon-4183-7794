import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { auth } from "../auth";
import { userHasPermission } from "../services/permissions";

/** Optional auth — `context.user` is the session user or null. */
export const withUser = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  return next({
    context: { user: session?.user ?? null, session: session?.session ?? null },
  });
});

/** Protected procedures — rejects unauthenticated calls; `context.user` is non-null. */
export const authed = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED");
  return next({ context: { user: session.user, session: session.session } });
});

/** Admin-only procedures — rejects anyone whose `user.role` isn't "admin". */
export const adminOnly = authed.use(async ({ context, next }) => {
  const role = (context.user as { role?: string | null }).role;
  if (role !== "admin") throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
  return next({ context });
});

/**
 * Finer-grained than `adminOnly` — also requires one of the user's roles (see
 * `database/schema.ts#userRoles`/`rolePermissions`) to grant `key`, e.g.
 * "manage_suppliers". `adminOnly` stays the gate every existing admin route
 * uses; Phase 4's admin routes can adopt `requirePermission` feature-by-feature
 * without changing what already works. New admin users should be assigned a
 * role (see routes/marketplace/admin/roles.ts) or they pass `adminOnly` but
 * fail every `requirePermission` check.
 */
export function requirePermission(key: string) {
  return adminOnly.use(async ({ context, next }) => {
    const granted = await userHasPermission(context.user.id, key);
    if (!granted) throw new ORPCError("FORBIDDEN", { message: `Missing permission: ${key}` });
    return next({ context });
  });
}
