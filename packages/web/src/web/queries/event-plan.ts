import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import type { AppRouterClient } from "../../api";

/** One checklist item of the planner, as served to the storefront. */
export type PlannerItem = Awaited<ReturnType<AppRouterClient["eventPlan"]["catalog"]>>[number];

export function useEventPlanCatalog() {
  return useQuery(orpc.eventPlan.catalog.queryOptions({ staleTime: 60_000 }));
}

export function useSubmitEventPlan() {
  return useMutation(orpc.eventPlan.submit.mutationOptions());
}
