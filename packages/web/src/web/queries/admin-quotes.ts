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

export function useMarkQuoteSent() {
  const invalidate = useInvalidate();
  return useMutation(orpc.admin.quotes.markSent.mutationOptions({ onSuccess: invalidate }));
}

export function useSendQuoteEmail() {
  const invalidate = useInvalidate();
  return useMutation(orpc.admin.quotes.sendEmail.mutationOptions({ onSuccess: invalidate }));
}

export function usePublicQuote(token: string) {
  return useQuery(orpc.publicQuote.get.queryOptions({ input: { token }, retry: false }));
}
