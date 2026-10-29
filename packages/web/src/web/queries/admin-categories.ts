import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useAdminCategories() {
  return useQuery(orpc.admin.categories.list.queryOptions());
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.categories.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.categories.key() }),
    }),
  );
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.categories.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.categories.key() }),
    }),
  );
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.categories.delete.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.categories.key() }),
    }),
  );
}
