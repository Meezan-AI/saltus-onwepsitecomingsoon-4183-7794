import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export const ORDER_STATUSES = [
  "design_pending",
  "design_in_review",
  "design_approved",
  "payment_pending",
  "payment_confirmed",
  "in_fulfillment",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function useAdminOrders(status?: OrderStatus) {
  return useQuery(orpc.admin.orders.list.queryOptions({ input: { status } }));
}

export function useAdminOrder(id: number | undefined) {
  return useQuery(orpc.admin.orders.get.queryOptions({ input: { id: id ?? 0 }, enabled: Boolean(id) }));
}

export function useAdminOrderHistory(orderId: number | undefined) {
  return useQuery(
    orpc.admin.orders.history.queryOptions({ input: { orderId: orderId ?? 0 }, enabled: Boolean(orderId) }),
  );
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.orders.updateStatus.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.orders.key() }),
    }),
  );
}

export function useConfirmOrderPayment() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.orders.confirmPayment.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.orders.key() }),
    }),
  );
}
