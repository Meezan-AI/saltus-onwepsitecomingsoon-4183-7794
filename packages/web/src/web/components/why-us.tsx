import { Reveal } from "./reveal";
import { Award, Building2, ShieldCheck, Clock, Cpu, Languages, Layers, HeartHandshake } from "lucide-react";
import { useLang } from "../i18n";

const ICONS = [Award, Building2, ShieldCheck, Clock, Cpu, Languages, Layers, HeartHandshake];

export function WhyUs() {
  const { t } = useLang();

  return (
    <section id="why" className="relative overflow-hidden bg-[#060f1f] py-32">
      <div className="blob left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 bg-[#FF6B00]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{t.why.eyebrow}</span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">{t.why.title}</h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {t.why.items.map((v, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={v.title} delay={i * 0.06}>
                <div className="glass-card glow-orange flex h-full flex-col items-start gap-4 rounded-2xl p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00]/15">
                    <Icon size={22} className="text-[#FF6B00]" />
                  </div>
                  <h3 className="font-display font-bold text-white">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-[#B9C2D0]">{v.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
