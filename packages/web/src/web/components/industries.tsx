import { Reveal } from "./reveal";
import { CheckCircle2 } from "lucide-react";
import { useLang } from "../i18n";

export function Industries() {
  const { t } = useLang();

  return (
    <section id="industries" className="relative bg-[#0b1f3a] py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.industries.eyebrow}
          </span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">{t.industries.title}</h2>
          <p className="mt-5 text-[#B9C2D0]">{t.industries.desc}</p>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.industries.items.map((item, i) => (
            <Reveal key={item} delay={i * 0.04}>
              <div className="glass-card flex items-center gap-3 rounded-xl px-5 py-4">
                <CheckCircle2 size={18} className="flex-shrink-0 text-[#FF6B00]" />
                <span className="text-sm font-medium text-white">{item}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
