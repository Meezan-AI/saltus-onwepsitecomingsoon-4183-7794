import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Reveal } from "./reveal";
import { useLang } from "../i18n";

export function Portfolio({ full = false }: { full?: boolean }) {
  const { t, dir } = useLang();
  const [active, setActive] = useState<string>("all");

  const filters = [{ id: "all", label: t.portfolio.all }, ...t.portfolio.categories];
  const all = t.portfolio.items;
  const filtered = active === "all" ? all : all.filter((p) => p.category === active);
  const items = full ? filtered : all.slice(0, 6);

  const catLabel = (id: string) => t.portfolio.categories.find((c) => c.id === id)?.label ?? id;

  return (
    <section id="portfolio" className={`relative ${full ? "bg-[#0b1f3a] pt-14 pb-28" : "bg-[#060f1f] py-28"}`}>
      <div className="mx-auto max-w-7xl px-6">
        {!full && (
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
              {t.portfolio.eyebrow}
            </span>
            <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">{t.portfolio.title}</h2>
            <p className="mt-5 text-[#B9C2D0]">{t.portfolio.desc}</p>
          </Reveal>
        )}

        {full && (
          <Reveal className="mb-12 flex flex-wrap justify-center gap-2.5">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                  active === f.id
                    ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                    : "border-white/20 bg-white/5 text-white/70 hover:border-white/50 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </Reveal>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <Reveal key={`${p.title}-${i}`} delay={(i % 3) * 0.08}>
              <article className="glass-card glow-orange group flex h-full flex-col overflow-hidden rounded-3xl">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060f1f] via-[#060f1f]/20 to-transparent" />
                  <span className="absolute top-4 start-4 rounded-full bg-[#0b1f3a]/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#FF6B00] backdrop-blur">
                    {catLabel(p.category)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-lg font-bold text-white">{p.title}</h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[#B9C2D0]">{p.desc}</p>
                  <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[#FF6B00]/25 bg-[#FF6B00]/8 p-3.5">
                    <TrendingUp size={16} className="mt-0.5 flex-shrink-0 text-[#FF6B00]" />
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-white/40">
                        {t.portfolio.achievementLabel}
                      </p>
                      <p className="text-sm font-semibold text-white">{p.achievement}</p>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {!full && (
          <Reveal delay={0.2} className="mt-12 text-center">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#0b1f3a]"
            >
              {t.portfolio.viewAll}
              <ArrowRight size={18} className={dir === "rtl" ? "rotate-180" : ""} />
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
