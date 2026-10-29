import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export const RFQ_STATUSES = ["new", "quoted", "accepted", "declined", "expired"] as const;
export type RfqStatus = (typeof RFQ_STATUSES)[number];

export function useAdminRfqs(status?: RfqStatus) {
  return useQuery(orpc.admin.rfqs.list.queryOptions({ input: { status } }));
}

export function useAdminRfq(id: number | undefined) {
  return useQuery(orpc.admin.rfqs.get.queryOptions({ input: { id: id ?? 0 }, enabled: Boolean(id) }));
}

export function useQuoteRfq() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.rfqs.quote.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.rfqs.key() }),
    }),
  );
}

export function useDeclineRfq() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.rfqs.decline.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.rfqs.key() }),
    }),
  );
}
