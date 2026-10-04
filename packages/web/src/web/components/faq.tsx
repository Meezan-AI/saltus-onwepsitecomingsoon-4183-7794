import { useState } from "react";
import { Reveal } from "./reveal";
import { Plus, Minus } from "lucide-react";
import { useLang } from "../i18n";

export function Faq() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-[#060f1f] py-28">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{t.faq.eyebrow}</span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">{t.faq.title}</h2>
        </Reveal>

        <div className="flex flex-col gap-4">
          {t.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 0.05}>
                <div className="glass-card overflow-hidden rounded-2xl">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display font-bold text-white">{item.q}</span>
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/15 text-[#FF6B00]">
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="border-t border-white/10 px-6 py-5 text-sm leading-relaxed text-[#B9C2D0]">
                      {item.a}
                    </p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
