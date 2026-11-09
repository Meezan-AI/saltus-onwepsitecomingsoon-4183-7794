import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Copy, Loader2, Pencil, Trash2 } from "lucide-react";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { QuoteDocument } from "../components/quote-document";
import { useAdminQuote, useRemoveQuote } from "../queries/admin-quotes";

const actionClass =
  "inline-flex items-center gap-1.5 rounded-full border border-neutral-400 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100";

function QuoteViewContent({ id }: { id: number }) {
  const quote = useAdminQuote(id);
  const remove = useRemoveQuote();
  const [, navigate] = useLocation();

  if (quote.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#FF6B00]" />
      </div>
    );
  }
  if (!quote.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white text-neutral-700">
        <p>Quote not found.</p>
        <Link href="/admin/quotes" className="text-[#FF6B00] underline">Back to quotes</Link>
      </div>
    );
  }

  const q = quote.data;
  async function onDelete() {
    if (!window.confirm(`Delete ${q.reference}? This cannot be undone.`)) return;
    await remove.mutateAsync({ id: q.id });
    navigate("/admin/quotes");
  }

  return (
    <QuoteDocument
      reference={q.reference}
      issued={new Date(`${q.issueDate}T12:00:00`)}
      client={{ name: q.customerName, company: q.company, phone: q.phone, email: q.email }}
      aside={q.subject ? { heading: "Subject", title: q.subject, rows: [] } : undefined}
      groups={[{ lines: q.lines.map((l) => ({ name: l.description, details: l.details, qty: l.qty, unitCents: l.unitCents, totalCents: l.qty * l.unitCents })) }]}
      totals={{
        label: "Total",
        subtotalCents: q.subtotalCents,
        discountCents: q.discountCents,
        vatPercent: q.vatPercent,
        vatCents: q.vatCents,
        totalCents: q.totalCents,
      }}
      notes={q.notes}
      notesLabel="Notes"
      backHref="/admin/quotes"
      backLabel="All quotes"
      actions={
        <>
          <Link href={`/admin/quotes/${q.id}/edit`} className={actionClass}>
            <Pencil size={14} /> Edit
          </Link>
          <Link href={`/admin/quotes/new?from=${q.id}`} className={actionClass}>
            <Copy size={14} /> Duplicate
          </Link>
          <button type="button" onClick={onDelete} disabled={remove.isPending} className={`${actionClass} text-red-700`}>
            <Trash2 size={14} /> Delete
          </button>
        </>
      }
    />
  );
}

export default function AdminQuoteViewPage() {
  const params = useParams<{ id: string }>();
  useEffect(() => {
    document.title = "Request a Quote — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <QuoteViewContent id={Number(params.id)} />
    </AdminProtectedRoute>
  );
}
