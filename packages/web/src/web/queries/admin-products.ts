import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "../lib/api";

export function useAdminProducts() {
  return useQuery(orpc.admin.products.list.queryOptions());
}

export function useAdminProduct(id: number | undefined) {
  return useQuery(orpc.admin.products.get.queryOptions({ input: { id: id ?? 0 }, enabled: Boolean(id) }));
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.products.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.products.key() }),
    }),
  );
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.products.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.products.key() }),
    }),
  );
}

export function useSetProductActive() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.products.setActive.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.products.key() }),
    }),
  );
}

export function useAddProductImage() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.products.images.add.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.products.key() }),
    }),
  );
}

/** Presigns to Tigris, PUTs the file directly, then records it against the product. Public product photo. */
export function useUploadProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, file }: { productId: number; file: File }) => {
      const { url, key } = await client.uploads.presignProductImage({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });
      const putRes = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!putRes.ok) throw new Error("Upload failed");
      return client.admin.products.images.add({ productId, s3Key: key });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.products.key() }),
  });
}

export function useRemoveProductImage() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.products.images.remove.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.products.key() }),
    }),
  );
}

export function useAddProductVariant() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.products.variants.add.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.products.key() }),
    }),
  );
}

export function useUpdateProductVariant() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.products.variants.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.products.key() }),
    }),
  );
}

export function useRemoveProductVariant() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.products.variants.remove.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.products.key() }),
    }),
  );
}
