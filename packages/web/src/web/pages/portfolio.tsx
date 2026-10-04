import { Seo, SITE_URL } from "../components/seo";
import { Nav } from "../components/nav";
import { Portfolio } from "../components/portfolio";
import { Testimonials } from "../components/testimonials";
import { Cta } from "../components/cta";
import { Footer } from "../components/footer";
import { useLang } from "../i18n";

export default function PortfolioPage() {
  const { t } = useLang();

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        page="portfolio"
        path="/portfolio"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.portfolio.pageTitle,
          url: `${SITE_URL}/portfolio`,
          hasPart: t.portfolio.items.map((p) => ({
            "@type": "CreativeWork",
            name: p.title,
            description: p.desc,
            image: `${SITE_URL}${p.img}`,
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
            {t.portfolio.eyebrow}
          </span>
          <h1 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-6xl">
            {t.portfolio.pageTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#B9C2D0]">{t.portfolio.pageLead}</p>
        </div>
      </section>

      <Portfolio full />
      <Testimonials />
      <Cta />
      <Footer />
    </div>
  );
}
