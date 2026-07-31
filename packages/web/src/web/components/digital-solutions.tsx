import { Reveal } from "./reveal";
import { Globe, Smartphone, Brain, ShoppingCart, Megaphone, Cloud } from "lucide-react";

const SOLUTIONS = [
  {
    icon: Globe,
    title: "Websites & SaaS",
    desc: "Corporate websites, landing pages, enterprise dashboards, CRM, ERP, and custom cloud software.",
    img: "/images/digital-solutions.png",
  },
  {
    icon: Brain,
    title: "AI Solutions",
    desc: "AI chatbots, business automation, workflow automation, machine learning and smart assistants.",
    img: "/images/ai-solutions.png",
  },
  {
    icon: Smartphone,
    title: "Mobile Applications",
    desc: "Android, iOS, and cross-platform business apps built for enterprise mobility.",
    img: "/images/mobile-apps.png",
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce",
    desc: "Premium online stores, payment gateways, inventory management and marketplace platforms.",
    img: "/images/ecommerce.png",
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    desc: "Google Ads, Meta Ads, SEO, content creation, social media and performance marketing.",
    img: "/images/digital-marketing.png",
  },
  {
    icon: Cloud,
    title: "Cloud Computing",
    desc: "Scalable cloud applications, automation and business systems built for growth.",
    img: "/images/digital-solutions.png",
  },
];

export function DigitalSolutions() {
  return (
    <section id="solutions" className="relative bg-[#0b1f3a] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">Digital Solutions</span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">
            Technology Built To Scale Your Business
          </h2>
          <p className="mt-5 text-[#B9C2D0]">
            Enterprise-grade software, AI and digital infrastructure — engineered with the same craftsmanship as our
            creative work.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="glass-card glow-orange group h-full overflow-hidden rounded-3xl">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a] to-transparent" />
                  <div className="absolute bottom-3 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B00] shadow-lg">
                    <s.icon size={20} className="text-white" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#B9C2D0]">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
