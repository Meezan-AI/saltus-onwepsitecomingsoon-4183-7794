import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Phone } from "lucide-react";
import { Seo, SITE_URL } from "../components/seo";
import { Nav } from "../components/nav";
import { Reveal } from "../components/reveal";
import { LeadForm } from "../components/lead-form";
import { Footer } from "../components/footer";
import { SERVICE_ICONS } from "../components/services-grid";
import { useLang } from "../i18n";
import { PHONE_DISPLAY, PHONE_TEL } from "../lib/contact";
import ServicesFallback from "./services";

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, dir, lang } = useLang();

  const service = t.services.items.find((s) => s.slug === slug);
  if (!service) return <ServicesFallback />;

  const Icon = SERVICE_ICONS[service.slug] ?? Check;
  const related = t.services.items.filter((s) => s.slug !== service.slug).slice(0, 3);
  const interestLabel = t.form.interestOptions.find((o) => o.value === service.slug)?.label;

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        path={`/services/${service.slug}`}
        custom={{
          title: `${service.title} | Saltus ONE`,
          desc: service.desc.slice(0, 300),
          keywords: `${service.title}, ${service.bullets.slice(0, 5).join(", ")}, Saltus ONE Jordan`,
          image: service.img,
        }}
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              name: service.title,
              description: service.desc,
              serviceType: service.title,
              inLanguage: lang,
              image: `${SITE_URL}${service.img}`,
              url: `${SITE_URL}/services/${service.slug}`,
              provider: { "@type": "Organization", name: "Saltus ONE", url: SITE_URL },
              areaServed: ["Jordan", "Middle East"],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: service.title,
                itemListElement: service.bullets.map((b) => ({
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name: b },
                })),
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: t.nav.home, item: SITE_URL },
                { "@type": "ListItem", position: 2, name: t.nav.services, item: `${SITE_URL}/services` },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: service.title,
                  item: `${SITE_URL}/services/${service.slug}`,
                },
              ],
            },
          ],
        }}
      />
      <Nav />

      <section className="relative overflow-hidden bg-[#060f1f] pt-36 pb-20">
        <div className="absolute inset-0">
          <img src={service.img} alt="" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/85 to-[#0b1f3a]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <nav className="flex items-center gap-2 text-xs text-white/45">
            <Link href="/" className="hover:text-white">
              {t.nav.home}
            </Link>
            <ChevronRight size={13} className={dir === "rtl" ? "rotate-180" : ""} />
            <Link href="/services" className="hover:text-white">
              {t.servicePage.breadcrumb}
            </Link>
            <ChevronRight size={13} className={dir === "rtl" ? "rotate-180" : ""} />
            <span className="text-[#FF6B00]">{service.title}</span>
          </nav>

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B00] shadow-lg shadow-orange-900/40">
                <Icon size={28} className="text-white" />
              </div>
              <h1 className="font-display mt-7 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                {service.title}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[#B9C2D0]">{service.short}</p>
              <div className="mt-9 flex flex-wrap gap-4">
                <a
                  href="#service-form"
                  data-analytics-cta={service.slug}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition-transform hover:scale-105"
                >
                  {t.servicePage.talkToTeam}
                  <ArrowRight size={16} className={dir === "rtl" ? "rotate-180" : ""} />
                </a>
                <a
                  href={PHONE_TEL}
                  dir="ltr"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#0b1f3a]"
                >
                  <Phone size={15} />
                  {PHONE_DISPLAY}
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="glass-card overflow-hidden rounded-3xl">
                <img src={service.img} alt={service.title} className="h-80 w-full object-cover sm:h-96" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-[#0b1f3a] py-24">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
              {t.servicePage.overviewTitle}
            </span>
            <h2 className="font-display mt-4 text-3xl font-extrabold text-white sm:text-4xl">{service.title}</h2>
            <p className="mt-6 leading-relaxed text-[#B9C2D0]">{service.desc}</p>

            <h3 className="font-display mt-12 text-2xl font-bold text-white">{t.servicePage.whyTitle}</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {t.why.items.slice(0, 4).map((w) => (
                <div key={w.title} className="glass-card rounded-2xl p-5">
                  <p className="font-display text-sm font-bold text-white">{w.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#B9C2D0]">{w.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass-card rounded-3xl p-8">
              <h3 className="font-display text-xl font-bold text-white">{t.servicePage.deliverablesTitle}</h3>
              <ul className="mt-6 grid gap-3.5">
                {service.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/20">
                      <Check size={12} className="text-[#FF6B00]" />
                    </span>
                    <span className="text-sm leading-relaxed text-white/85">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="service-form" className="scroll-mt-28 bg-[#060f1f] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <LeadForm defaultInterest={interestLabel} title={t.servicePage.formTitle} desc={t.servicePage.formDesc} />
        </div>
      </section>

      <section className="bg-[#0b1f3a] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold text-white">{t.servicePage.relatedTitle}</h2>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:text-[#ff8a3d]"
            >
              <ArrowLeft size={15} className={dir === "rtl" ? "rotate-180" : ""} />
              {t.servicePage.backToServices}
            </Link>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((s, i) => {
              const RIcon = SERVICE_ICONS[s.slug] ?? Check;
              return (
                <Reveal key={s.slug} delay={i * 0.08}>
                  <Link href={`/services/${s.slug}`} className="block h-full">
                    <div className="glass-card glow-orange h-full rounded-3xl p-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B00]/15">
                        <RIcon size={19} className="text-[#FF6B00]" />
                      </div>
                      <h3 className="font-display mt-5 text-lg font-bold text-white">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#B9C2D0]">{s.short}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF6B00]">
                        {t.services.learnMore}
                        <ArrowRight size={15} className={dir === "rtl" ? "rotate-180" : ""} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
