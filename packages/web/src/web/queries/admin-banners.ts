import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "../lib/api";

export function useAdminBanners() {
  return useQuery(orpc.admin.banners.list.queryOptions());
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: orpc.admin.banners.key() });
    qc.invalidateQueries({ queryKey: orpc.catalog.banners.key() });
  };
}

export function useCreateBanner() {
  const invalidate = useInvalidate();
  return useMutation(orpc.admin.banners.create.mutationOptions({ onSuccess: invalidate }));
}

export function useUpdateBanner() {
  const invalidate = useInvalidate();
  return useMutation(orpc.admin.banners.update.mutationOptions({ onSuccess: invalidate }));
}

export function useRemoveBanner() {
  const invalidate = useInvalidate();
  return useMutation(orpc.admin.banners.remove.mutationOptions({ onSuccess: invalidate }));
}

export function useMoveBanner() {
  const invalidate = useInvalidate();
  return useMutation(orpc.admin.banners.move.mutationOptions({ onSuccess: invalidate }));
}

/** Presigns to storage and PUTs the file directly; resolves to the object key to save as the slide image. */
export function useUploadBannerImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const { url, key } = await client.uploads.presignProductImage({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });
      const res = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!res.ok) throw new Error("Upload failed");
      return { key, previewUrl: URL.createObjectURL(file) };
    },
  });
}
