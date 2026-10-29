import { createAuthClient } from "better-auth/react";

/**
 * Marketplace customer/admin auth — plain email/password, no managed
 * Google/Apple/Microsoft login (not requested for this feature).
 *
 * Better Auth's `bearer()` server plugin returns the session token in the
 * `set-auth-token` response header on sign-in/sign-up. We store it ourselves
 * and attach it as `Authorization: Bearer <token>` on every request — both
 * the authClient's own calls (via `fetchOptions`) and the typed oRPC client
 * (via `lib/api.ts`, which reads `getAuthToken()`).
 */
const TOKEN_KEY = "saltus-auth-token";

export function getAuthToken(): string {
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function setAuthToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private mode, etc.) — session just won't persist across reloads.
  }
}

export function clearAuthToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // no-op
  }
}

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/api/auth",
  fetchOptions: {
    auth: { type: "Bearer", token: () => getAuthToken() },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) setAuthToken(token);
    },
  },
});

export async function signOut() {
  await authClient.signOut();
  clearAuthToken();
}
