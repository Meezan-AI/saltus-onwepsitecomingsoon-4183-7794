import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useAdminCustomers() {
  return useQuery(orpc.admin.customers.list.queryOptions());
}

export function useAdminCustomerOrders(userId: string | undefined) {
  return useQuery(
    orpc.admin.customers.orders.queryOptions({ input: { userId: userId ?? "" }, enabled: Boolean(userId) }),
  );
}
