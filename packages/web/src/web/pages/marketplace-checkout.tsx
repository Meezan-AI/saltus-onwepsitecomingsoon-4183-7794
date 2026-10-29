import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ProtectedRoute } from "../components/marketplace/protected-route";
import { AddressForm } from "../components/marketplace/address-form";
import { useCart } from "../queries/cart";
import { useAddresses } from "../queries/addresses";
import { useCheckout } from "../queries/orders";
import { formatPriceCents } from "../lib/money";
import { useLang } from "../i18n";

const textareaClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07]";

function CheckoutContent() {
  const { t, lang, dir } = useLang();
  const [, navigate] = useLocation();

  const cartQuery = useCart();
  const addressesQuery = useAddresses();
  const checkout = useCheckout();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [notes, setNotes] = useState("");

  const items = cartQuery.data?.items ?? [];
  const needsDelivery = items.some((item) => item.product.fulfillmentType !== "pickup_rental");
  const addresses = addressesQuery.data ?? [];
  const subtotalCents = items.reduce((sum, item) => sum + (item.variant?.priceCents ?? 0) * item.qty, 0);
  const currency = items[0]?.variant?.currency ?? "JOD";

  const effectiveAddressId =
    selectedAddressId ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;

  async function placeOrder() {
    if (needsDelivery && !effectiveAddressId) return;
    try {
      const createdOrders = await checkout.mutateAsync({
        deliveryAddressId: needsDelivery ? (effectiveAddressId ?? undefined) : undefined,
        notes: notes || undefined,
      });
      const orderNumbers = createdOrders.map((o) => o.orderNumber).join(",");
      navigate(`/marketplace/checkout/confirmation?orders=${encodeURIComponent(orderNumbers)}`);
    } catch {
      // error surfaced via checkout.isError below
    }
  }

  if (cartQuery.isLoading) {
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

  if (items.length === 0) {
    navigate("/marketplace/cart", { replace: true });
    return null;
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo path="/marketplace/checkout" custom={t.checkout.meta} noindex />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{t.checkout.eyebrow}</span>
          <h1 className="font-display mt-3 text-3xl font-extrabold text-white sm:text-4xl">{t.checkout.title}</h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6">
              {needsDelivery && (
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white/80">
                    {t.checkout.addressTitle}
                  </h2>

                  {addresses.length === 0 && !addingAddress && (
                    <p className="mt-3 text-sm text-[#B9C2D0]">{t.checkout.addressEmpty}</p>
                  )}

                  {addresses.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {addresses.map((address) => (
                        <label
                          key={address.id}
                          className={`glass-card flex cursor-pointer items-start gap-3 rounded-xl p-4 text-sm transition-colors ${
                            effectiveAddressId === address.id ? "border border-[#FF6B00]" : "border border-transparent"
                          }`}
                        >
                          <input
                            type="radio"
                            checked={effectiveAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="mt-1 h-4 w-4 accent-[#FF6B00]"
                          />
                          <span>
                            <span className="font-semibold text-white">
                              {address.label ? `${address.label} — ` : ""}
                              {address.recipientName}
                            </span>
                            <br />
                            <span className="text-[#B9C2D0]/80">
                              {address.addressLine1}
                              {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}
                            </span>
                            <br />
                            <span dir="ltr" className="text-[#B9C2D0]/60">
                              {address.phone}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {addingAddress ? (
                    <div className="mt-4">
                      <AddressForm
                        strings={t.checkout.addressForm}
                        onSaved={(id) => {
                          setSelectedAddressId(id);
                          setAddingAddress(false);
                        }}
                        onCancel={() => setAddingAddress(false)}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingAddress(true)}
                      className="mt-4 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      {t.checkout.addAddress}
                    </button>
                  )}
                </div>
              )}

              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white/80">
                  {t.checkout.notesLabel}
                </h2>
                <textarea
                  dir={dir}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.checkout.notesPlaceholder}
                  rows={3}
                  className={`${textareaClass} mt-3`}
                />
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white/80">
                  {t.checkout.paymentTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#B9C2D0]">{t.checkout.paymentDesc}</p>
              </div>
            </div>

            <div className="glass-card h-fit rounded-2xl p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white/80">
                {t.checkout.summaryTitle}
              </h2>
              <div className="mt-4 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="min-w-0 truncate pe-3 text-[#B9C2D0]">
                      {(lang === "ar" ? item.product.nameAr : item.product.nameEn)} × {item.qty}
                    </span>
                    <span className="flex-shrink-0 font-semibold text-white">
                      {formatPriceCents((item.variant?.priceCents ?? 0) * item.qty, currency)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm font-semibold text-white/70">{t.checkout.totalLabel}</span>
                <span className="font-display text-xl font-bold text-white">
                  {formatPriceCents(subtotalCents, currency)}
                </span>
              </div>

              {checkout.isError && <p className="mt-3 text-sm text-[#FF8A8A]">{t.checkout.error}</p>}

              <button
                onClick={placeOrder}
                disabled={checkout.isPending || (needsDelivery && !effectiveAddressId)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkout.isPending && <Loader2 size={16} className="animate-spin" />}
                {checkout.isPending ? t.checkout.placingOrder : t.checkout.placeOrder}
              </button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function MarketplaceCheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
