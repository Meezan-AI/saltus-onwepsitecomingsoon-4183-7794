import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { auth } from "../auth";

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
