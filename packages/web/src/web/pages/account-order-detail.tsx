import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ProtectedRoute } from "../components/marketplace/protected-route";
import { DesignUploader } from "../components/marketplace/design-uploader";
import { StatusBadge, designStatusTone, orderStatusTone } from "../components/marketplace/status-badge";
import { useCancelOrder, useOrder } from "../queries/orders";
import { formatPriceCents } from "../lib/money";
import { useLang } from "../i18n";

const CANCELLABLE = ["design_pending", "design_in_review", "design_approved", "payment_pending"];

function OrderDetailContent() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { t, lang, dir } = useLang();
  const orderQuery = useOrder(orderNumber);
  const cancelOrder = useCancelOrder();
  const [confirming, setConfirming] = useState(false);

  if (orderQuery.isLoading) {
    return (
      <div className="min-h-[100svh] bg-[#0b1f3a]">
        <Nav />
        <div className="flex min-h-[60vh] items-center justify-center pt-32">
          <Loader2 size={32} className="animate-spin text-[#FF6B00]" />
        </div>
        <Footer />
      </div>
    );
  }

  const order = orderQuery.data;

  if (orderQuery.isError || !order) {
    return (
      <div className="min-h-[100svh] bg-[#0b1f3a]">
        <Nav />
        <div className="mx-auto max-w-2xl px-6 pt-48 pb-24 text-center">
          <h1 className="font-display text-3xl font-extrabold text-white">{t.account.orderDetail.notFound}</h1>
          <Link
            href="/account/orders"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
          >
            {dir === "rtl" ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {t.account.orderDetail.backToOrders}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const canCancel = CANCELLABLE.includes(order.status);

  async function handleCancel() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await cancelOrder.mutateAsync({ orderNumber: order!.orderNumber });
    setConfirming(false);
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        path={`/account/orders/${order.orderNumber}`}
        custom={{
          title: `${t.account.orderDetail.title} ${order.orderNumber} | Saltus ONE`,
          desc: t.account.orders.meta.desc,
          keywords: t.account.orders.meta.keywords,
        }}
        noindex
      />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#FF6B00] transition-colors hover:text-[#FF8A3D]"
          >
            {dir === "rtl" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            {t.account.orderDetail.backToOrders}
          </Link>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h1 dir="ltr" className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              {order.orderNumber}
            </h1>
            <StatusBadge
              label={t.account.status[order.status as keyof typeof t.account.status] ?? order.status}
              tone={orderStatusTone(order.status)}
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                {t.account.orderDetail.fulfillment}
              </p>
              <p className="mt-2 text-sm text-white">
                {order.fulfillmentType === "pickup_rental"
                  ? t.account.orderDetail.fulfillmentPickup
                  : t.account.orderDetail.fulfillmentDelivery}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                {t.account.orderDetail.paymentStatus}
              </p>
              <p className="mt-2 text-sm text-white">{order.paymentStatus}</p>
            </div>
          </div>

          <div className="glass-card mt-6 rounded-2xl p-5 text-sm text-[#B9C2D0]">
            {t.account.orderDetail.paymentNotice}
          </div>

          <div className="mt-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white/80">
              {t.account.orderDetail.itemsTitle}
            </h2>
            <div className="mt-3 space-y-3">
              {order.items.map((item) => {
                const name = lang === "ar" ? item.product.nameAr : item.product.nameEn;
                return (
                  <div key={item.id} className="glass-card rounded-2xl p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display truncate text-base font-bold text-white">{name}</p>
                        {item.variant && <p className="mt-1 text-xs text-[#B9C2D0]/70">{item.variant.name}</p>}
                      </div>
                      <StatusBadge
                        label={t.account.designStatus[item.designStatus as keyof typeof t.account.designStatus] ?? item.designStatus}
                        tone={designStatusTone(item.designStatus)}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                      <span className="text-[#B9C2D0]/60">
                        {t.account.orderDetail.qty}: <span className="text-white">{item.qty}</span>
                      </span>
                      <span className="text-[#B9C2D0]/60">
                        {t.account.orderDetail.unitPrice}:{" "}
                        <span className="text-white">{formatPriceCents(item.unitPriceCents, order.currency)}</span>
                      </span>
                      <span className="text-end text-[#B9C2D0]/60 sm:text-start">
                        {t.account.orderDetail.lineTotal}:{" "}
                        <span className="font-semibold text-white">
                          {formatPriceCents(item.lineTotalCents, order.currency)}
                        </span>
                      </span>
                    </div>
                    <DesignUploader orderItemId={item.id} designStatus={item.designStatus} />
                  </div>
                );
              })}
            </div>
          </div>

          {order.notes && (
            <div className="glass-card mt-6 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                {t.account.orderDetail.notesLabel}
              </p>
              <p className="mt-2 text-sm text-[#B9C2D0]">{order.notes}</p>
            </div>
          )}

          <div className="glass-card mt-6 flex items-center justify-between rounded-2xl p-6">
            <span className="text-sm font-semibold text-white/70">{t.account.orderDetail.totalLabel}</span>
            <span className="font-display text-xl font-bold text-white">
              {formatPriceCents(order.totalCents, order.currency)}
            </span>
          </div>

          {canCancel && (
            <div className="mt-6">
              {cancelOrder.isError && <p className="mb-3 text-sm text-[#FF8A8A]">{t.account.orderDetail.cancelError}</p>}
              <button
                onClick={handleCancel}
                disabled={cancelOrder.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-[#FF4D4D]/40 px-6 py-3 text-sm font-semibold text-[#FF8A8A] transition-colors hover:bg-[#FF4D4D]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelOrder.isPending && <Loader2 size={16} className="animate-spin" />}
                {cancelOrder.isPending
                  ? t.account.orderDetail.cancelling
                  : confirming
                    ? t.account.orderDetail.cancelConfirm
                    : t.account.orderDetail.cancelOrder}
              </button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function AccountOrderDetailPage() {
  return (
    <ProtectedRoute>
      <OrderDetailContent />
    </ProtectedRoute>
  );
}
