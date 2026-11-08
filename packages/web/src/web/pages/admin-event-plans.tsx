import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Select } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { PLAN_STATUSES, useAdminPlans, type PlanStatus } from "../queries/admin-event-plans";
import { formatDate, statusVariant, titleCase } from "../lib/admin-format";

function PlansContent() {
  const [status, setStatus] = useState<PlanStatus | "">("");
  const plans = useAdminPlans(status || undefined);

  return (
    <AdminLayout title="Event Plans">
      <div className="mb-4 flex items-center gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value as PlanStatus | "")} className="w-56">
          <option value="">All statuses</option>
          {PLAN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </Select>
      </div>

      {plans.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !plans.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No event plans yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/event-plans/${p.id}`} className="font-semibold text-white hover:text-[#FF8A3D]">
                      {p.reference}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="text-white">{titleCase(p.eventType)}{p.eventName ? ` — ${p.eventName}` : ""}</div>
                    <div className="text-white/50">{p.city} · {p.eventDate} · {p.attendees} attendees</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="text-white">{p.contactName}{p.company ? ` (${p.company})` : ""}</div>
                    <div className="text-white/50" dir="ltr">{p.contactPhone ?? p.contactEmail ?? "—"}</div>
                  </TableCell>
                  <TableCell>{p.itemCount}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>{titleCase(p.status)}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(p.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminEventPlansPage() {
  useEffect(() => {
    document.title = "Event Plans — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <PlansContent />
    </AdminProtectedRoute>
  );
}
