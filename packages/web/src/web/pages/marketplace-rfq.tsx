import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Check, Loader2, Minus, Plus } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { useProduct } from "../queries/catalog";
import { useSession } from "../queries/account";
import { useCreateRfq } from "../queries/rfq";
import { useLang } from "../i18n";

const textareaClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07]";

export default function MarketplaceRfqPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { t, lang, dir } = useLang();
  const query = useProduct(productSlug);
  const { data: session } = useSession();
  const createRfq = useCreateRfq();

  const [selectedVariantId, setSelectedVariantId] = useState<number | "any">("any");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

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

  const product = query.data;

  if (query.isError || !product || !product.allowRfq) {
    return (
      <div className="min-h-[100svh] bg-[#0b1f3a]">
        <Nav />
        <div className="mx-auto max-w-2xl px-6 pt-48 pb-24 text-center">
          <h1 className="font-display text-3xl font-extrabold text-white">{t.rfqRequest.notFound}</h1>
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

  const name = lang === "ar" ? product.nameAr : product.nameEn;
  const productHref = `/marketplace/product/${product.slug}`;
  const loginHref = `/account/login?redirect=${encodeURIComponent(`/marketplace/rfq/${product.slug}`)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createRfq.mutateAsync({
      productId: product!.id,
      variantId: selectedVariantId === "any" ? undefined : selectedVariantId,
      qty,
      notes: notes || undefined,
    });
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo path={`/marketplace/rfq/${product.slug}`} custom={t.rfqRequest.meta} noindex />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-2xl px-6">
          <Link
            href={productHref}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#FF6B00] transition-colors hover:text-[#FF8A3D]"
          >
            {dir === "rtl" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            {t.rfqRequest.backToProduct}
          </Link>

          <span className="mt-6 block text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.rfqRequest.eyebrow}
          </span>
          <h1 className="font-display mt-3 text-3xl font-extrabold text-white sm:text-4xl">{t.rfqRequest.title}</h1>
          <p className="mt-2 text-sm text-[#B9C2D0]">{t.rfqRequest.desc}</p>

          <div className="glass-card mt-8 rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t.rfqRequest.productLabel}</p>
            <p className="font-display mt-1 text-lg font-bold text-white">{name}</p>
          </div>

          {!session ? (
            <div className="glass-card mt-6 rounded-2xl p-6 text-center">
              <p className="text-sm text-[#B9C2D0]">{t.rfqRequest.signInNotice}</p>
              <Link
                href={loginHref}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
              >
                {t.rfqRequest.signInCta}
              </Link>
            </div>
          ) : createRfq.isSuccess ? (
            <div className="glass-card mt-6 rounded-2xl p-6 text-center">
              <Check size={32} className="mx-auto text-[#6FE3A8]" />
              <p className="font-display mt-4 text-xl font-bold text-white">{t.rfqRequest.successTitle}</p>
              <p className="mt-2 text-sm text-[#B9C2D0]">{t.rfqRequest.successDesc}</p>
              <Link
                href={`/account/rfqs/${createRfq.data?.id}`}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
              >
                {t.rfqRequest.viewRequest}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} dir={dir} className="glass-card mt-6 space-y-5 rounded-2xl p-6">
              {product.variants.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    {t.rfqRequest.variantLabel}
                  </p>
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVariantId("any")}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm text-start transition-colors ${
                        selectedVariantId === "any" ? "border-[#FF6B00] bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <span className="text-white">{t.rfqRequest.anyVariant}</span>
                    </button>
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm text-start transition-colors ${
                          selectedVariantId === v.id ? "border-[#FF6B00] bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"
                        }`}
                      >
                        <span className="text-white">
                          {v.name}
                          {v.rentalUnit && <span className="ms-2 text-xs text-[#B9C2D0]/60">/ {v.rentalUnit}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t.rfqRequest.qtyLabel}</p>
                <div className="mt-3 flex items-center gap-2 rounded-full border border-white/15 px-2 py-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-white">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t.rfqRequest.notesLabel}</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.rfqRequest.notesPlaceholder}
                  rows={4}
                  className={`${textareaClass} mt-3`}
                />
              </div>

              {createRfq.isError && <p className="text-sm text-[#FF8A8A]">{t.rfqRequest.error}</p>}

              <button
                type="submit"
                disabled={createRfq.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createRfq.isPending && <Loader2 size={16} className="animate-spin" />}
                {createRfq.isPending ? t.rfqRequest.submitting : t.rfqRequest.submit}
              </button>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
