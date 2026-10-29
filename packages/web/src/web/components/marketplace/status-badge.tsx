type Tone = "neutral" | "warning" | "success" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-white/15 bg-white/10 text-white/80",
  warning: "border-[#FF6B00]/30 bg-[#FF6B00]/15 text-[#FF8A3D]",
  success: "border-[#2ECC71]/30 bg-[#2ECC71]/15 text-[#6FE3A8]",
  danger: "border-[#FF4D4D]/30 bg-[#FF4D4D]/15 text-[#FF8A8A]",
};

const ORDER_STATUS_TONE: Record<string, Tone> = {
  design_pending: "warning",
  design_in_review: "warning",
  design_approved: "success",
  payment_pending: "warning",
  payment_confirmed: "success",
  in_fulfillment: "warning",
  ready_for_pickup: "success",
  out_for_delivery: "success",
  completed: "success",
  cancelled: "danger",
  refunded: "danger",
};

const RFQ_STATUS_TONE: Record<string, Tone> = {
  new: "neutral",
  quoted: "warning",
  accepted: "success",
  declined: "danger",
  expired: "danger",
};

const DESIGN_STATUS_TONE: Record<string, Tone> = {
  pending_upload: "neutral",
  submitted: "warning",
  in_review: "warning",
  approved: "success",
  changes_requested: "danger",
  not_required: "neutral",
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}

export function orderStatusTone(status: string): Tone {
  return ORDER_STATUS_TONE[status] ?? "neutral";
}

export function rfqStatusTone(status: string): Tone {
  return RFQ_STATUS_TONE[status] ?? "neutral";
}

export function designStatusTone(status: string): Tone {
  return DESIGN_STATUS_TONE[status] ?? "neutral";
}
