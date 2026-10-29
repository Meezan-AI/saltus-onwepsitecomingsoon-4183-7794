import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "../lib/api";

export function useDesignFiles(orderItemId: number | undefined) {
  return useQuery(
    orpc.designs.listForItem.queryOptions({
      input: { orderItemId: orderItemId ?? 0 },
      enabled: Boolean(orderItemId),
    }),
  );
}

export function useDesignFileUrl() {
  return useMutation(orpc.uploads.designFileUrl.mutationOptions());
}

/**
 * Uploads one or more design files for an order item in one submission (same version,
 * reviewed together — e.g. a t-shirt's front + back artwork). Presigns each file to
 * Tigris directly, PUTs the bytes there, then records the batch via designs.submit.
 */
export function useUploadDesignFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, files }: { orderItemId: number; files: File[] }) => {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const { url, key } = await client.uploads.presignDesignFile({
            orderItemId,
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          });
          const putRes = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
          if (!putRes.ok) throw new Error("Upload failed");
          return { s3Key: key, fileName: file.name, mimeType: file.type, sizeBytes: file.size };
        }),
      );
      return client.designs.submit({ orderItemId, files: uploaded });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.designs.key() });
      queryClient.invalidateQueries({ queryKey: orpc.orders.key() });
    },
  });
}
