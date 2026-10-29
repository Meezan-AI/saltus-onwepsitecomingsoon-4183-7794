import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAdminRfq, useDeclineRfq, useQuoteRfq } from "../queries/admin-rfqs";
import { formatCents, formatDate, statusVariant, titleCase } from "../lib/admin-format";

function RfqDetailContent({ id }: { id: number }) {
  const rfq = useAdminRfq(id);
  const quote = useQuoteRfq();
  const decline = useDeclineRfq();
  const [, navigate] = useLocation();

  const [price, setPrice] = useState("");
  const [validUntil, setValidUntil] = useState("");

  if (rfq.isPending || !rfq.data) {
    return (
      <AdminLayout title="RFQ">
        <Loader2 className="animate-spin text-[#FF6B00]" />
      </AdminLayout>
    );
  }

  const r = rfq.data;
  const canAct = r.status === "new" || r.status === "quoted";

  return (
    <AdminLayout title={`RFQ-${r.id}`}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Product</span>
                <span className="text-white">{r.product?.nameEn ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Quantity</span>
                <span className="text-white">{r.qty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Customer</span>
                <span className="text-white">{r.customer?.name ?? r.customer?.email ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Requested</span>
                <span className="text-white">{formatDate(r.createdAt)}</span>
              </div>
              {r.notes && (
                <div>
                  <p className="text-white/50">Notes</p>
                  <p className="mt-1 text-[#B9C2D0]">{r.notes}</p>
                </div>
              )}
              {r.quotedPriceCents != null && (
                <div className="flex justify-between">
                  <span className="text-white/50">Quoted Price</span>
                  <span className="font-semibold text-white">{formatCents(r.quotedPriceCents)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={statusVariant(r.status)}>{titleCase(r.status)}</Badge>
            </CardContent>
          </Card>

          {canAct && (
            <Card>
              <CardHeader>
                <CardTitle>Send Quote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Price (JOD)</Label>
                  <Input type="number" min="0" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                </div>
                <button
                  type="button"
                  disabled={!price || !validUntil || quote.isPending}
                  onClick={() =>
                    quote.mutate({
                      id: r.id,
                      quotedPriceCents: Math.round(Number(price) * 1000),
                      validUntil: new Date(validUntil),
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {quote.isPending && <Loader2 size={14} className="animate-spin" />}
                  Send Quote
                </button>
                <button
                  type="button"
                  disabled={decline.isPending}
                  onClick={() => decline.mutate({ id: r.id }, { onSuccess: () => navigate("/admin/rfqs") })}
                  className="w-full rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Decline
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminRfqDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  useEffect(() => {
    document.title = "RFQ — Admin — Saltus ONE";
  }, []);

  return (
    <AdminProtectedRoute>
      <RfqDetailContent id={id} />
    </AdminProtectedRoute>
  );
}
