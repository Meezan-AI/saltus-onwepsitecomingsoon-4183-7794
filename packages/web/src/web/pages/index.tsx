import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Hero } from "../components/hero";
import { Stats } from "../components/stats";
import { Intro } from "../components/intro";
import { ServicesGrid } from "../components/services-grid";
import { ConferencesSection } from "../components/conferences-section";
import { WhyUs } from "../components/why-us";
import { Process } from "../components/process";
import { Showcase } from "../components/showcase";
import { Industries } from "../components/industries";
import { Faq, faqJsonLd } from "../components/faq";
import { Cta } from "../components/cta";
import { ContactSection } from "../components/contact-section";
import { Partners } from "../components/partners";
import { Portfolio } from "../components/portfolio";
import { Testimonials } from "../components/testimonials";
import { InsightsTeaser } from "../components/insights-teaser";
import { LeadForm } from "../components/lead-form";
import { Footer } from "../components/footer";
import { useLang } from "../i18n";

export default function Index() {
  const { t } = useLang();

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo page="home" path="/" jsonLd={faqJsonLd(t.faq.items)} />
      <Nav />
      <Hero />
      <Stats />
      <Partners />
      <Intro />
      <ServicesGrid />
      <ConferencesSection />
      <WhyUs />
      <Process />
      <Portfolio />
      <Testimonials />
      <Showcase />
      <Industries />
      <InsightsTeaser />
      <Faq />
      <Cta />
      <ContactSection />
      <section className="bg-[#060f1f] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <LeadForm />
        </div>
      </section>
      <Footer />
    </div>
  );
}
