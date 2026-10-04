import { Reveal } from "./reveal";
import { useLang } from "../i18n";

export function Stats() {
  const { t } = useLang();

  return (
    <section className="relative border-y border-white/10 bg-[#0b1f3a] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {t.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="text-center">
              <p className="font-display text-4xl font-extrabold text-[#FF6B00] sm:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm font-medium text-[#B9C2D0]">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
