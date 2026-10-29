import { authed } from "../../middleware/auth";

/**
 * Sign-up / sign-in themselves go straight through Better Auth's own
 * `/api/auth/*` endpoints (see src/web/lib/auth.ts) — this file only exposes
 * the signed-in user's own profile to the rest of the app.
 */
export const account = {
  me: authed.handler(({ context }) => context.user),
};
