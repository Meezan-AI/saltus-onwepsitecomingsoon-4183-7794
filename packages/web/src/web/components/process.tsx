import { Reveal } from "./reveal";
import { MessageSquare, ClipboardList, PenTool, Code2, FlaskConical, Rocket, LifeBuoy } from "lucide-react";
import { useLang } from "../i18n";

const ICONS = [MessageSquare, ClipboardList, PenTool, Code2, FlaskConical, Rocket, LifeBuoy];

export function Process() {
  const { t } = useLang();

  return (
    <section id="process" className="relative bg-[#0b1f3a] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-20 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{t.process.eyebrow}</span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">{t.process.title}</h2>
        </Reveal>

        <div className="relative">
          <div className="absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-white/20 to-transparent lg:block" />
          <div className="grid grid-cols-2 gap-y-12 sm:grid-cols-4 lg:grid-cols-7">
            {t.process.steps.map((s, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Reveal key={s.title} delay={i * 0.08} className="flex flex-col items-center px-2 text-center">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#0b1f3a] ring-4 ring-[#FF6B00]/30">
                    <Icon size={22} className="text-[#FF6B00]" />
                  </div>
                  <span className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display mt-1 font-bold text-white">{s.title}</span>
                  <span className="mt-2 text-xs leading-relaxed text-[#B9C2D0]">{s.desc}</span>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
