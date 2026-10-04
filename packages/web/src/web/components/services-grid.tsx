import { Link } from "wouter";
import { Reveal } from "./reveal";
import {
  Globe,
  Brain,
  Smartphone,
  ShoppingCart,
  Megaphone,
  Palette,
  Printer,
  Gift,
  Flag,
  Shirt,
  Stamp,
  PresentationIcon,
  ArrowRight,
} from "lucide-react";
import { useLang } from "../i18n";

export const SERVICE_ICONS: Record<string, typeof Globe> = {
  "web-software": Globe,
  "ai-automation": Brain,
  "mobile-apps": Smartphone,
  ecommerce: ShoppingCart,
  "digital-marketing": Megaphone,
  branding: Palette,
  printing: Printer,
  "gifts-apparel": Gift,
  flags: Flag,
  "apparel-printing": Shirt,
  "stamps-seals": Stamp,
  "conferences-exhibitions": PresentationIcon,
};

export function ServicesGrid() {
  const { t, dir } = useLang();

  return (
    <section id="services" className="relative bg-[#060f1f] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.services.eyebrow}
          </span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">{t.services.title}</h2>
          <p className="mt-5 text-[#B9C2D0]">{t.services.desc}</p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {t.services.items.map((s, i) => {
            const Icon = SERVICE_ICONS[s.slug] ?? Globe;
            const href = `/services/${s.slug}`;
            return (
              <Reveal key={s.slug} delay={i * 0.06}>
                <Link href={href} className="block h-full">
                  <div className="glass-card glow-orange group h-full overflow-hidden rounded-3xl">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={s.img}
                        alt={s.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#060f1f] to-transparent" />
                      <div className="absolute bottom-3 start-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B00] shadow-lg">
                        <Icon size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-lg font-bold text-white">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#B9C2D0]">{s.short}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF6B00]">
                        {t.services.learnMore}
                        <ArrowRight size={15} className={dir === "rtl" ? "rotate-180" : ""} />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.2} className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#0b1f3a]"
          >
            {t.services.viewAll}
            <ArrowRight size={18} className={dir === "rtl" ? "rotate-180" : ""} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
