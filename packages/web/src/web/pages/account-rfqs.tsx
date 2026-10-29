import { Link } from "wouter";
import { FileSearch, Loader2 } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ProtectedRoute } from "../components/marketplace/protected-route";
import { StatusBadge, rfqStatusTone } from "../components/marketplace/status-badge";
import { useRfqs } from "../queries/rfq";
import { formatPriceCents } from "../lib/money";
import { useLang } from "../i18n";

function RfqsContent() {
  const { t, lang } = useLang();
  const rfqsQuery = useRfqs();
  const requests = rfqsQuery.data ?? [];

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo path="/account/rfqs" custom={t.account.rfqs.meta} noindex />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.account.rfqs.eyebrow}
          </span>
          <h1 className="font-display mt-3 text-3xl font-extrabold text-white sm:text-4xl">{t.account.rfqs.title}</h1>
          <p className="mt-2 text-sm text-[#B9C2D0]">{t.account.rfqs.desc}</p>

          {rfqsQuery.isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={32} className="animate-spin text-[#FF6B00]" />
            </div>
          ) : requests.length === 0 ? (
            <div className="glass-card mt-10 rounded-2xl px-6 py-20 text-center">
              <FileSearch size={36} className="mx-auto text-white/20" />
              <p className="font-display mt-4 text-xl font-bold text-white">{t.account.rfqs.empty}</p>
              <p className="mt-2 text-sm text-[#B9C2D0]">{t.account.rfqs.emptyDesc}</p>
              <Link
                href="/marketplace"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
              >
                {t.account.rfqs.browseCta}
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {requests.map((request) => {
                const name = lang === "ar" ? request.product.nameAr : request.product.nameEn;
                return (
                  <Link
                    key={request.id}
                    href={`/account/rfqs/${request.id}`}
                    className="glass-card flex flex-col gap-3 rounded-2xl p-5 transition-colors hover:border-[#FF6B00]/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="font-display block truncate text-base font-bold text-white">{name}</span>
                      <span className="text-xs text-[#B9C2D0]/60">
                        {t.account.rfqs.quotedPrice}:{" "}
                        {request.quotedPriceCents != null
                          ? formatPriceCents(request.quotedPriceCents, request.variant?.currency ?? "JOD")
                          : "—"}
                      </span>
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-4">
                      <StatusBadge
                        label={t.account.rfqStatus[request.status as keyof typeof t.account.rfqStatus] ?? request.status}
                        tone={rfqStatusTone(request.status)}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function AccountRfqsPage() {
  return (
    <ProtectedRoute>
      <RfqsContent />
    </ProtectedRoute>
  );
}
