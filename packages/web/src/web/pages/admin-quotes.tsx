import { useEffect } from "react";
import { Link } from "wouter";
import { FilePlus2, Loader2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAdminQuotes } from "../queries/admin-quotes";
import { formatCents } from "../lib/admin-format";

function QuotesContent() {
  const quotes = useAdminQuotes();

  return (
    <AdminLayout title="Quotes">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[#B9C2D0]">Quotations you wrote by hand — for a phone or WhatsApp customer, or a returning client.</p>
        <Link
          href="/admin/quotes/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
        >
          <FilePlus2 size={16} /> New quote
        </Link>
      </div>

      {quotes.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !quotes.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No quotes yet. Create the first one.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.data.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Link href={`/admin/quotes/${q.id}`} className="font-semibold text-white hover:text-[#FF8A3D]">
                      {q.reference}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="text-white">{q.customerName}</div>
                    {q.company && <div className="text-white/50">{q.company}</div>}
                  </TableCell>
                  <TableCell className="text-xs text-white/70">{q.subject ?? "—"}</TableCell>
                  <TableCell>{q.itemCount}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatCents(q.totalCents)}</TableCell>
                  <TableCell className="whitespace-nowrap">{q.issueDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminQuotesPage() {
  useEffect(() => {
    document.title = "Quotes — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <QuotesContent />
    </AdminProtectedRoute>
  );
}
