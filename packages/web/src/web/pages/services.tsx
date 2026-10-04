import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Reveal } from "../components/reveal";
import { Cta } from "../components/cta";
import { Footer } from "../components/footer";
import { useLang } from "../i18n";

export default function ServicesPage() {
  const { t, dir } = useLang();

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        page="services"
        path="/services"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t.servicesPage.title,
          itemListElement: t.services.items.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.title,
            description: s.short,
          })),
        }}
      />
      <Nav />

      <section className="relative overflow-hidden bg-[#060f1f] pt-40 pb-20">
        <div className="absolute inset-0">
          <img src="/images/hero-bg.png" alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/70 to-[#0b1f3a]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.servicesPage.eyebrow}
          </span>
          <h1 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-6xl">
            {t.servicesPage.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#B9C2D0]">{t.servicesPage.lead}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {t.services.items.map((s) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:border-[#FF6B00] hover:text-white"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {t.services.items.map((s, i) => (
        <section
          key={s.slug}
          id={s.slug}
          className={`scroll-mt-28 py-24 ${i % 2 === 0 ? "bg-[#0b1f3a]" : "bg-[#060f1f]"}`}
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
            <Reveal className={i % 2 === 0 ? "" : "lg:order-2"}>
              <div className="glass-card overflow-hidden rounded-3xl">
                <img src={s.img} alt={s.title} className="h-80 w-full object-cover" />
              </div>
            </Reveal>
            <Reveal delay={0.1} className={i % 2 === 0 ? "" : "lg:order-1"}>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display mt-3 text-3xl font-extrabold text-white sm:text-4xl">{s.title}</h2>
              <p className="mt-5 leading-relaxed text-[#B9C2D0]">{s.desc}</p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/20">
                      <Check size={12} className="text-[#FF6B00]" />
                    </span>
                    <span className="text-sm text-white/85">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/services/${s.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
                >
                  {t.services.learnMore}
                  <ArrowRight size={16} className={dir === "rtl" ? "rotate-180" : ""} />
                </Link>
                {s.slug === "conferences-exhibitions" && (
                  <Link
                    href="/conferences-exhibitions"
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#0b1f3a]"
                  >
                    {t.conferences.ctaLabel}
                  </Link>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      <Cta />
      <Footer />
    </div>
  );
}
