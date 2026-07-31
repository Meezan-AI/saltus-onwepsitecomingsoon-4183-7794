import { motion } from "motion/react";
import { ArrowRight, Download } from "lucide-react";

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden bg-[#060f1f] pt-32 pb-24">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.png" alt="" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/40 via-[#0b1f3a]/70 to-[#060f1f]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060f1f] via-transparent to-transparent" />
      </div>

      <motion.div
        className="blob left-[-10%] top-[10%] h-[420px] w-[420px] bg-[#FF6B00]"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="blob right-[-5%] bottom-[5%] h-[380px] w-[380px] bg-[#1a4bd6]"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-md"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6B00]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Saltus ONE Website Launching Soon
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-5xl font-extrabold leading-[1.05] text-white sm:text-6xl lg:text-7xl"
          >
            Something <span className="text-gradient-orange">Extraordinary</span> Is Coming.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-8 max-w-xl text-lg leading-relaxed text-[#B9C2D0]"
          >
            We empower businesses through creativity, technology, artificial intelligence, and digital
            transformation. From branding and printing to enterprise software, websites, AI, SaaS, and cloud
            solutions — Saltus ONE delivers complete business solutions under one roof.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#solutions"
              className="group flex items-center gap-2 rounded-full bg-[#FF6B00] px-7 py-3.5 font-semibold text-white shadow-xl shadow-orange-900/40 transition-transform hover:scale-105"
            >
              Explore Our Services
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="/catalog/Saltus-ONE-Catalog-2026.pdf"
              download
              className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#0b1f3a]"
            >
              <Download size={18} />
              Download Company Catalog
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-16 flex flex-wrap gap-x-10 gap-y-4 text-white/60"
          >
            {["AI Solutions", "Web & Mobile Apps", "Branding & Printing", "Cloud & SaaS"].map((t) => (
              <span key={t} className="text-sm font-medium">
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
