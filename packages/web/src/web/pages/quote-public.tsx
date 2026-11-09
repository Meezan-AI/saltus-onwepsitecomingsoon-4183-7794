import { useEffect } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { QuoteDocument } from "../components/quote-document";
import { usePublicQuote } from "../queries/admin-quotes";

function PublicQuote({ token }: { token: string }) {
  const quote = usePublicQuote(token);

  if (quote.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#FF6B00]" />
      </div>
    );
  }
  if (!quote.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white px-6 text-center text-neutral-700">
        <img src="/images/logo-horizontal-trim.png" alt="Saltus ONE" className="mb-4 h-12 w-auto" />
        <p className="font-semibold">This quotation link isn't valid.</p>
        <p className="text-sm">Please contact Saltus ONE on +962 79 588 1811.</p>
      </div>
    );
  }

  const q = quote.data;
  return (
    <QuoteDocument
      reference={q.reference}
      issued={new Date(`${q.issueDate}T12:00:00`)}
      client={{ name: q.customerName, company: q.company, phone: q.phone, email: q.email }}
      preparedBy={{ name: q.preparedByName, phone: q.preparedByPhone }}
      aside={q.subject ? { heading: "Subject", title: q.subject, rows: [] } : undefined}
      groups={[{ lines: q.lines.map((l) => ({ name: l.description, details: l.details, qty: l.qty, unitCents: l.unitCents, totalCents: l.qty * l.unitCents, kind: l.kind, period: l.period })) }]}
      totals={{ label: "Total", subtotalCents: q.subtotalCents, discountCents: q.discountCents, vatPercent: q.vatPercent, vatCents: q.vatCents, totalCents: q.totalCents }}
      notes={q.notes}
      notesLabel="Notes"
    />
  );
}

/** Customer-facing quotation page, opened from the WhatsApp / email link. Not indexed. */
export default function QuotePublicPage() {
  const params = useParams<{ token: string }>();
  useEffect(() => {
    document.title = "Quotation — Saltus ONE";
    let m = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!m) {
      m = document.createElement("meta");
      m.name = "robots";
      document.head.appendChild(m);
    }
    m.content = "noindex, nofollow";
  }, []);
  return <PublicQuote token={params.token} />;
}
