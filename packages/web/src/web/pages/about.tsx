import { Target, Eye, Check } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Reveal } from "../components/reveal";
import { Stats } from "../components/stats";
import { WhyUs } from "../components/why-us";
import { Industries } from "../components/industries";
import { Cta } from "../components/cta";
import { Footer } from "../components/footer";
import { useLang } from "../i18n";

export default function AboutPage() {
  const { t } = useLang();

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        page="about"
        path="/about"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: t.about.title,
          description: t.about.lead,
        }}
      />
      <Nav />

      <section className="relative overflow-hidden bg-[#060f1f] pt-40 pb-20">
        <div className="absolute inset-0">
          <img src="/images/about-office.png" alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/70 to-[#0b1f3a]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{t.about.eyebrow}</span>
          <h1 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-6xl">{t.about.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#B9C2D0]">{t.about.lead}</p>
        </div>
      </section>

      <Stats />

      <section className="bg-[#0b1f3a] py-24">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2">
          <Reveal className="flex flex-col gap-5">
            {t.about.body.map((p) => (
              <p key={p} className="leading-relaxed text-[#B9C2D0]">
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-5">
            <div className="glass-card rounded-3xl p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00]/15">
                <Target size={22} className="text-[#FF6B00]" />
              </div>
              <h2 className="font-display text-xl font-bold text-white">{t.about.missionTitle}</h2>
              <p className="mt-3 leading-relaxed text-[#B9C2D0]">{t.about.mission}</p>
            </div>
            <div className="glass-card rounded-3xl p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00]/15">
                <Eye size={22} className="text-[#FF6B00]" />
              </div>
              <h2 className="font-display text-xl font-bold text-white">{t.about.visionTitle}</h2>
              <p className="mt-3 leading-relaxed text-[#B9C2D0]">{t.about.vision}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#060f1f] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-12 text-center">
            <h2 className="font-display text-4xl font-extrabold text-white">{t.about.valuesTitle}</h2>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.about.values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.06}>
                <div className="glass-card glow-orange h-full rounded-2xl p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B00]/15">
                    <Check size={18} className="text-[#FF6B00]" />
                  </span>
                  <h3 className="font-display mt-4 font-bold text-white">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#B9C2D0]">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <WhyUs />
      <Industries />
      <Cta />
      <Footer />
    </div>
  );
}
