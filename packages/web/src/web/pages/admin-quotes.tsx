import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ChevronRight, FilePlus2, Folder, Loader2, Search } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAdminQuotes } from "../queries/admin-quotes";
import { formatCents, formatDate } from "../lib/admin-format";
import { quoteFolderKey, quoteFolderName } from "../lib/quote-folders";

const newBtn =
  "inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]";

function sentBadge(q: { lastSentAt: Date | string | null; lastSentVia: string | null }) {
  if (!q.lastSentAt) return <Badge variant="neutral">Not sent</Badge>;
  return (
    <Badge variant="green">
      {q.lastSentVia === "email" ? "Emailed" : "WhatsApp"} · {formatDate(q.lastSentAt)}
    </Badge>
  );
}

function QuotesContent() {
  const quotes = useAdminQuotes();
  const folderKey = new URLSearchParams(useSearch()).get("c");
  const [filter, setFilter] = useState("");

  const folders = useMemo(() => {
    const map = new Map<string, { key: string; name: string; quotes: NonNullable<typeof quotes.data> }>();
    for (const q of quotes.data ?? []) {
      const key = quoteFolderKey(q);
      const f = map.get(key) ?? { key, name: quoteFolderName(q), quotes: [] };
      f.quotes.push(q);
      map.set(key, f);
    }
    return [...map.values()].sort((a, b) => b.quotes[0].id - a.quotes[0].id);
  }, [quotes.data]);

  const folder = folderKey ? folders.find((f) => f.key === folderKey) : undefined;
  const needle = filter.trim().toLowerCase();
  const shown = needle
    ? folders.filter((f) => f.name.toLowerCase().includes(needle) || f.quotes.some((q) => q.reference.toLowerCase().includes(needle) || q.customerName.toLowerCase().includes(needle)))
    : folders;

  return (
    <AdminLayout title="Quotes">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {folder ? (
          <nav className="flex items-center gap-1 text-sm text-[#B9C2D0]">
            <Link href="/admin/quotes" className="hover:text-white">All folders</Link>
            <ChevronRight size={14} />
            <span className="font-semibold text-white">{folder.name}</span>
          </nav>
        ) : (
          <div className="relative w-full max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search client or quote no." className="pl-9" />
          </div>
        )}
        <Link href={folder ? `/admin/quotes/new?clientOf=${folder.quotes[0].id}` : "/admin/quotes/new"} className={newBtn}>
          <FilePlus2 size={16} /> {folder ? "New quote for this client" : "New quote"}
        </Link>
      </div>

      {quotes.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !quotes.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No quotes yet. Create the first one.</p>
      ) : folderKey && !folder ? (
        <p className="text-sm text-[#B9C2D0]">That folder is empty. <Link href="/admin/quotes" className="text-[#FF8A3D] underline">Back to all folders</Link></p>
      ) : folder ? (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote no.</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Issued by</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folder.quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Link href={`/admin/quotes/${q.id}`} className="font-semibold text-white hover:text-[#FF8A3D]">{q.reference}</Link>
                  </TableCell>
                  <TableCell className="text-xs text-white/80">{q.customerName}</TableCell>
                  <TableCell className="text-xs text-white/70">{q.subject ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatCents(q.totalCents)}</TableCell>
                  <TableCell className="whitespace-nowrap">{q.issueDate}</TableCell>
                  <TableCell className="text-xs text-white/70">{q.preparedByName ?? "—"}</TableCell>
                  <TableCell>{sentBadge(q)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : !shown.length ? (
        <p className="text-sm text-[#B9C2D0]">Nothing matches “{filter}”.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((f) => {
            const total = f.quotes.reduce((s, q) => s + q.totalCents, 0);
            return (
              <Link
                key={f.key}
                href={`/admin/quotes?c=${encodeURIComponent(f.key)}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-[#FF6B00]/50"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#FF6B00]/15 p-3 text-[#FF8A3D]">
                    <Folder size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold text-white">{f.name}</p>
                    <p className="text-xs text-white/50">
                      {f.quotes.length} quote{f.quotes.length > 1 ? "s" : ""} · {formatCents(total)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 truncate text-xs text-white/40">
                  Latest: {f.quotes[0].reference} · {f.quotes[0].issueDate}
                </p>
              </Link>
            );
          })}
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
