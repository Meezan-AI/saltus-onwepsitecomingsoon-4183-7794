import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../../i18n";

export type HeroSlide = {
  id: number;
  titleEn: string;
  titleAr: string;
  subtitleEn: string | null;
  subtitleAr: string | null;
  badgeEn: string | null;
  badgeAr: string | null;
  ctaEn: string | null;
  ctaAr: string | null;
  imageUrl: string;
  href: string | null;
  discountPercent: number;
};

const INTERVAL_MS = 5500;

function SlideLink({ href, className, children }: { href: string | null; className: string; children: React.ReactNode }) {
  if (!href) return <div className={className}>{children}</div>;
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * Auto-advancing offers slider for the marketplace landing page.
 * Every slide is one big link (to a product, category or custom URL).
 * Pauses on hover/focus, supports swipe, arrows and dots, and flips for RTL.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const { lang, dir, t } = useLang();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const rtl = dir === "rtl";

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (paused || count < 2) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count, go]);

  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) < 40) return;
    // Swiping toward the "next" side: left in LTR, right in RTL.
    const next = rtl ? delta > 0 : delta < 0;
    go(index + (next ? 1 : -1));
  }

  const offset = `${rtl ? "" : "-"}${index * 100}%`;

  return (
    <div
      className="group/slider relative overflow-hidden rounded-3xl border border-white/10 bg-[#060f1f] shadow-2xl shadow-black/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        onTouchEnd(e);
        setPaused(false);
      }}
      aria-roledescription="carousel"
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(${offset})` }}
      >
        {slides.map((s, i) => {
          const title = lang === "ar" ? s.titleAr : s.titleEn;
          const subtitle = lang === "ar" ? s.subtitleAr : s.subtitleEn;
          const badge = lang === "ar" ? s.badgeAr : s.badgeEn;
          const cta = (lang === "ar" ? s.ctaAr : s.ctaEn) || t.marketplace.hero.defaultCta;
          const active = i === index;
          return (
            <SlideLink
              key={s.id}
              href={s.href}
              className="relative grid min-w-full grid-cols-1 md:grid-cols-2"
            >
              <div
                aria-hidden={!active}
                className="relative z-10 order-2 flex flex-col justify-center gap-4 bg-gradient-to-br from-[#0b1f3a] via-[#0e2a50] to-[#060f1f] p-6 sm:p-10 md:order-none md:p-14"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {s.discountPercent > 0 && (
                    <span className="rounded-full bg-[#FF6B00] px-3 py-1 text-xs font-extrabold tracking-wide text-white shadow-lg shadow-[#FF6B00]/30">
                      {t.marketplace.card.off.replace("{pct}", String(s.discountPercent))}
                    </span>
                  )}
                  {badge && (
                    <span className="rounded-full border border-[#FF8A3D]/50 bg-[#FF6B00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FF8A3D]">
                      {badge}
                    </span>
                  )}
                </div>
                <h2
                  className={`font-display text-2xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl ${
                    active ? "animate-[slide-in_0.7s_ease-out_both]" : ""
                  }`}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="max-w-md text-sm leading-relaxed text-[#B9C2D0] sm:text-base">{subtitle}</p>
                )}
                <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors group-hover/slider:bg-[#FF8A3D]">
                  {cta}
                  <ArrowRight size={16} className="rtl:rotate-180" />
                </span>
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-white md:aspect-auto md:min-h-[380px]">
                <img
                  src={s.imageUrl}
                  alt={title}
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                  className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                    active ? "scale-105" : "scale-100"
                  }`}
                />
                <div className="pointer-events-none absolute inset-y-0 hidden w-24 from-[#0b1f3a]/40 to-transparent ltr:left-0 ltr:bg-gradient-to-r rtl:right-0 rtl:bg-gradient-to-l md:block" />
              </div>
            </SlideLink>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label={t.marketplace.hero.prev}
            onClick={() => go(index - 1)}
            className="absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0b1f3a]/70 text-white opacity-0 backdrop-blur transition-all hover:bg-[#FF6B00] group-hover/slider:opacity-100 sm:flex ltr:left-3 rtl:right-3"
          >
            <ChevronLeft size={20} className="rtl:rotate-180" />
          </button>
          <button
            type="button"
            aria-label={t.marketplace.hero.next}
            onClick={() => go(index + 1)}
            className="absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0b1f3a]/70 text-white opacity-0 backdrop-blur transition-all hover:bg-[#FF6B00] group-hover/slider:opacity-100 sm:flex ltr:right-3 rtl:left-3"
          >
            <ChevronRight size={20} className="rtl:rotate-180" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-[#060f1f]/70 px-3 py-2 backdrop-blur">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={t.marketplace.hero.goTo.replace("{n}", String(i + 1))}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-7 bg-[#FF6B00]" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
