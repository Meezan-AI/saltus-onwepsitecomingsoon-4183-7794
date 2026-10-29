import { Link } from "wouter";
import { Loader2, PackageSearch } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ProtectedRoute } from "../components/marketplace/protected-route";
import { StatusBadge, orderStatusTone } from "../components/marketplace/status-badge";
import { useOrders } from "../queries/orders";
import { formatPriceCents } from "../lib/money";
import { useLang } from "../i18n";

function OrdersContent() {
  const { t } = useLang();
  const ordersQuery = useOrders();
  const orders = ordersQuery.data ?? [];

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo path="/account/orders" custom={t.account.orders.meta} noindex />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.account.orders.eyebrow}
          </span>
          <h1 className="font-display mt-3 text-3xl font-extrabold text-white sm:text-4xl">{t.account.orders.title}</h1>
          <p className="mt-2 text-sm text-[#B9C2D0]">{t.account.orders.desc}</p>

          {ordersQuery.isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={32} className="animate-spin text-[#FF6B00]" />
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-card mt-10 rounded-2xl px-6 py-20 text-center">
              <PackageSearch size={36} className="mx-auto text-white/20" />
              <p className="font-display mt-4 text-xl font-bold text-white">{t.account.orders.empty}</p>
              <p className="mt-2 text-sm text-[#B9C2D0]">{t.account.orders.emptyDesc}</p>
              <Link
                href="/marketplace"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
              >
                {t.account.orders.browseCta}
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.orderNumber}`}
                  className="glass-card flex flex-col gap-3 rounded-2xl p-5 transition-colors hover:border-[#FF6B00]/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="block text-xs uppercase tracking-wide text-[#B9C2D0]/60">
                      {t.account.orders.orderNumber}
                    </span>
                    <span dir="ltr" className="font-display block text-base font-bold text-white">
                      {order.orderNumber}
                    </span>
                  </span>
                  <div className="flex flex-shrink-0 items-center gap-4">
                    <StatusBadge label={t.account.status[order.status as keyof typeof t.account.status] ?? order.status} tone={orderStatusTone(order.status)} />
                    <span className="text-sm">
                      <span className="text-[#B9C2D0]/60">{t.account.orders.total}: </span>
                      <span className="font-semibold text-white">{formatPriceCents(order.totalCents, order.currency)}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function AccountOrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
