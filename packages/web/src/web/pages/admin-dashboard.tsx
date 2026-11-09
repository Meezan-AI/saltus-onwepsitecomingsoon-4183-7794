import { useEffect } from "react";
import { Link } from "wouter";
import { ClipboardList, FilePlus2, FileCheck2, FileSignature, Package, Users } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Card, CardContent } from "../components/ui/card";
import { useMyPermissions } from "../queries/account";
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
  const { data: permissions } = useMyPermissions();
  const canQuote = (permissions ?? []).includes("manage_rfqs");
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
      {canQuote && (
      <Link
        href="/admin/quotes/new"
        className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#FF6B00]/40 bg-gradient-to-r from-[#FF6B00]/20 to-[#FF6B00]/5 p-5 transition-colors hover:border-[#FF6B00]"
      >
        <div>
          <p className="font-display text-lg font-extrabold text-white">Create a new quote</p>
          <p className="mt-1 text-sm text-[#B9C2D0]">For a phone or WhatsApp customer, or a returning client — fill it in, then print or save as PDF.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white">
          <FilePlus2 size={16} /> New quote
        </span>
      </Link>
      )}
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
