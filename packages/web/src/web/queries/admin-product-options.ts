import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useProductOptions(productId: number | undefined) {
  return useQuery(
    orpc.admin.productOptions.forProduct.queryOptions({ input: { productId: productId ?? 0 }, enabled: Boolean(productId) }),
  );
}

export function useCreateOptionGroup() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.productOptions.groups.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.productOptions.key() }),
    }),
  );
}

export function useUpdateOptionGroup() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.productOptions.groups.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.productOptions.key() }),
    }),
  );
}

export function useRemoveOptionGroup() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.productOptions.groups.remove.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.productOptions.key() }),
    }),
  );
}

export function useCreateOptionValue() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.productOptions.values.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.productOptions.key() }),
    }),
  );
}

export function useUpdateOptionValue() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.productOptions.values.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.productOptions.key() }),
    }),
  );
}

export function useRemoveOptionValue() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.productOptions.values.remove.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.productOptions.key() }),
    }),
  );
}
