import { Link } from "wouter";
import { ArrowRight, ImageOff } from "lucide-react";
import { useLang } from "../../i18n";
import { formatPriceCents } from "../../lib/money";

type ProductCardData = {
  slug: string;
  nameEn: string;
  nameAr: string;
  coverImageUrl: string | null;
  minPriceCents: number | null;
  currency: string;
  allowDirectPurchase: boolean;
  allowRfq: boolean;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { lang, t } = useLang();
  const name = lang === "ar" ? product.nameAr : product.nameEn;

  return (
    <Link
      href={`/marketplace/product/${product.slug}`}
      className="glass-card glow-orange group flex flex-col overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#142B4D]">
        {product.coverImageUrl ? (
          <img
            src={product.coverImageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <ImageOff size={36} />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.allowDirectPurchase && (
            <span className="rounded-full bg-[#0b1f3a]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
              {t.marketplace.card.directPurchase}
            </span>
          )}
          {product.allowRfq && (
            <span className="rounded-full bg-[#FF6B00]/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
              {t.marketplace.card.requestQuote}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display line-clamp-2 text-base font-bold text-white">{name}</h3>
        {product.minPriceCents !== null ? (
          <p className="text-sm text-[#B9C2D0]">
            <span className="text-xs">{t.marketplace.card.startingFrom}</span>{" "}
            <span className="font-semibold text-[#FF8A3D]">
              {formatPriceCents(product.minPriceCents, product.currency)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-[#B9C2D0]/70">{t.marketplace.card.requestQuote}</p>
        )}
        <span className="mt-auto flex items-center gap-1.5 pt-2 text-xs font-semibold text-[#FF6B00] transition-colors group-hover:text-[#FF8A3D]">
          {t.marketplace.card.viewDetails}
          <ArrowRight size={14} className="rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
