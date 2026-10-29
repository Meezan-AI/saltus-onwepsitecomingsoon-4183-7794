import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useSession } from "./account";

export function useOrders() {
  const { data: session } = useSession();
  return useQuery(orpc.orders.list.queryOptions({ enabled: Boolean(session) }));
}

export function useOrder(orderNumber: string | undefined) {
  return useQuery(
    orpc.orders.get.queryOptions({
      input: { orderNumber: orderNumber ?? "" },
      enabled: Boolean(orderNumber),
    }),
  );
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.orders.checkout.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.cart.key() });
        queryClient.invalidateQueries({ queryKey: orpc.orders.key() });
      },
    }),
  );
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.orders.cancel.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.orders.key() }),
    }),
  );
}
