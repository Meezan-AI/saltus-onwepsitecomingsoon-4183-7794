import { Seo, SITE_URL } from "../components/seo";
import { Nav } from "../components/nav";
import { InsightCard } from "../components/insights-teaser";
import { Cta } from "../components/cta";
import { Footer } from "../components/footer";
import { useLang } from "../i18n";

export default function InsightsPage() {
  const { t } = useLang();

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        page="insights"
        path="/insights"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: t.insights.pageTitle,
          url: `${SITE_URL}/insights`,
          blogPost: t.insights.posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            description: p.excerpt,
            datePublished: p.date,
            url: `${SITE_URL}/insights/${p.slug}`,
            image: `${SITE_URL}${p.cover}`,
            author: { "@type": "Organization", name: "Saltus ONE" },
          })),
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
            {t.insights.eyebrow}
          </span>
          <h1 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-6xl">{t.insights.pageTitle}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#B9C2D0]">{t.insights.pageLead}</p>
        </div>
      </section>

      <section className="bg-[#0b1f3a] py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-3">
          {t.insights.posts.map((p, i) => (
            <InsightCard key={p.slug} post={p} delay={(i % 3) * 0.08} />
          ))}
        </div>
      </section>

      <Cta />
      <Footer />
    </div>
  );
}
