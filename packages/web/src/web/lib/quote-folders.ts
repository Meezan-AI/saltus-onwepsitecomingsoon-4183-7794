/** Quotes are filed in one folder per client: the company if there is one, otherwise the person. */
export function quoteFolderName(q: { company?: string | null; customerName: string }): string {
  return (q.company?.trim() || q.customerName.trim()).replace(/\s+/g, " ");
}

export function quoteFolderKey(q: { company?: string | null; customerName: string }): string {
  return quoteFolderName(q).toLowerCase();
}
