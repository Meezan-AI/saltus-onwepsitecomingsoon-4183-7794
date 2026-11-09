import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { useAdminPlan } from "../queries/admin-event-plans";
import { formatCents, titleCase } from "../lib/admin-format";
import { EMAIL, PHONE_DISPLAY, WEBSITE } from "../lib/contact";

/** Fixed terms printed on every quotation. */
const TERMS = [
  "Prices are quoted in Jordanian Dinar (JOD) and include VAT where stated.",
  "This quotation is valid for 30 days from the date of issue.",
  "Payment terms: 50% advance upon approval, 50% on delivery.",
  "Delivery timeline starts from the date of receiving the signed approval and advance payment.",
  "Any scope added after approval is quoted separately.",
];

const GROUP_LABEL: Record<string, string> = {
  printed: "Conference printing",
  gifts: "Gifts & promotional items",
  venue: "Venue & exhibition setup",
  services: "Services",
};

const ADDRESS = "Zainab Al-Asadiyah Street, Dahiat Al-Rasheed, Amman 11831, Jordan";

function longDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

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
  const issued = new Date();
  const validUntil = new Date(issued.getTime() + 30 * 24 * 60 * 60 * 1000);
  const groups = Object.keys(GROUP_LABEL).filter((g) => r.lines.some((l) => l.groupKey === g));

  return (
    <div className="min-h-screen bg-neutral-200 py-6 text-neutral-900 print:bg-white print:py-0" dir="ltr">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff !important; }
          .fixed { display: none !important; }
          .qt-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-3 print:hidden">
        <Link href={`/admin/event-plans/${r.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-black">
          <ArrowLeft size={16} /> Back to request
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D]"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      <article className="mx-auto max-w-[210mm] bg-white p-8 shadow-lg print:max-w-none print:p-0 print:shadow-none sm:p-12">
        {/* Header */}
        <header className="flex items-start justify-between gap-6 border-b-4 border-[#FF6B00] pb-5">
          <img src="/images/logo-horizontal-trim.png" alt="Saltus ONE" className="h-16 w-auto" />
          <div className="text-right">
            <h1 className="text-3xl font-extrabold uppercase tracking-wide text-[#0b1f3a]">Request a Quote</h1>
            <p className="mt-1 text-sm text-neutral-600">Ref: <b className="text-neutral-900">{r.reference}</b></p>
            <p className="text-sm text-neutral-600">Date: {longDate(issued)}</p>
            <p className="text-sm text-neutral-600">Valid until: {longDate(validUntil)}</p>
          </div>
        </header>

        {/* Parties */}
        <section className="qt-avoid mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">Prepared for</h2>
            <p className="mt-2 text-base font-semibold">{r.contactName}</p>
            {r.company && <p className="text-sm text-neutral-700">{r.company}</p>}
            {r.contactPhone && <p className="text-sm text-neutral-700">{r.contactPhone}</p>}
            {r.contactEmail && <p className="text-sm text-neutral-700">{r.contactEmail}</p>}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">Event</h2>
            <p className="mt-2 text-base font-semibold">
              {titleCase(r.eventType)}
              {r.eventName ? ` — ${r.eventName}` : ""}
            </p>
            <p className="text-sm text-neutral-700">
              {r.eventDate} · {r.eventDays} day{r.eventDays > 1 ? "s" : ""}
              {r.setupDays > 0 ? ` (+${r.setupDays} setup)` : ""}
            </p>
            <p className="text-sm text-neutral-700">
              {r.city}
              {r.venue ? ` · ${r.venue}` : ""}
            </p>
            <p className="text-sm text-neutral-700">{r.attendees} expected attendees</p>
          </div>
        </section>

        {/* Items */}
        <section className="mt-8">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#0b1f3a] text-left text-xs uppercase tracking-wide text-white">
                <th className="w-8 px-3 py-2">#</th>
                <th className="px-3 py-2">Description</th>
                <th className="w-16 px-3 py-2 text-right">Qty</th>
                <th className="w-28 px-3 py-2 text-right">Unit (JOD)</th>
                <th className="w-28 px-3 py-2 text-right">Total (JOD)</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const lines = r.lines.filter((l) => l.groupKey === g);
                const offset = r.lines.filter((l) => groups.indexOf(l.groupKey) < groups.indexOf(g)).length;
                return <GroupRows key={g} label={GROUP_LABEL[g]} lines={lines} offset={offset} />;
              })}
            </tbody>
          </table>

          <div className="qt-avoid mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between border-t-2 border-[#0b1f3a] pt-2 text-base font-bold">
              <span>Total (priced items)</span>
              <span>{formatCents(r.estimatedTotalCents)}</span>
            </div>
            {r.unpricedCount > 0 && (
              <p className="text-xs text-neutral-600">
                {r.unpricedCount} item{r.unpricedCount > 1 ? "s" : ""} marked “To be quoted” will be priced separately.
              </p>
            )}
          </div>
        </section>

        {r.notes && (
          <section className="qt-avoid mt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">Customer notes</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{r.notes}</p>
          </section>
        )}

        {/* Terms */}
        <section className="qt-avoid mt-8 rounded-lg border border-neutral-300 p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.15em] text-[#0b1f3a]">Terms &amp; Conditions</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-neutral-700">
            {TERMS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </section>

        {/* Approval */}
        <section className="qt-avoid mt-8 grid grid-cols-2 gap-10 text-xs text-neutral-600">
          <div>
            <div className="h-12 border-b border-neutral-400" />
            <p className="mt-1">Client approval (name, signature &amp; date)</p>
          </div>
          <div>
            <div className="h-12 border-b border-neutral-400" />
            <p className="mt-1">Saltus ONE</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="qt-avoid mt-10 border-t-4 border-[#0b1f3a] pt-3 text-center text-xs text-neutral-700">
          <p className="font-semibold text-[#0b1f3a]">Saltus ONE</p>
          <p className="mt-1">
            {WEBSITE} · {EMAIL} · <span dir="ltr">{PHONE_DISPLAY}</span>
          </p>
          <p>{ADDRESS}</p>
        </footer>
      </article>
    </div>
  );
}

function GroupRows({
  label,
  lines,
  offset,
}: {
  label: string;
  lines: NonNullable<ReturnType<typeof useAdminPlan>["data"]>["lines"];
  offset: number;
}) {
  return (
    <>
      <tr className="bg-neutral-100">
        <td colSpan={5} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0b1f3a]">
          {label}
        </td>
      </tr>
      {lines.map((l, i) => {
        const specs = [l.variantName, ...l.specs.map((s) => `${s.nameEn}: ${s.valueEn}`)].filter(Boolean).join(" · ");
        return (
          <tr key={l.itemId} className="qt-avoid border-b border-neutral-200 align-top">
            <td className="w-10 whitespace-nowrap px-3 py-2 text-neutral-500">{offset + i + 1}</td>
            <td className="px-3 py-2">
              <p className="font-medium">{l.nameEn}</p>
              {specs && <p className="text-xs text-neutral-600">{specs}</p>}
              {l.note && <p className="text-xs italic text-neutral-500">{l.note}</p>}
              {l.multiplier > 1 && <p className="text-xs text-neutral-500">× {l.multiplier} {l.rentalUnit === "week" ? "weeks" : "days"}</p>}
            </td>
            <td className="px-3 py-2 text-right">{l.qty}</td>
            <td className="px-3 py-2 text-right">{l.unitCents === null ? "—" : (l.unitCents / 1000).toFixed(3)}</td>
            <td className="px-3 py-2 text-right font-semibold">
              {l.totalCents === null ? <span className="text-xs font-medium text-neutral-500">To be quoted</span> : (l.totalCents / 1000).toFixed(3)}
            </td>
          </tr>
        );
      })}
    </>
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
