import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { FileText, Loader2, Mail, MessageCircle } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select } from "../components/ui/select";
import { PLAN_STATUSES, useAdminPlan, useSetPlanStatus, type PlanStatus } from "../queries/admin-event-plans";
import { formatCents, formatDateTime, statusVariant, titleCase } from "../lib/admin-format";

const GROUP_LABEL: Record<string, string> = {
  printed: "Conference printing",
  gifts: "Gifts & promotional items",
  venue: "Venue & exhibition setup",
  services: "Services",
};

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/50">{k}</span>
      <span className="text-end text-white">{v}</span>
    </div>
  );
}

function PlanContent({ id }: { id: number }) {
  const plan = useAdminPlan(id);
  const setStatus = useSetPlanStatus();

  if (plan.isPending || !plan.data) {
    return (
      <AdminLayout title="Event Plan">
        <Loader2 className="animate-spin text-[#FF6B00]" />
      </AdminLayout>
    );
  }

  const r = plan.data;
  const msg = `Hello ${r.contactName}, regarding your event request ${r.reference}${r.eventName ? ` (${r.eventName})` : ""}. — Saltus ONE`;
  const groups = Object.keys(GROUP_LABEL).filter((g) => r.lines.some((l) => l.groupKey === g));
  const currency = "JOD";

  return (
    <AdminLayout title={r.reference}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row k="Type" v={titleCase(r.eventType)} />
              {r.eventName && <Row k="Name" v={r.eventName} />}
              <Row k="Date" v={r.eventDate} />
              <Row k="Event days" v={r.eventDays} />
              <Row k="Setup days" v={r.setupDays} />
              <Row k="City" v={r.city} />
              {r.venue && <Row k="Venue" v={r.venue} />}
              <Row k="Attendees" v={r.attendees} />
              <Row k="Received" v={formatDateTime(r.createdAt)} />
              <Row k="Customer language" v={r.lang === "ar" ? "Arabic" : "English"} />
              {r.notes && (
                <div className="pt-2">
                  <p className="text-white/50">Customer notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-[#B9C2D0]">{r.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requested items ({r.lines.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              {groups.map((g) => (
                <div key={g}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#FF6B00]">{GROUP_LABEL[g]}</p>
                  <ul className="mt-2 divide-y divide-white/5">
                    {r.lines
                      .filter((l) => l.groupKey === g)
                      .map((l) => (
                        <li key={l.itemId} className="flex items-start justify-between gap-4 py-2.5">
                          <div className="min-w-0">
                            <p className="font-medium text-white">
                              {l.nameEn} <span className="text-white/40">/ {l.nameAr}</span>
                            </p>
                            {l.variantName && <p className="text-xs text-[#B9C2D0]">Option: {l.variantName}</p>}
                            {l.specs.length > 0 && (
                              <p className="text-xs text-[#B9C2D0]">{l.specs.map((s) => `${s.nameEn}: ${s.valueEn}`).join(" · ")}</p>
                            )}
                            {l.note && <p className="text-xs italic text-white/50">“{l.note}”</p>}
                            <p className="text-xs text-white/50">
                              Qty {l.qty}
                              {l.unitEn ? ` ${l.unitEn}` : ""}
                              {l.unitCents !== null && ` × ${formatCents(l.unitCents, currency)}`}
                              {l.multiplier > 1 && ` × ${l.multiplier}`}
                            </p>
                          </div>
                          <div className="shrink-0 text-end">
                            {l.totalCents === null ? (
                              <Badge variant="yellow">Requires quote</Badge>
                            ) : (
                              <span className="font-semibold text-white">{formatCents(l.totalCents, currency)}</span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
              <div className="rounded-xl bg-white/[0.05] p-4">
                <Row k="Estimated total (priced items)" v={<b>{formatCents(r.estimatedTotalCents, currency)}</b>} />
                {r.unpricedCount > 0 && <p className="mt-2 text-xs text-amber-300">{r.unpricedCount} item(s) need a manual quote.</p>}
                <p className="mt-2 text-xs text-white/40">
                  Prices were frozen from the catalog at the time of the request. The final price is subject to Saltus ONE confirmation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Link
            href={`/admin/event-plans/${r.id}/quote`}
            className="flex items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
          >
            <FileText size={16} /> Open quote document (PDF)
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-white">{r.contactName}</p>
                {r.company && <p className="text-white/50">{r.company}</p>}
              </div>
              {r.contactPhone && (
                <div>
                  <p className="text-white/50">Phone / WhatsApp</p>
                  <p className="mt-0.5 text-white" dir="ltr">{r.contactPhone}</p>
                  <a
                    href={`https://wa.me/${r.contactPhone.replace("+", "")}?text=${encodeURIComponent(msg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-[#06260f] transition-colors hover:bg-[#3be37a]"
                  >
                    <MessageCircle size={14} /> Reply on WhatsApp
                  </a>
                </div>
              )}
              {r.contactEmail && (
                <div>
                  <p className="text-white/50">Email</p>
                  <p className="mt-0.5 text-white" dir="ltr">{r.contactEmail}</p>
                  <a
                    href={`mailto:${r.contactEmail}?subject=${encodeURIComponent(`Your event quote — ${r.reference}`)}&body=${encodeURIComponent(msg)}`}
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/5"
                  >
                    <Mail size={14} /> Send email
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant={statusVariant(r.status)}>{titleCase(r.status)}</Badge>
              <Select
                value={r.status}
                disabled={setStatus.isPending}
                onChange={(e) => setStatus.mutate({ id: r.id, status: e.target.value as PlanStatus })}
              >
                {PLAN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminEventPlanDetailPage() {
  const params = useParams<{ id: string }>();
  useEffect(() => {
    document.title = "Event Plan — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <PlanContent id={Number(params.id)} />
    </AdminProtectedRoute>
  );
}
