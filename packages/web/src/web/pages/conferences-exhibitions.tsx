import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { ConferencesSection } from "../components/conferences-section";
import { Process } from "../components/process";
import { Cta } from "../components/cta";
import { ContactSection } from "../components/contact-section";
import { Footer } from "../components/footer";
import { useLang } from "../i18n";

export default function ConferencesPage() {
  const { t } = useLang();

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        page="conferences"
        path="/conferences-exhibitions"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: t.conferences.title,
          provider: { "@type": "Organization", name: "Saltus ONE" },
          areaServed: ["Jordan", "Middle East"],
          description: t.meta.conferences.desc,
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: t.conferences.eyebrow,
            itemListElement: t.conferences.capabilities.map((c) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: c.title, description: c.desc },
            })),
          },
        }}
      />
      <Nav />
      <section className="relative overflow-hidden bg-[#060f1f] pt-40 pb-16">
        <div className="absolute inset-0">
          <img src="/images/conference-hall.png" alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/70 to-[#0b1f3a]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.conferences.eyebrow}
          </span>
          <h1 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-6xl">{t.conferences.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#B9C2D0]">{t.conferences.desc}</p>
        </div>
      </section>
      <ConferencesSection full />
      <Process />
      <Cta />
      <ContactSection />
      <Footer />
    </div>
  );
}
