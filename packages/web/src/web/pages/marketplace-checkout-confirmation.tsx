import { Link, useSearch } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ProtectedRoute } from "../components/marketplace/protected-route";
import { useLang } from "../i18n";

function ConfirmationContent() {
  const { t } = useLang();
  const search = useSearch();
  const ordersParam = new URLSearchParams(search).get("orders") ?? "";
  const orderNumbers = ordersParam.split(",").filter(Boolean);

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo path="/marketplace/checkout/confirmation" custom={t.checkoutConfirmation.meta} noindex />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-xl px-6 text-center">
          {orderNumbers.length === 0 ? (
            <p className="text-sm text-[#B9C2D0]">{t.checkoutConfirmation.notFound}</p>
          ) : (
            <>
              <div className="glass-card mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle2 size={36} className="text-[#6FE3A8]" />
              </div>
              <h1 className="font-display mt-6 text-3xl font-extrabold text-white sm:text-4xl">
                {t.checkoutConfirmation.title}
              </h1>
              <p className="mt-3 text-sm text-[#B9C2D0]">{t.checkoutConfirmation.desc}</p>

              <div className="mt-8 space-y-3">
                {orderNumbers.map((orderNumber) => (
                  <div
                    key={orderNumber}
                    className="glass-card flex items-center justify-between rounded-2xl p-5 text-start"
                  >
                    <span>
                      <span className="block text-xs uppercase tracking-wide text-[#B9C2D0]/60">
                        {t.checkoutConfirmation.orderNumber}
                      </span>
                      <span dir="ltr" className="font-display block text-base font-bold text-white">
                        {orderNumber}
                      </span>
                    </span>
                    <Link
                      href={`/account/orders/${orderNumber}`}
                      className="flex-shrink-0 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      {t.checkoutConfirmation.viewOrder}
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          <Link
            href="/marketplace"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
          >
            {t.checkoutConfirmation.continueShopping}
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function MarketplaceCheckoutConfirmationPage() {
  return (
    <ProtectedRoute>
      <ConfirmationContent />
    </ProtectedRoute>
  );
}
