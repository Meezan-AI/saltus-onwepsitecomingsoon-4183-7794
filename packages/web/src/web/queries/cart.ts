import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "../lib/api";
import { useSession } from "./account";

/** One cart per signed-in customer — report section 3/6. Not fetched for anonymous visitors. */
export function useCart() {
  const { data: session } = useSession();
  return useQuery(orpc.cart.get.queryOptions({ enabled: Boolean(session) }));
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.cart.addItem.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.cart.key() }),
    }),
  );
}

export function useUpdateCartItemQty() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.cart.updateItemQty.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.cart.key() }),
    }),
  );
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.cart.removeItem.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.cart.key() }),
    }),
  );
}

export function useSetCartItemDesign() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.cart.setItemDesign.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.cart.key() }),
    }),
  );
}

/**
 * Uploads design / reference files for a cart line straight to private storage and
 * resolves with their metadata. Nothing is attached to the cart item until
 * cart.setItemDesign is called (done when the customer places the order).
 */
export function useUploadCartDesignFiles() {
  return useMutation({
    mutationFn: async ({ cartItemId, files }: { cartItemId: number; files: File[] }) =>
      Promise.all(
        files.map(async (file) => {
          const { url, key } = await client.uploads.presignCartDesignFile({
            cartItemId,
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          });
          const putRes = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
          if (!putRes.ok) throw new Error("Upload failed");
          return { s3Key: key, fileName: file.name, mimeType: file.type, sizeBytes: file.size };
        }),
      ),
  });
}
