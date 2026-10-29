import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import {
  useAdminUsers,
  useAssignRole,
  useCreateRole,
  usePermissionsCatalog,
  useRemoveRole,
  useRole,
  useRoles,
  useRolesForUser,
  useSetRolePermissions,
  useUnassignRole,
} from "../queries/admin-roles";

function RoleEditor({ roleId }: { roleId: number }) {
  const role = useRole(roleId);
  const catalog = usePermissionsCatalog();
  const setPermissions = useSetRolePermissions();
  const removeRole = useRemoveRole();
  const [saved, setSaved] = useState(false);

  if (role.isPending || !role.data || catalog.isPending) {
    return <Loader2 className="animate-spin text-[#FF6B00]" />;
  }

  const grantedIds = new Set(role.data.permissions.map((p) => p.id));

  function toggle(permissionId: number) {
    const next = new Set(grantedIds);
    if (next.has(permissionId)) next.delete(permissionId);
    else next.add(permissionId);
    setPermissions.mutate(
      { roleId, permissionIds: [...next] },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 1500); } },
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{role.data.name}</CardTitle>
            {role.data.isSystem && <Badge variant="orange" className="mt-1">Built-in</Badge>}
          </div>
          {!role.data.isSystem && (
            <button
              type="button"
              onClick={() => removeRole.mutate({ id: roleId })}
              className="text-white/40 hover:text-red-300"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {catalog.data?.map((perm) => (
            <label key={perm.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/80">
              <Checkbox checked={grantedIds.has(perm.id)} onChange={() => toggle(perm.id)} />
              {perm.key}
            </label>
          ))}
        </div>
        {saved && <p className="mt-3 text-xs font-semibold text-emerald-300">Saved</p>}
      </CardContent>
    </Card>
  );
}

function AdminUsersSection() {
  const users = useAdminUsers();
  const roles = useRoles();
  const [selectedUserId, setSelectedUserId] = useState("");
  const userRoles = useRolesForUser(selectedUserId || undefined);
  const assign = useAssignRole();
  const unassign = useUnassignRole();
  const [roleToAssign, setRoleToAssign] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-64">
          <option value="">Choose an admin user…</option>
          {users.data?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </Select>

        {selectedUserId && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {userRoles.data?.map((ur) => (
                <Badge key={ur.id} variant="orange" className="cursor-pointer" onClick={() => unassign.mutate({ userId: selectedUserId, roleId: ur.role.id })}>
                  {ur.role.name} ×
                </Badge>
              ))}
              {!userRoles.data?.length && <p className="text-sm text-white/40">No roles assigned yet.</p>}
            </div>
            <div className="flex items-end gap-2">
              <Select value={roleToAssign} onChange={(e) => setRoleToAssign(e.target.value)} className="w-56">
                <option value="">Choose a role…</option>
                {roles.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                disabled={!roleToAssign || assign.isPending}
                onClick={() => assign.mutate({ userId: selectedUserId, roleId: Number(roleToAssign) }, { onSuccess: () => setRoleToAssign("") })}
                className="flex items-center gap-1 rounded-full bg-[#FF6B00] px-3 py-2 text-xs font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
              >
                <Plus size={13} /> Assign
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RolesContent() {
  const roles = useRoles();
  const create = useCreateRole();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");

  return (
    <AdminLayout title="Roles & Permissions">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.isPending ? (
              <Loader2 className="animate-spin text-[#FF6B00]" />
            ) : (
              roles.data?.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selectedRoleId === r.id ? "bg-[#FF6B00]/15 text-[#FF8A3D]" : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  {r.name}
                  {r.isSystem && <Badge variant="neutral">Built-in</Badge>}
                </button>
              ))
            )}

            <div className="flex items-end gap-2 border-t border-white/10 pt-3">
              <Input placeholder="New role name" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 text-xs" />
              <button
                type="button"
                disabled={!newName || create.isPending}
                onClick={() => create.mutate({ name: newName }, { onSuccess: (r) => { setNewName(""); setSelectedRoleId(r.id); } })}
                className="flex shrink-0 items-center gap-1 rounded-full bg-[#FF6B00] px-3 py-2 text-xs font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
              >
                <Plus size={13} />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {selectedRoleId ? <RoleEditor roleId={selectedRoleId} /> : (
            <Card>
              <CardContent className="text-sm text-[#B9C2D0]">Select a role to edit its permissions.</CardContent>
            </Card>
          )}
          <AdminUsersSection />
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminRolesPage() {
  useEffect(() => {
    document.title = "Roles & Permissions — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute permission="manage_admins">
      <RolesContent />
    </AdminProtectedRoute>
  );
}
