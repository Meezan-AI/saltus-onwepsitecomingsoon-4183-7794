import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  ORDER_STATUSES,
  useAdminOrder,
  useAdminOrderHistory,
  useConfirmOrderPayment,
  useUpdateOrderStatus,
  type OrderStatus,
} from "../queries/admin-orders";
import { formatCents, formatDateTime, statusVariant, titleCase } from "../lib/admin-format";

function OrderDetailContent({ id }: { id: number }) {
  const order = useAdminOrder(id);
  const history = useAdminOrderHistory(id);
  const updateStatus = useUpdateOrderStatus();
  const confirmPayment = useConfirmOrderPayment();

  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");

  if (order.isPending || !order.data) {
    return (
      <AdminLayout title="Order">
        <Loader2 className="animate-spin text-[#FF6B00]" />
      </AdminLayout>
    );
  }

  const o = order.data;

  return (
    <AdminLayout title={`Order ${o.orderNumber}`}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Line Total</TableHead>
                    <TableHead>Design</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {o.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.nameEn}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>{formatCents(item.unitPriceCents, o.currency)}</TableCell>
                      <TableCell>{formatCents(item.lineTotalCents, o.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(item.designStatus)}>{titleCase(item.designStatus)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.isPending ? (
                <Loader2 className="animate-spin text-[#FF6B00]" size={18} />
              ) : !history.data?.length ? (
                <p className="text-sm text-[#B9C2D0]">No status changes recorded yet.</p>
              ) : (
                <ol className="space-y-4 border-l border-white/10 pl-5">
                  {history.data.map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[26px] top-1 size-2.5 rounded-full bg-[#FF6B00]" />
                      <p className="text-sm font-semibold text-white">
                        {h.fromStatus ? `${titleCase(h.fromStatus)} → ` : ""}
                        {titleCase(h.toStatus)}
                      </p>
                      <p className="text-xs text-white/40">
                        {formatDateTime(h.createdAt)} {h.changedByName ? `· ${h.changedByName}` : ""}
                      </p>
                      {h.note && <p className="mt-1 text-sm text-[#B9C2D0]">{h.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Status</span>
                <Badge variant={statusVariant(o.status)}>{titleCase(o.status)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Payment</span>
                <Badge variant={statusVariant(o.paymentStatus)}>{titleCase(o.paymentStatus)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Fulfillment</span>
                <span className="text-white">{titleCase(o.fulfillmentType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Total</span>
                <span className="font-semibold text-white">{formatCents(o.totalCents, o.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Customer</span>
                <span className="text-white">{o.customer?.name ?? o.customer?.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as OrderStatus | "")}>
                <option value="">Choose a status…</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </Select>
              <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button
                type="button"
                disabled={!nextStatus || updateStatus.isPending}
                onClick={() =>
                  nextStatus &&
                  updateStatus.mutate(
                    { id: o.id, status: nextStatus, note: note || undefined },
                    { onSuccess: () => { setNextStatus(""); setNote(""); } },
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateStatus.isPending && <Loader2 size={14} className="animate-spin" />}
                Apply
              </button>
            </CardContent>
          </Card>

          {o.paymentStatus !== "paid" && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Manual Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
                <button
                  type="button"
                  disabled={confirmPayment.isPending}
                  onClick={() =>
                    confirmPayment.mutate(
                      { id: o.id, reference: reference || undefined },
                      { onSuccess: () => setReference("") },
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirmPayment.isPending && <Loader2 size={14} className="animate-spin" />}
                  Mark as Paid
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  useEffect(() => {
    document.title = "Order — Admin — Saltus ONE";
  }, []);

  return (
    <AdminProtectedRoute>
      <OrderDetailContent id={id} />
    </AdminProtectedRoute>
  );
}
