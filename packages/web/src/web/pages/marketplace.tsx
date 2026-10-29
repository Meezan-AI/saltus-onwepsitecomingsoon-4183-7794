import { useMemo, useState } from "react";
import { Search, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ProductCard } from "../components/marketplace/product-card";
import { useCategories, useProducts } from "../queries/catalog";
import { useLang } from "../i18n";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07]";

const PAGE_SIZE = 24;

export default function MarketplacePage() {
  const { t, dir } = useLang();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const categoriesQuery = useCategories();
  const productsQuery = useProducts({ categorySlug: category, q: query || undefined, page, pageSize: PAGE_SIZE });

  const data = productsQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const hasFilters = Boolean(category || query);

  const resultsCount = useMemo(
    () => (data ? t.marketplace.resultsCount.replace("{count}", String(data.total)) : ""),
    [data, t.marketplace.resultsCount],
  );

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  function clearFilters() {
    setSearch("");
    setQuery("");
    setCategory(undefined);
    setPage(1);
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        path="/marketplace"
        custom={{
          title: t.marketplace.meta.title,
          desc: t.marketplace.meta.desc,
          keywords: t.marketplace.meta.keywords,
        }}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.marketplace.title,
          description: t.marketplace.desc,
        }}
      />
      <Nav />

      <section className="relative overflow-hidden bg-[#060f1f] pt-40 pb-16">
        <div className="absolute inset-0">
          <img src="/images/hero-bg.png" alt="" className="h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/70 to-[#0b1f3a]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.marketplace.eyebrow}
          </span>
          <h1 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-6xl">{t.marketplace.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#B9C2D0]">{t.marketplace.desc}</p>
        </div>
      </section>

      <section className="bg-[#0b1f3a] py-16">
        <div className="mx-auto max-w-7xl px-6">
          {/* Search */}
          <form onSubmit={submitSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-white/30 ltr:left-4 rtl:right-4"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.marketplace.searchPlaceholder}
                className={`${inputClass} ltr:pl-10 rtl:pr-10`}
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
            >
              {t.marketplace.searchPlaceholder.replace("...", "")}
            </button>
          </form>

          {/* Category pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCategory(undefined);
                setPage(1);
              }}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                !category
                  ? "border-[#FF6B00] bg-[#FF6B00]/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:border-[#FF6B00] hover:text-white"
              }`}
            >
              {t.marketplace.allCategories}
            </button>
            {categoriesQuery.data?.map((c) => (
              <button
                key={c.slug}
                onClick={() => {
                  setCategory(c.slug);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  category === c.slug
                    ? "border-[#FF6B00] bg-[#FF6B00]/15 text-white"
                    : "border-white/20 bg-white/5 text-white/80 hover:border-[#FF6B00] hover:text-white"
                }`}
              >
                {dir === "rtl" ? c.nameAr : c.nameEn}
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/50 transition-colors hover:text-white"
              >
                <X size={12} />
                {t.marketplace.clearFilters}
              </button>
            )}
          </div>

          {/* Results count */}
          {data && !productsQuery.isLoading && (
            <p className="mt-6 text-sm text-[#B9C2D0]/70">{resultsCount}</p>
          )}

          {/* Grid */}
          <div className="mt-6">
            {productsQuery.isLoading ? (
              <div className="flex justify-center py-24">
                <Loader2 size={32} className="animate-spin text-[#FF6B00]" />
              </div>
            ) : data && data.items.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl px-6 py-20 text-center">
                <p className="font-display text-xl font-bold text-white">{t.marketplace.noResultsTitle}</p>
                <p className="mt-2 text-sm text-[#B9C2D0]">{t.marketplace.noResultsDesc}</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {data && data.total > PAGE_SIZE && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:border-[#FF6B00] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={14} className="rtl:rotate-180" />
                {t.marketplace.pagePrev}
              </button>
              <span className="text-xs text-[#B9C2D0]/70">
                {t.marketplace.pageOf.replace("{page}", String(page)).replace("{total}", String(totalPages))}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:border-[#FF6B00] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                {t.marketplace.pageNext}
                <ChevronRight size={14} className="rtl:rotate-180" />
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
