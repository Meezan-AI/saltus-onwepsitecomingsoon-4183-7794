import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2, ShieldAlert } from "lucide-react";
import { useMe, useMyPermissions, useSession } from "../../queries/account";

/**
 * Gates every /admin/* page behind a signed-in session AND `role === "admin"`
 * (the same coarse check `adminOnly` uses server-side). Pass `permission` to
 * also require a specific RBAC permission key (see services/permissions.ts) —
 * screens like /admin/roles need `manage_admins` even though the viewer
 * already cleared the coarse admin check. This is UI convenience only; the
 * server re-checks everything on every call regardless of what this renders.
 */
export function AdminProtectedRoute({ children, permission }: { children: ReactNode; permission?: string }) {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: me, isPending: mePending } = useMe();
  const { data: permissions, isPending: permissionsPending } = useMyPermissions();
  const [, navigate] = useLocation();

  const resolving = sessionPending || (Boolean(session) && mePending);

  useEffect(() => {
    if (!resolving && !session) {
      navigate("/admin/login", { replace: true });
    }
  }, [resolving, session, navigate]);

  if (resolving || !session) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[#0b1f3a]">
        <Loader2 size={32} className="animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (me?.role !== "admin") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center gap-3 bg-[#0b1f3a] px-6 text-center">
        <ShieldAlert size={36} className="text-[#FF6B00]" />
        <h1 className="font-display text-xl font-bold text-white">Admin access required</h1>
        <p className="max-w-sm text-sm text-[#B9C2D0]">This account doesn't have admin access to Saltus ONE.</p>
      </div>
    );
  }

  if (permission && !permissionsPending && !(permissions ?? []).includes(permission)) {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center gap-3 bg-[#0b1f3a] px-6 text-center">
        <ShieldAlert size={36} className="text-[#FF6B00]" />
        <h1 className="font-display text-xl font-bold text-white">Restricted</h1>
        <p className="max-w-sm text-sm text-[#B9C2D0]">
          Your admin role doesn't include the "{permission}" permission. Ask a super admin to grant it.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
