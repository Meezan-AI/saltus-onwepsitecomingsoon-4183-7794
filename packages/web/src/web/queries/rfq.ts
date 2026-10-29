import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useSession } from "./account";

export function useRfqs() {
  const { data: session } = useSession();
  return useQuery(orpc.rfq.list.queryOptions({ enabled: Boolean(session) }));
}

export function useRfqRequest(id: number | undefined) {
  return useQuery(orpc.rfq.get.queryOptions({ input: { id: id ?? 0 }, enabled: Boolean(id) }));
}

export function useCreateRfq() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.rfq.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.rfq.key() }),
    }),
  );
}

export function useAcceptRfq() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.rfq.accept.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.rfq.key() });
        queryClient.invalidateQueries({ queryKey: orpc.orders.key() });
      },
    }),
  );
}

export function useDeclineRfq() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.rfq.decline.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.rfq.key() }),
    }),
  );
}
