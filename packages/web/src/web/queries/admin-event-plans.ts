import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export const PLAN_STATUSES = ["new", "in_progress", "quoted", "closed"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export function useAdminPlanItems() {
  return useQuery(orpc.admin.eventPlanItems.list.queryOptions());
}

function invalidateItems(qc: ReturnType<typeof useQueryClient>) {
  // The storefront planner reads the same list, so refresh it too.
  qc.invalidateQueries({ queryKey: orpc.admin.eventPlanItems.key() });
  qc.invalidateQueries({ queryKey: orpc.eventPlan.catalog.key() });
}

export function useCreatePlanItem() {
  const qc = useQueryClient();
  return useMutation(orpc.admin.eventPlanItems.create.mutationOptions({ onSuccess: () => invalidateItems(qc) }));
}

export function useUpdatePlanItem() {
  const qc = useQueryClient();
  return useMutation(orpc.admin.eventPlanItems.update.mutationOptions({ onSuccess: () => invalidateItems(qc) }));
}

export function useRemovePlanItem() {
  const qc = useQueryClient();
  return useMutation(orpc.admin.eventPlanItems.remove.mutationOptions({ onSuccess: () => invalidateItems(qc) }));
}

export function useAdminPlans(status?: PlanStatus) {
  return useQuery(orpc.admin.eventPlans.list.queryOptions({ input: { status } }));
}

export function useAdminPlan(id: number | undefined) {
  return useQuery(orpc.admin.eventPlans.get.queryOptions({ input: { id: id ?? 0 }, enabled: Boolean(id) }));
}

export function useSetPlanStatus() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.eventPlans.setStatus.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.eventPlans.key() }),
    }),
  );
}
