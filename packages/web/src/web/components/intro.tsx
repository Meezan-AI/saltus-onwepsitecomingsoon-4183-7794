import { Reveal } from "./reveal";
import { Check } from "lucide-react";
import { useLang } from "../i18n";

export function Intro() {
  const { t } = useLang();

  return (
    <section className="relative bg-[#0b1f3a] py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
        <Reveal>
          <div className="glass-card overflow-hidden rounded-3xl">
            <img src="/images/about-office.png" alt={t.intro.title} className="h-full w-full object-cover" />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{t.intro.eyebrow}</span>
          <h2 className="font-display mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            {t.intro.title}
          </h2>
          <p className="mt-6 leading-relaxed text-[#B9C2D0]">{t.intro.p1}</p>
          <p className="mt-4 leading-relaxed text-[#B9C2D0]">{t.intro.p2}</p>
          <ul className="mt-8 space-y-3">
            {t.intro.points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/15">
                  <Check size={14} className="text-[#FF6B00]" />
                </span>
                <span className="text-sm text-white/85">{p}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
