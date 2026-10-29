import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Select } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ORDER_STATUSES, useAdminOrders, type OrderStatus } from "../queries/admin-orders";
import { formatCents, formatDate, statusVariant, titleCase } from "../lib/admin-format";

function OrdersContent() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const orders = useAdminOrders(status || undefined);

  return (
    <AdminLayout title="Orders">
      <div className="mb-4 flex items-center gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "")} className="w-56">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </Select>
      </div>

      {orders.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !orders.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No orders yet.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.map((order) => (
                <TableRow key={order.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-white hover:text-[#FF8A3D]">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>{titleCase(order.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.paymentStatus)}>{titleCase(order.paymentStatus)}</Badge>
                  </TableCell>
                  <TableCell>{formatCents(order.totalCents, order.currency)}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminOrdersPage() {
  useEffect(() => {
    document.title = "Orders — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <OrdersContent />
    </AdminProtectedRoute>
  );
}
