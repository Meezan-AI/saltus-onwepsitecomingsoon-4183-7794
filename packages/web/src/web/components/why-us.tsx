import { Reveal } from "./reveal";
import { Sparkles, Lightbulb, ShieldCheck, Zap, Users2, Layers, Trophy, HeartHandshake } from "lucide-react";

const VALUES = [
  { icon: Sparkles, title: "Innovation", desc: "Always ahead with the latest technology and creative trends." },
  { icon: Lightbulb, title: "Creativity", desc: "Ideas that make brands stand out, memorable and meaningful." },
  { icon: ShieldCheck, title: "Enterprise Quality", desc: "Production and engineering built to enterprise standards." },
  { icon: Zap, title: "Fast Delivery", desc: "Efficient processes that respect your timelines." },
  { icon: Layers, title: "AI Powered", desc: "Automation and intelligence embedded into everything we build." },
  { icon: Users2, title: "Experienced Team", desc: "Specialists across design, development, AI and production." },
  { icon: Trophy, title: "Scalable Solutions", desc: "Systems that grow with your business, not against it." },
  { icon: HeartHandshake, title: "Customer Success", desc: "Long-term partnerships built on measurable results." },
];

export function WhyUs() {
  return (
    <section id="why" className="relative overflow-hidden bg-[#0b1f3a] py-32">
      <div className="blob left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 bg-[#FF6B00]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">Why Saltus ONE</span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">
            One Partner. Every Solution.
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="glass-card glow-orange flex h-full flex-col items-start gap-4 rounded-2xl p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00]/15">
                  <v.icon size={22} className="text-[#FF6B00]" />
                </div>
                <h3 className="font-display font-bold text-white">{v.title}</h3>
                <p className="text-sm leading-relaxed text-[#B9C2D0]">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
