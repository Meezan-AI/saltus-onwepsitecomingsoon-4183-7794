import { useQuery } from "@tanstack/react-query";
import { authClient } from "../lib/auth";
import { orpc } from "../lib/api";

/** Reactive Better Auth session — updates on sign-in/sign-out with no reload. */
export function useSession() {
  return authClient.useSession();
}

/** The signed-in user's own marketplace profile (role, etc.) — only fetched once a session exists. */
export function useMe() {
  const { data: session } = useSession();
  return useQuery(orpc.account.me.queryOptions({ enabled: Boolean(session) }));
}

/** RBAC permission keys held by the signed-in user — drives admin-UI show/hide, not a security boundary. */
export function useMyPermissions() {
  const { data: session } = useSession();
  return useQuery(orpc.account.myPermissions.queryOptions({ enabled: Boolean(session) }));
}
