import { z } from "zod";

export const GROUP_KEYS = ["printed", "gifts", "venue", "services"] as const;
export type GroupKey = (typeof GROUP_KEYS)[number];
export const EVENT_TYPES = ["conference", "exhibition", "launch", "meeting", "other"] as const;
export const PLAN_STATUSES = ["new", "in_progress", "quoted", "closed"] as const;

export const specGroupSchema = z.object({
  nameEn: z.string().trim().min(1).max(80),
  nameAr: z.string().trim().min(1).max(80),
  values: z
    .array(z.object({ en: z.string().trim().min(1).max(80), ar: z.string().trim().min(1).max(80) }))
    .min(1)
    .max(30),
});
export type SpecGroup = z.infer<typeof specGroupSchema>;

/** Never throws — a corrupt `specs_json` just means "no spec choices" instead of breaking the planner. */
export function parseSpecs(json: string | null | undefined): SpecGroup[] {
  if (!json) return [];
  try {
    const parsed = z.array(specGroupSchema).safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/** What was ordered, frozen at submit time so later catalog edits never rewrite a customer's request. */
export interface PlanLine {
  itemId: number;
  groupKey: GroupKey;
  nameEn: string;
  nameAr: string;
  variantId: number | null;
  variantName: string | null;
  rentalUnit: string | null;
  qty: number;
  unitEn: string | null;
  unitAr: string | null;
  specs: { nameEn: string; nameAr: string; valueEn: string; valueAr: string }[];
  note: string | null;
  unitCents: number | null;
  multiplier: number;
  totalCents: number | null;
}

export function parseLines(json: string): PlanLine[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as PlanLine[]) : [];
  } catch {
    return [];
  }
}

/** Reference the customer sees and quotes, e.g. EVT-00012. */
export function planReference(id: number) {
  return `EVT-${String(id).padStart(5, "0")}`;
}

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const jod = (cents: number) => `${(cents / 1000).toFixed(3)} JOD`;

const GROUP_LABEL: Record<GroupKey, string> = {
  printed: "Conference printing",
  gifts: "Gifts & promotional items",
  venue: "Venue & exhibition setup",
  services: "Services",
};

export interface PlanEmailInput {
  reference: string;
  request: {
    eventType: string;
    eventName: string | null;
    eventDate: string;
    eventDays: number;
    setupDays: number;
    city: string;
    venue: string | null;
    attendees: number;
    contactName: string;
    company: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    notes: string | null;
    lang: string;
    estimatedTotalCents: number | null;
    unpricedCount: number;
  };
  lines: PlanLine[];
}

function lineText(l: PlanLine) {
  const specs = l.specs.map((s) => `${s.nameEn}: ${s.valueEn}`).join("; ");
  const price = l.totalCents === null ? "REQUIRES QUOTE" : jod(l.totalCents);
  const days = l.multiplier > 1 ? ` x ${l.multiplier} ${l.rentalUnit === "week" ? "weeks" : "days"}` : "";
  return `- ${l.nameEn}${l.variantName ? ` [${l.variantName}]` : ""} | qty ${l.qty}${days}${specs ? ` | ${specs}` : ""}${l.note ? ` | note: ${l.note}` : ""} | ${price}`;
}

/** Plain-text + HTML body of the notification to the Saltus quotes inbox. */
export function buildPlanEmail({ reference, request: r, lines }: PlanEmailInput) {
  const wa = r.contactPhone ? `https://wa.me/${r.contactPhone.replace("+", "")}` : null;
  const header = [
    `Event planner request ${reference}`,
    `Event: ${r.eventType}${r.eventName ? ` — ${r.eventName}` : ""}`,
    `Date: ${r.eventDate} (${r.eventDays} event day(s), ${r.setupDays} setup day(s))`,
    `Location: ${r.city}${r.venue ? ` — ${r.venue}` : ""}`,
    `Attendees: ${r.attendees}`,
    `Contact: ${r.contactName}${r.company ? ` (${r.company})` : ""}`,
    `Phone/WhatsApp: ${r.contactPhone ?? "—"} | Email: ${r.contactEmail ?? "—"} | Language: ${r.lang}`,
  ];
  const textSections = GROUP_KEYS.flatMap((g) => {
    const rows = lines.filter((l) => l.groupKey === g);
    return rows.length ? ["", GROUP_LABEL[g], ...rows.map(lineText)] : [];
  });
  const totals = [
    "",
    r.estimatedTotalCents === null
      ? "No catalog prices apply — everything requires a quote."
      : `Estimated total of priced lines: ${jod(r.estimatedTotalCents)}${r.unpricedCount ? ` (+ ${r.unpricedCount} line(s) requiring a quote)` : ""}`,
    ...(r.notes ? ["", `Notes: ${r.notes}`] : []),
  ];
  const text = [...header, ...textSections, ...totals].join("\n");

  const rowsHtml = (g: GroupKey) =>
    lines
      .filter((l) => l.groupKey === g)
      .map((l) => {
        const specs = l.specs.map((s) => `${esc(s.nameEn)}: ${esc(s.valueEn)}`).join("<br/>");
        const days = l.multiplier > 1 ? ` × ${l.multiplier} ${l.rentalUnit === "week" ? "wk" : "days"}` : "";
        return `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e9f0"><b>${esc(l.nameEn)}</b>${l.variantName ? `<br/>${esc(l.variantName)}` : ""}${specs ? `<br/><span style="color:#64748b">${specs}</span>` : ""}${l.note ? `<br/><i>${esc(l.note)}</i>` : ""}</td><td style="padding:6px 10px;border-bottom:1px solid #e5e9f0;white-space:nowrap">${l.qty}${days}</td><td style="padding:6px 10px;border-bottom:1px solid #e5e9f0;white-space:nowrap">${l.totalCents === null ? '<b style="color:#c2410c">Requires quote</b>' : jod(l.totalCents)}</td></tr>`;
      })
      .join("");
  const sections = GROUP_KEYS.filter((g) => lines.some((l) => l.groupKey === g))
    .map((g) => `<h3 style="margin:18px 0 6px">${GROUP_LABEL[g]}</h3><table style="border-collapse:collapse;font-size:14px;width:100%">${rowsHtml(g)}</table>`)
    .join("");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0b1f3a;max-width:720px">
    <h2 style="margin:0 0 4px">Event planner request ${reference}</h2>
    <p style="margin:0 0 12px;color:#64748b">Submitted via saltus-one.com — language: ${esc(r.lang)}</p>
    <p style="line-height:1.7"><b>Event:</b> ${esc(r.eventType)}${r.eventName ? ` — ${esc(r.eventName)}` : ""}<br/>
    <b>Date:</b> ${esc(r.eventDate)} (${r.eventDays} event day(s), ${r.setupDays} setup day(s))<br/>
    <b>Location:</b> ${esc(r.city)}${r.venue ? ` — ${esc(r.venue)}` : ""}<br/>
    <b>Attendees:</b> ${r.attendees}<br/>
    <b>Contact:</b> ${esc(r.contactName)}${r.company ? ` (${esc(r.company)})` : ""}<br/>
    <b>Phone / WhatsApp:</b> ${wa ? `<a href="${wa}">${esc(r.contactPhone!)}</a>` : "—"}<br/>
    <b>Email:</b> ${r.contactEmail ? `<a href="mailto:${esc(r.contactEmail)}">${esc(r.contactEmail)}</a>` : "—"}</p>
    ${sections}
    <p style="margin-top:16px"><b>${
      r.estimatedTotalCents === null
        ? "Everything requires a quote."
        : `Estimated total of priced lines: ${jod(r.estimatedTotalCents)}${r.unpricedCount ? ` (+ ${r.unpricedCount} line(s) requiring a quote)` : ""}`
    }</b></p>
    ${r.notes ? `<p><b>Notes:</b> ${esc(r.notes)}</p>` : ""}</div>`;
  return { text, html };
}
