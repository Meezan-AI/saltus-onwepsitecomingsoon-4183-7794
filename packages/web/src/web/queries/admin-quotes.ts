import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useAdminQuotes() {
  return useQuery(orpc.admin.quotes.list.queryOptions());
}

export function useAdminQuote(id: number | undefined) {
  return useQuery(orpc.admin.quotes.get.queryOptions({ input: { id: id ?? 0 }, enabled: Boolean(id) }));
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: orpc.admin.quotes.key() });
}

export function useCreateQuote() {
  const invalidate = useInvalidate();
  return useMutation(orpc.admin.quotes.create.mutationOptions({ onSuccess: invalidate }));
}

export function useUpdateQuote() {
  const invalidate = useInvalidate();
  return useMutation(orpc.admin.quotes.update.mutationOptions({ onSuccess: invalidate }));
}

export function useRemoveQuote() {
  const invalidate = useInvalidate();
  return useMutation(orpc.admin.quotes.remove.mutationOptions({ onSuccess: invalidate }));
}
