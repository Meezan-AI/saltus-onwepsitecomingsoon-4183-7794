import { useEffect } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { QuoteDocument, type QuoteDocGroup } from "../components/quote-document";
import { useAdminPlan } from "../queries/admin-event-plans";
import { titleCase } from "../lib/admin-format";

const GROUP_LABEL: Record<string, string> = {
  printed: "Conference printing",
  gifts: "Gifts & promotional items",
  venue: "Venue & exhibition setup",
  services: "Services",
};

function QuoteContent({ id }: { id: number }) {
  const plan = useAdminPlan(id);

  if (plan.isPending || !plan.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  const r = plan.data;
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

  return (
    <QuoteDocument
      reference={r.reference}
      issued={new Date()}
      client={{ name: r.contactName, company: r.company, phone: r.contactPhone, email: r.contactEmail }}
      aside={{
        heading: "Event",
        title: `${titleCase(r.eventType)}${r.eventName ? ` — ${r.eventName}` : ""}`,
        rows: [
          `${r.eventDate} · ${r.eventDays} day${r.eventDays > 1 ? "s" : ""}${r.setupDays > 0 ? ` (+${r.setupDays} setup)` : ""}`,
          `${r.city}${r.venue ? ` · ${r.venue}` : ""}`,
          `${r.attendees} expected attendees`,
        ],
      }}
      groups={groups}
      totals={{ label: "Total (priced items)", subtotalCents: r.estimatedTotalCents ?? 0, totalCents: r.estimatedTotalCents ?? 0, unpricedCount: r.unpricedCount }}
      notes={r.notes}
      notesLabel="Customer notes"
      backHref={`/admin/event-plans/${r.id}`}
      backLabel="Back to request"
    />
  );
}

export default function AdminEventPlanQuotePage() {
  const params = useParams<{ id: string }>();
  useEffect(() => {
    document.title = "Request a Quote — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <QuoteContent id={Number(params.id)} />
    </AdminProtectedRoute>
  );
}
