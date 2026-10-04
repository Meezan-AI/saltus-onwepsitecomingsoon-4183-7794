import { Link } from "wouter";
import { Reveal } from "./reveal";
import { ArrowRight, Check } from "lucide-react";
import { useLang } from "../i18n";

export function ConferencesSection({ full = false }: { full?: boolean }) {
  const { t, dir } = useLang();
  const c = t.conferences;

  return (
    <section id="conferences" className="relative overflow-hidden bg-[#0b1f3a] py-32">
      <div className="blob end-[-8%] top-[20%] h-[420px] w-[420px] bg-[#FF6B00]" />
      <div className="relative mx-auto max-w-7xl px-6">
        {/* On the dedicated conferences page the hero already shows this heading, so skip it there. */}
        {!full && (
          <Reveal className="mx-auto mb-14 max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{c.eyebrow}</span>
            <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">{c.title}</h2>
            <p className="mt-6 leading-relaxed text-[#B9C2D0]">{c.desc}</p>
          </Reveal>
        )}

        <Reveal delay={0.1} className="mb-14">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="glass-card overflow-hidden rounded-3xl">
              <img
                src="/images/exhibition-booth.png"
                alt={c.capabilities[1].title}
                className="h-72 w-full object-cover"
              />
            </div>
            <div className="glass-card overflow-hidden rounded-3xl">
              <img
                src="/images/conference-hall.png"
                alt={c.capabilities[0].title}
                className="h-72 w-full object-cover"
              />
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {c.capabilities.map((cap, i) => (
            <Reveal key={cap.title} delay={i * 0.06}>
              <div className="glass-card glow-orange h-full rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-white">{cap.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#B9C2D0]">{cap.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {full && (
          <>
            <div className="mt-20 grid gap-6 lg:grid-cols-3">
              {c.scope.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08}>
                  <div className="glass-card h-full rounded-3xl p-7">
                    <h3 className="font-display text-xl font-bold text-white">{s.title}</h3>
                    <ul className="mt-5 space-y-3">
                      {s.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/15">
                            <Check size={12} className="text-[#FF6B00]" />
                          </span>
                          <span className="text-sm text-white/85">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1} className="mt-16">
              <div className="glass-card rounded-3xl p-8">
                <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
                  <img
                    src="/images/event-materials.png"
                    alt={c.capabilities[4].title}
                    className="h-64 w-full rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white">{c.capabilities[4].title}</h3>
                    <div className="mt-6 flex flex-wrap gap-2.5">
                      {c.types.map((type) => (
                        <span
                          key={type}
                          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </>
        )}

        {!full && (
          <Reveal delay={0.2} className="mt-12 text-center">
            <Link
              href="/conferences-exhibitions"
              className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-7 py-3.5 font-semibold text-white shadow-xl shadow-orange-900/40 transition-transform hover:scale-105"
            >
              {c.ctaLabel}
              <ArrowRight size={18} className={dir === "rtl" ? "rotate-180" : ""} />
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
