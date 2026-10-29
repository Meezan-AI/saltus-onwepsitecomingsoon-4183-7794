import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useDesignReviewQueue() {
  return useQuery(orpc.admin.designReviews.queue.queryOptions());
}

export function useDesignFilesForItem(orderItemId: number | undefined) {
  return useQuery(
    orpc.admin.designReviews.filesForItem.queryOptions({
      input: { orderItemId: orderItemId ?? 0 },
      enabled: Boolean(orderItemId),
    }),
  );
}

export function useMarkDesignNotRequired() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.designReviews.markNotRequired.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.designReviews.key() }),
    }),
  );
}

export function useReviewDesign() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.designReviews.review.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.designReviews.key() }),
    }),
  );
}
