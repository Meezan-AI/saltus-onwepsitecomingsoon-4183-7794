import { Link } from "wouter";
import { Reveal } from "./reveal";
import { ArrowRight, Download } from "lucide-react";
import { useLang } from "../i18n";

export function Cta() {
  const { t, dir } = useLang();

  return (
    <section className="relative overflow-hidden bg-[#0b1f3a] py-32">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.png" alt="" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1f3a] via-[#0b1f3a]/90 to-[#060f1f]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <h2 className="font-display text-4xl font-extrabold text-white sm:text-5xl">
            {t.cta.title} <span className="text-gradient-orange">{t.cta.highlight}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#B9C2D0]">{t.cta.desc}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="group flex items-center gap-2 rounded-full bg-[#FF6B00] px-8 py-4 font-semibold text-white shadow-xl shadow-orange-900/40 transition-transform hover:scale-105"
            >
              {t.cta.btn1}
              <ArrowRight size={18} className={dir === "rtl" ? "rotate-180" : ""} />
            </Link>
            <a
              href="/catalog/Saltus-ONE-Catalog-2026.pdf"
              download
              className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#0b1f3a]"
            >
              <Download size={18} />
              {t.cta.btn2}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
