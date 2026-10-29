import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ProtectedRoute } from "../components/marketplace/protected-route";
import { StatusBadge, rfqStatusTone } from "../components/marketplace/status-badge";
import { useAcceptRfq, useDeclineRfq, useRfqRequest } from "../queries/rfq";
import { formatPriceCents } from "../lib/money";
import { useLang } from "../i18n";

function RfqDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { t, lang, dir } = useLang();
  const rfqId = Number(id);
  const rfqQuery = useRfqRequest(Number.isFinite(rfqId) ? rfqId : undefined);
  const acceptRfq = useAcceptRfq();
  const declineRfq = useDeclineRfq();
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const [acceptedOrderNumber, setAcceptedOrderNumber] = useState<string | null>(null);

  if (rfqQuery.isLoading) {
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

  const request = rfqQuery.data;

  if (rfqQuery.isError || !request) {
    return (
      <div className="min-h-[100svh] bg-[#0b1f3a]">
        <Nav />
        <div className="mx-auto max-w-2xl px-6 pt-48 pb-24 text-center">
          <h1 className="font-display text-3xl font-extrabold text-white">{t.account.rfqDetail.notFound}</h1>
          <Link
            href="/account/rfqs"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
          >
            {dir === "rtl" ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {t.account.rfqDetail.backToRfqs}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const name = lang === "ar" ? request.product.nameAr : request.product.nameEn;
  const currency = request.variant?.currency ?? "JOD";
  const isAccepted = request.status === "accepted" || acceptedOrderNumber !== null;

  async function handleAccept() {
    const order = await acceptRfq.mutateAsync({ id: request!.id });
    setAcceptedOrderNumber(order.orderNumber);
  }

  async function handleDecline() {
    if (!confirmingDecline) {
      setConfirmingDecline(true);
      return;
    }
    await declineRfq.mutateAsync({ id: request!.id });
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        path={`/account/rfqs/${request.id}`}
        custom={{ title: `${t.account.rfqDetail.title} | Saltus ONE`, desc: t.account.rfqs.meta.desc, keywords: t.account.rfqs.meta.keywords }}
        noindex
      />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-2xl px-6">
          <Link
            href="/account/rfqs"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#FF6B00] transition-colors hover:text-[#FF8A3D]"
          >
            {dir === "rtl" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            {t.account.rfqDetail.backToRfqs}
          </Link>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">{name}</h1>
            <StatusBadge
              label={t.account.rfqStatus[request.status as keyof typeof t.account.rfqStatus] ?? request.status}
              tone={rfqStatusTone(request.status)}
            />
          </div>

          <div className="glass-card mt-6 grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t.account.rfqDetail.product}</p>
              <p className="mt-1 text-sm text-white">
                {name}
                {request.variant ? ` — ${request.variant.name}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t.account.rfqDetail.qty}</p>
              <p className="mt-1 text-sm text-white">{request.qty}</p>
            </div>
          </div>

          {request.notes && (
            <div className="glass-card mt-4 rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t.account.rfqDetail.notesLabel}</p>
              <p className="mt-2 text-sm text-[#B9C2D0]">{request.notes}</p>
            </div>
          )}

          {isAccepted ? (
            <div className="glass-card mt-6 rounded-2xl p-6 text-center">
              <Check size={28} className="mx-auto text-[#6FE3A8]" />
              <p className="mt-3 text-sm text-[#B9C2D0]">{t.account.rfqDetail.orderCreated}</p>
              <Link
                href={acceptedOrderNumber ? `/account/orders/${acceptedOrderNumber}` : "/account/orders"}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
              >
                {t.account.rfqDetail.viewOrder}
              </Link>
            </div>
          ) : request.status === "quoted" && request.quotedPriceCents != null ? (
            <div className="glass-card mt-6 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/70">{t.account.rfqDetail.quotedPrice}</span>
                <span className="font-display text-xl font-bold text-[#FF8A3D]">
                  {formatPriceCents(request.quotedPriceCents, currency)}
                </span>
              </div>
              {request.validUntil && (
                <p className="mt-2 text-xs text-[#B9C2D0]/60">
                  {t.account.rfqDetail.validUntil}: {new Date(request.validUntil).toLocaleDateString(lang === "ar" ? "ar" : "en-GB")}
                </p>
              )}

              {acceptRfq.isError && <p className="mt-3 text-sm text-[#FF8A8A]">{t.account.rfqDetail.acceptError}</p>}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleAccept}
                  disabled={acceptRfq.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {acceptRfq.isPending && <Loader2 size={16} className="animate-spin" />}
                  {acceptRfq.isPending ? t.account.rfqDetail.accepting : t.account.rfqDetail.accept}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={declineRfq.isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-[#FF4D4D]/40 px-6 py-3 text-sm font-semibold text-[#FF8A8A] transition-colors hover:bg-[#FF4D4D]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {declineRfq.isPending && <Loader2 size={16} className="animate-spin" />}
                  {declineRfq.isPending
                    ? t.account.rfqDetail.declining
                    : confirmingDecline
                      ? t.account.rfqDetail.declineConfirm
                      : t.account.rfqDetail.decline}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card mt-6 rounded-2xl p-6 text-center text-sm text-[#B9C2D0]">
              {t.account.rfqDetail.waitingNotice}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function AccountRfqDetailPage() {
  return (
    <ProtectedRoute>
      <RfqDetailContent />
    </ProtectedRoute>
  );
}
