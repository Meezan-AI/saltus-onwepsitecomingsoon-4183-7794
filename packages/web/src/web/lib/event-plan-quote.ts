import type { QuoteDocGroup } from "../components/quote-document";
import { titleCase } from "./admin-format";

const GROUP_LABEL: Record<string, string> = {
  printed: "Conference printing",
  gifts: "Gifts & promotional items",
  venue: "Venue & exhibition setup",
  services: "Services",
};

interface PlanLine {
  groupKey: string;
  nameEn: string;
  variantName?: string | null;
  specs: { nameEn: string; valueEn: string }[];
  note?: string | null;
  multiplier: number;
  rentalUnit?: string | null;
  qty: number;
  unitCents: number | null;
  totalCents: number | null;
}

export interface PlanForQuote {
  reference: string;
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
  estimatedTotalCents: number | null;
  unpricedCount: number;
  lines: PlanLine[];
}

/** Maps an event plan (admin or public shape) to the props the shared QuoteDocument renders. */
export function planQuoteProps(r: PlanForQuote) {
  const groups: QuoteDocGroup[] = Object.keys(GROUP_LABEL)
    .filter((g) => r.lines.some((l) => l.groupKey === g))
    .map((g) => ({
      label: GROUP_LABEL[g],
      lines: r.lines
        .filter((l) => l.groupKey === g)
        .map((l) => ({
          name: l.nameEn,
          details: [l.variantName, ...l.specs.map((s) => `${s.nameEn}: ${s.valueEn}`)].filter(Boolean).join(" · "),
          note: [l.note, l.multiplier > 1 ? `× ${l.multiplier} ${l.rentalUnit === "week" ? "weeks" : "days"}` : ""].filter(Boolean).join(" — "),
          qty: l.qty,
          unitCents: l.unitCents,
          totalCents: l.totalCents,
        })),
    }));

  return {
    reference: r.reference,
    client: { name: r.contactName, company: r.company, phone: r.contactPhone, email: r.contactEmail },
    aside: {
      heading: "Event",
      title: `${titleCase(r.eventType)}${r.eventName ? ` — ${r.eventName}` : ""}`,
      rows: [
        `${r.eventDate} · ${r.eventDays} day${r.eventDays > 1 ? "s" : ""}${r.setupDays > 0 ? ` (+${r.setupDays} setup)` : ""}`,
        `${r.city}${r.venue ? ` · ${r.venue}` : ""}`,
        `${r.attendees} expected attendees`,
      ],
    },
    groups,
    totals: { label: "Total (priced items)", subtotalCents: r.estimatedTotalCents ?? 0, totalCents: r.estimatedTotalCents ?? 0, unpricedCount: r.unpricedCount },
    notes: r.notes,
    notesLabel: "Customer notes",
  };
}
