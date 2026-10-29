import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAdminCustomerOrders, useAdminCustomers } from "../queries/admin-customers";
import { formatCents, formatDate, statusVariant, titleCase } from "../lib/admin-format";

function CustomerOrdersDialog({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const orders = useAdminCustomerOrders(userId);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>{name}'s Orders</DialogTitle>
      </DialogHeader>
      {orders.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !orders.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No orders yet.</p>
      ) : (
        <div className="space-y-2">
          {orders.data.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
              <span className="font-medium text-white">{o.orderNumber}</span>
              <Badge variant={statusVariant(o.status)}>{titleCase(o.status)}</Badge>
              <span className="text-white/60">{formatCents(o.totalCents, o.currency)}</span>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}

function CustomersContent() {
  const customers = useAdminCustomers();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  return (
    <AdminLayout title="Customers">
      {customers.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !customers.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No customers yet.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-white">{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{formatDate(c.createdAt)}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSelected({ id: c.id, name: c.name })}
                      className="text-xs font-semibold text-[#FF8A3D] hover:text-[#FF6B00]"
                    >
                      View Orders
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selected && <CustomerOrdersDialog userId={selected.id} name={selected.name} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}

export default function AdminCustomersPage() {
  useEffect(() => {
    document.title = "Customers — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <CustomersContent />
    </AdminProtectedRoute>
  );
}
