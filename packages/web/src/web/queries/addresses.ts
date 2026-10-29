import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useSession } from "./account";

export function useAddresses() {
  const { data: session } = useSession();
  return useQuery(orpc.addresses.list.queryOptions({ enabled: Boolean(session) }));
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.addresses.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.addresses.key() }),
    }),
  );
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.addresses.delete.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.addresses.key() }),
    }),
  );
}
