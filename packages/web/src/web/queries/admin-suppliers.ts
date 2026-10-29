import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useAdminSuppliers() {
  return useQuery(orpc.admin.suppliers.list.queryOptions());
}

export function useAdminSupplier(id: number | undefined) {
  return useQuery(orpc.admin.suppliers.get.queryOptions({ input: { id: id ?? 0 }, enabled: Boolean(id) }));
}

export function useSupplierLinksForProduct(productId: number | undefined) {
  return useQuery(
    orpc.admin.suppliers.linksForProduct.queryOptions({ input: { productId: productId ?? 0 }, enabled: Boolean(productId) }),
  );
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.suppliers.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.suppliers.key() }),
    }),
  );
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.suppliers.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.suppliers.key() }),
    }),
  );
}

export function useSetSupplierActive() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.suppliers.setActive.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.suppliers.key() }),
    }),
  );
}

export function useLinkSupplierProduct() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.suppliers.linkProduct.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.suppliers.key() }),
    }),
  );
}

export function useUpdateSupplierLink() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.suppliers.updateLink.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.suppliers.key() }),
    }),
  );
}

export function useUnlinkSupplierProduct() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.suppliers.unlinkProduct.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.suppliers.key() }),
    }),
  );
}
