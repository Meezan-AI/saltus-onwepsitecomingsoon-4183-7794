/** Money is stored in the smallest currency subunit (fils for JOD, 1000/dinar) across the whole schema. */
export function formatCents(cents: number | null | undefined, currency = "JOD"): string {
  if (cents == null) return "—";
  return `${(cents / 1000).toFixed(3)} ${currency}`;
}

export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function titleCase(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type BadgeVariant = "neutral" | "orange" | "green" | "red" | "blue" | "yellow";

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  design_pending: "neutral",
  design_in_review: "blue",
  design_approved: "green",
  payment_pending: "yellow",
  payment_confirmed: "green",
  in_fulfillment: "blue",
  ready_for_pickup: "orange",
  out_for_delivery: "orange",
  completed: "green",
  cancelled: "red",
  refunded: "red",
  new: "blue",
  quoted: "orange",
  accepted: "green",
  declined: "red",
  expired: "neutral",
  submitted: "blue",
  in_review: "blue",
  approved: "green",
  changes_requested: "red",
  not_required: "neutral",
  pending_upload: "neutral",
  paid: "green",
  pending: "yellow",
  failed: "red",
  awaiting_confirmation: "yellow",
};

export function statusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] ?? "neutral";
}
