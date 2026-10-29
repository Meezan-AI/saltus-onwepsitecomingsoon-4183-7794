import { authed } from "../../middleware/auth";
import { permissionsForUser } from "../../services/permissions";

/**
 * Sign-up / sign-in themselves go straight through Better Auth's own
 * `/api/auth/*` endpoints (see src/web/lib/auth.ts) — this file only exposes
 * the signed-in user's own profile to the rest of the app.
 */
export const account = {
  me: authed.handler(({ context }) => context.user),

  /**
   * RBAC permission keys granted to the signed-in user, across every role
   * they hold (admin dashboard UI only — server routes still enforce their
   * own `requirePermission` checks regardless of what this returns). A
   * "customer" role user always gets an empty list; useful to drive
   * show/hide on admin screens without waiting for a 403.
   */
  myPermissions: authed.handler(({ context }) => permissionsForUser(context.user.id)),
};
