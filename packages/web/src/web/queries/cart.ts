import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
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
