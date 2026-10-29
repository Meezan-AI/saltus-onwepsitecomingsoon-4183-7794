import { useEffect } from "react";
import { Link } from "wouter";
import { ClipboardList, FileCheck2, FileSignature, Package, Users } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Card, CardContent } from "../components/ui/card";
import { useAdminOrders } from "../queries/admin-orders";
import { useAdminRfqs } from "../queries/admin-rfqs";
import { useDesignReviewQueue } from "../queries/admin-design-reviews";
import { useAdminProducts } from "../queries/admin-products";
import { useAdminCustomers } from "../queries/admin-customers";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  icon: typeof Package;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-[#FF6B00]/40">
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{label}</p>
            <p className="font-display mt-1 text-3xl font-extrabold text-white">{value}</p>
          </div>
          <div className="rounded-xl bg-[#FF6B00]/15 p-3 text-[#FF8A3D]">
            <Icon size={22} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardContent() {
  const orders = useAdminOrders();
  const rfqs = useAdminRfqs();
  const designQueue = useDesignReviewQueue();
  const products = useAdminProducts();
  const customers = useAdminCustomers();

  const pendingPayment = orders.data?.filter((o) => o.paymentStatus !== "paid").length ?? 0;
  const openOrders = orders.data?.filter((o) => !["completed", "cancelled", "refunded"].includes(o.status)).length ?? 0;
  const newRfqs = rfqs.data?.filter((r) => r.status === "new").length ?? 0;

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Open Orders" value={openOrders} icon={ClipboardList} href="/admin/orders" />
        <StatCard label="Awaiting Payment" value={pendingPayment} icon={ClipboardList} href="/admin/orders" />
        <StatCard label="Design Reviews Pending" value={designQueue.data?.length ?? 0} icon={FileCheck2} href="/admin/design-reviews" />
        <StatCard label="New RFQs" value={newRfqs} icon={FileSignature} href="/admin/rfqs" />
        <StatCard label="Active Products" value={products.data?.filter((p) => p.isActive).length ?? 0} icon={Package} href="/admin/products" />
        <StatCard label="Customers" value={customers.data?.length ?? 0} icon={Users} href="/admin/customers" />
      </div>
    </AdminLayout>
  );
}

export default function AdminDashboardPage() {
  useEffect(() => {
    document.title = "Admin Dashboard — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <DashboardContent />
    </AdminProtectedRoute>
  );
}
