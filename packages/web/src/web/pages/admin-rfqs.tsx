import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Select } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { RFQ_STATUSES, useAdminRfqs, type RfqStatus } from "../queries/admin-rfqs";
import { formatDate, statusVariant, titleCase } from "../lib/admin-format";

function RfqsContent() {
  const [status, setStatus] = useState<RfqStatus | "">("");
  const rfqs = useAdminRfqs(status || undefined);

  return (
    <AdminLayout title="RFQs">
      <div className="mb-4 flex items-center gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value as RfqStatus | "")} className="w-56">
          <option value="">All statuses</option>
          {RFQ_STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </Select>
      </div>

      {rfqs.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !rfqs.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No RFQs yet.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqs.data.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell>
                    <Link href={`/admin/rfqs/${rfq.id}`} className="font-semibold text-white hover:text-[#FF8A3D]">
                      RFQ-{rfq.id}
                    </Link>
                  </TableCell>
                  <TableCell>{rfq.qty}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(rfq.status)}>{titleCase(rfq.status)}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(rfq.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminRfqsPage() {
  useEffect(() => {
    document.title = "RFQs — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <RfqsContent />
    </AdminProtectedRoute>
  );
}
