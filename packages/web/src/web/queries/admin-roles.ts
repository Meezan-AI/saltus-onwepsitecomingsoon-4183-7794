import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function usePermissionsCatalog() {
  return useQuery(orpc.admin.roles.permissions.list.queryOptions());
}

export function useRoles() {
  return useQuery(orpc.admin.roles.list.queryOptions());
}

export function useRole(id: number | undefined) {
  return useQuery(orpc.admin.roles.get.queryOptions({ input: { id: id ?? 0 }, enabled: Boolean(id) }));
}

export function useAdminUsers() {
  return useQuery(orpc.admin.roles.users.list.queryOptions());
}

export function useRolesForUser(userId: string | undefined) {
  return useQuery(
    orpc.admin.roles.users.listForUser.queryOptions({ input: { userId: userId ?? "" }, enabled: Boolean(userId) }),
  );
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.roles.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.roles.key() }),
    }),
  );
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.roles.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.roles.key() }),
    }),
  );
}

export function useRemoveRole() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.roles.remove.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.roles.key() }),
    }),
  );
}

export function useSetRolePermissions() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.roles.setPermissions.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.roles.key() }),
    }),
  );
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.roles.users.assignRole.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.roles.key() }),
    }),
  );
}

export function useUnassignRole() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.roles.users.unassignRole.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.roles.key() }),
    }),
  );
}
