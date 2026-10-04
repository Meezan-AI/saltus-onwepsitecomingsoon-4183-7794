import { useRef } from "react";
import { Reveal } from "./reveal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../i18n";

export function Showcase() {
  const { t, dir } = useLang();
  const scroller = useRef<HTMLDivElement>(null);

  const scroll = (dirSign: number) => {
    const amount = 380 * dirSign * (dir === "rtl" ? -1 : 1);
    scroller.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section id="showcase" className="relative bg-[#060f1f] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
              {t.showcase.eyebrow}
            </span>
            <h2 className="font-display mt-4 max-w-xl text-4xl font-extrabold text-white sm:text-5xl">
              {t.showcase.title}
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => scroll(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-[#FF6B00] hover:bg-[#FF6B00]"
              aria-label="Previous"
            >
              <ChevronLeft size={20} className={dir === "rtl" ? "rotate-180" : ""} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-[#FF6B00] hover:bg-[#FF6B00]"
              aria-label="Next"
            >
              <ChevronRight size={20} className={dir === "rtl" ? "rotate-180" : ""} />
            </button>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <div
          ref={scroller}
          className="flex snap-x gap-6 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-[calc((100vw-80rem)/2+1.5rem)]"
        >
          {t.showcase.items.map((p) => (
            <div
              key={p.title}
              className="glass-card glow-orange group relative h-96 w-80 flex-shrink-0 snap-start overflow-hidden rounded-3xl"
            >
              <img
                src={p.img}
                alt={p.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060f1f] via-[#060f1f]/10 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#FF6B00]">{p.tag}</span>
                <h3 className="font-display mt-2 text-xl font-bold text-white">{p.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
