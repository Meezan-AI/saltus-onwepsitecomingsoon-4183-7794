import { useMutation } from "@tanstack/react-query";
import { orpc } from "../lib/api";

// Data hooks live here, one file per feature — each wraps its query/mutation
// options so components just call the hook.
export function useCreateLead() {
  return useMutation(orpc.leads.create.mutationOptions());
}
