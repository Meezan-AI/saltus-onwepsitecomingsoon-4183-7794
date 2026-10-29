import { Link, useLocation } from "wouter";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ProtectedRoute } from "../components/marketplace/protected-route";
import { useCart, useRemoveCartItem, useUpdateCartItemQty } from "../queries/cart";
import { formatPriceCents } from "../lib/money";
import { useLang } from "../i18n";

function CartContent() {
  const { t, lang } = useLang();
  const [, navigate] = useLocation();
  const cartQuery = useCart();
  const updateQty = useUpdateCartItemQty();
  const removeItem = useRemoveCartItem();

  const items = cartQuery.data?.items ?? [];
  const subtotalCents = items.reduce((sum, item) => sum + (item.variant?.priceCents ?? 0) * item.qty, 0);
  const currency = items[0]?.variant?.currency ?? "JOD";
  const fulfillmentTypes = new Set(items.map((item) => item.product.fulfillmentType));

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo path="/marketplace/cart" custom={t.cart.meta} noindex />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{t.cart.eyebrow}</span>
          <h1 className="font-display mt-3 text-3xl font-extrabold text-white sm:text-4xl">{t.cart.title}</h1>
          <p className="mt-2 text-sm text-[#B9C2D0]">{t.cart.desc}</p>

          {cartQuery.isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={32} className="animate-spin text-[#FF6B00]" />
            </div>
          ) : items.length === 0 ? (
            <div className="glass-card mt-10 rounded-2xl px-6 py-20 text-center">
              <ShoppingCart size={36} className="mx-auto text-white/20" />
              <p className="font-display mt-4 text-xl font-bold text-white">{t.cart.empty}</p>
              <p className="mt-2 text-sm text-[#B9C2D0]">{t.cart.emptyDesc}</p>
              <Link
                href="/marketplace"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
              >
                {t.cart.browseCta}
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {fulfillmentTypes.size > 1 && (
                <div className="rounded-xl border border-[#FF6B00]/30 bg-[#FF6B00]/10 px-4 py-3 text-sm text-[#FF8A3D]">
                  {t.cart.mixedNotice}
                </div>
              )}

              <div className="space-y-3">
                {items.map((item) => {
                  const name = lang === "ar" ? item.product.nameAr : item.product.nameEn;
                  const lineTotal = (item.variant?.priceCents ?? 0) * item.qty;
                  return (
                    <div key={item.id} className="glass-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-display truncate text-base font-bold text-white">{name}</p>
                        {item.variant && (
                          <p className="mt-1 text-xs text-[#B9C2D0]/70">
                            {item.variant.name}
                            {item.variant.rentalUnit ? ` / ${item.variant.rentalUnit}` : ""}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-semibold text-[#FF8A3D]">
                          {item.variant ? formatPriceCents(item.variant.priceCents, item.variant.currency) : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 rounded-full border border-white/15 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateQty.mutate({ itemId: item.id, qty: Math.max(1, item.qty - 1) })}
                            disabled={updateQty.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-white">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty.mutate({ itemId: item.id, qty: item.qty + 1 })}
                            disabled={updateQty.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <p className="w-24 flex-shrink-0 text-end text-sm font-bold text-white">
                          {formatPriceCents(lineTotal, currency)}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeItem.mutate({ itemId: item.id })}
                          disabled={removeItem.isPending}
                          aria-label={t.cart.remove}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-[#FF8A8A]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass-card flex items-center justify-between rounded-2xl p-6">
                <span className="text-sm font-semibold text-white/70">{t.cart.subtotalLabel}</span>
                <span className="font-display text-xl font-bold text-white">
                  {formatPriceCents(subtotalCents, currency)}
                </span>
              </div>

              <button
                onClick={() => navigate("/marketplace/checkout")}
                className="flex w-full items-center justify-center rounded-full bg-[#FF6B00] px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
              >
                {t.cart.checkoutCta}
              </button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function MarketplaceCartPage() {
  return (
    <ProtectedRoute>
      <CartContent />
    </ProtectedRoute>
  );
}
