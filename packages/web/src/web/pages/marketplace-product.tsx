import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, ImageOff, Loader2, Minus, Plus, FileText } from "lucide-react";
import { Seo, SITE_URL } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { useProduct } from "../queries/catalog";
import { useSession } from "../queries/account";
import { useAddToCart } from "../queries/cart";
import { formatPriceCents } from "../lib/money";
import { useLang } from "../i18n";

export default function MarketplaceProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, dir } = useLang();
  const [, navigate] = useLocation();
  const query = useProduct(slug);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const { data: session } = useSession();
  const addToCart = useAddToCart();

  if (query.isLoading) {
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

  if (query.isError || !query.data) {
    return (
      <div className="min-h-[100svh] bg-[#0b1f3a]">
        <Nav />
        <div className="mx-auto max-w-2xl px-6 pt-48 pb-24 text-center">
          <h1 className="font-display text-3xl font-extrabold text-white">{t.marketplace.product.notFoundTitle}</h1>
          <p className="mt-4 text-[#B9C2D0]">{t.marketplace.product.notFoundDesc}</p>
          <Link
            href="/marketplace"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
          >
            {dir === "rtl" ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {t.marketplace.product.backToMarketplace}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const product = query.data;
  const name = lang === "ar" ? product.nameAr : product.nameEn;
  const description = lang === "ar" ? product.descriptionAr : product.descriptionEn;
  const images = product.images;
  const minVariantPrice = product.variants.length
    ? Math.min(...product.variants.map((v) => v.priceCents))
    : null;
  const currency = product.variants[0]?.currency ?? "JOD";
  const activeVariantId = selectedVariantId ?? product.variants[0]?.id ?? null;
  const activeVariant = product.variants.find((v) => v.id === activeVariantId) ?? null;

  const redirectTarget = `/marketplace/product/${product.slug}`;
  const loginHref = `/account/login?redirect=${encodeURIComponent(redirectTarget)}`;
  const rfqHref = `/marketplace/rfq/${product.slug}`;

  async function handleAddToCart() {
    if (!activeVariantId) return;
    setJustAdded(false);
    try {
      await addToCart.mutateAsync({ productId: product.id, variantId: activeVariantId, qty });
      setJustAdded(true);
    } catch {
      setJustAdded(false);
    }
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        path={`/marketplace/product/${product.slug}`}
        custom={{
          title: `${name} | Saltus ONE Marketplace`,
          desc: (description ?? t.marketplace.desc).slice(0, 300),
          keywords: `${name}, ${t.marketplace.meta.keywords}`,
        }}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description: description ?? undefined,
          sku: product.sku,
          url: `${SITE_URL}/marketplace/product/${product.slug}`,
          image: images.map((img) => img.url),
          offers: product.variants.map((v) => ({
            "@type": "Offer",
            name: v.name,
            price: (v.priceCents / 1000).toFixed(3),
            priceCurrency: v.currency,
            availability: "https://schema.org/InStock",
          })),
        }}
      />
      <Nav />

      <section className="bg-[#0b1f3a] pt-36 pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#FF6B00] transition-colors hover:text-[#FF8A3D]"
          >
            {dir === "rtl" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            {t.marketplace.product.backToMarketplace}
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="glass-card aspect-[4/3] w-full overflow-hidden rounded-2xl">
                {images.length > 0 ? (
                  <img src={images[activeImage]?.url} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <ImageOff size={48} />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        i === activeImage ? "border-[#FF6B00]" : "border-white/10"
                      }`}
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex flex-wrap gap-1.5">
                {product.allowDirectPurchase && (
                  <span className="rounded-full bg-[#0b1f3a] border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {t.marketplace.product.directPurchaseBadge}
                  </span>
                )}
                {product.allowRfq && (
                  <span className="rounded-full bg-[#FF6B00]/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {t.marketplace.product.rfqBadge}
                  </span>
                )}
              </div>

              <h1 className="font-display mt-4 text-3xl font-extrabold text-white sm:text-4xl">{name}</h1>
              <p className="mt-2 text-xs uppercase tracking-wide text-[#B9C2D0]/60">
                {t.marketplace.product.sku}: {product.sku}
              </p>

              {minVariantPrice !== null && (
                <p className="mt-5 text-2xl font-bold text-[#FF8A3D]">
                  <span className="text-sm font-medium text-[#B9C2D0]">{t.marketplace.product.priceFrom} </span>
                  {formatPriceCents(minVariantPrice, currency)}
                </p>
              )}

              {description && (
                <div className="mt-8">
                  <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white/80">
                    {t.marketplace.product.descriptionTitle}
                  </h2>
                  <p className="mt-3 leading-relaxed text-[#B9C2D0]">{description}</p>
                </div>
              )}

              {product.variants.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white/80">
                    {t.marketplace.product.optionsTitle}
                  </h2>
                  <div className="mt-3 space-y-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`glass-card flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm text-start transition-colors ${
                          v.id === activeVariantId ? "border border-[#FF6B00]" : "border border-transparent"
                        }`}
                      >
                        <span className="text-white">
                          {v.name}
                          {v.rentalUnit && <span className="ms-2 text-xs text-[#B9C2D0]/60">/ {v.rentalUnit}</span>}
                        </span>
                        <span className="font-semibold text-[#FF8A3D]">{formatPriceCents(v.priceCents, v.currency)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase / RFQ actions */}
              <div className="glass-card mt-10 space-y-5 rounded-2xl p-6">
                {product.allowDirectPurchase && (
                  <div>
                    {!session ? (
                      <div>
                        <p className="text-sm text-[#B9C2D0]">{t.marketplace.product.signInToBuy}</p>
                        <button
                          onClick={() => navigate(loginHref)}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
                        >
                          {t.marketplace.product.signInCta}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                            {t.marketplace.product.qtyLabel}
                          </span>
                          <div className="flex items-center gap-2 rounded-full border border-white/15 px-2 py-1">
                            <button
                              type="button"
                              onClick={() => setQty((q) => Math.max(1, q - 1))}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                              aria-label="-"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-white">{qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty((q) => q + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                              aria-label="+"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        {justAdded ? (
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-[#6FE3A8]">
                              <Check size={16} />
                              {t.marketplace.product.addedToCart}
                            </span>
                            <button
                              onClick={() => navigate("/marketplace/cart")}
                              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                            >
                              {t.marketplace.product.viewCart}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleAddToCart}
                            disabled={!activeVariant || addToCart.isPending}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {addToCart.isPending ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                {t.marketplace.product.addingToCart}
                              </>
                            ) : (
                              t.marketplace.product.buyNow
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    {addToCart.isError && (
                      <p className="mt-2 text-xs text-[#FF8A8A]">{t.marketplace.product.addToCartError}</p>
                    )}
                  </div>
                )}

                {product.allowDirectPurchase && product.allowRfq && (
                  <div className="h-px w-full bg-white/10" />
                )}

                {product.allowRfq && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[#B9C2D0]">{t.marketplace.product.requestQuoteCta}</p>
                    <Link
                      href={rfqHref}
                      className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-[#FF6B00] px-6 py-3 text-sm font-semibold text-[#FF6B00] transition-colors hover:bg-[#FF6B00]/10"
                    >
                      <FileText size={16} />
                      {t.marketplace.product.requestQuoteCta}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
