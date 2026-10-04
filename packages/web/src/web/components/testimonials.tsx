import { Quote, BadgeCheck } from "lucide-react";
import { Reveal } from "./reveal";
import { useLang } from "../i18n";

export function Testimonials() {
  const { t } = useLang();

  return (
    <section id="testimonials" className="relative overflow-hidden bg-[#0b1f3a] py-28">
      <div className="blob start-[-10%] top-20 h-72 w-72 bg-[#FF6B00]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.testimonials.eyebrow}
          </span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">
            {t.testimonials.title}
          </h2>
          <p className="mt-5 text-[#B9C2D0]">{t.testimonials.desc}</p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {t.testimonials.items.map((item, i) => (
            <Reveal key={item.quote} delay={(i % 3) * 0.08}>
              <figure className="glass-card glow-orange flex h-full flex-col rounded-3xl p-7">
                <Quote size={26} className="text-[#FF6B00]" />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-white/90">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 border-t border-white/10 pt-5">
                  <p className="font-display text-sm font-bold text-white">{item.role}</p>
                  <p className="mt-0.5 text-xs text-white/45">{item.sector}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#FF6B00]">
                    <BadgeCheck size={13} />
                    {t.testimonials.verified}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
