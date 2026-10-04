import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "wouter";
import { ArrowRight, Download, Play } from "lucide-react";
import { useLang } from "../i18n";
import { NeuralBackground } from "./neural-background";
import { VideoModal } from "./video-modal";

const STORY_VIDEO = "https://www.youtube.com/embed/yaXLgeTS1RY?autoplay=1&rel=0&modestbranding=1";

export function Hero() {
  const { t, dir } = useLang();
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#060f1f] pt-28 pb-28 sm:pt-32 sm:pb-24">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.png" alt="" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/40 via-[#0b1f3a]/70 to-[#060f1f]" />
        <div
          className={`absolute inset-0 ${
            dir === "rtl"
              ? "bg-gradient-to-l from-[#060f1f] via-transparent to-transparent"
              : "bg-gradient-to-r from-[#060f1f] via-transparent to-transparent"
          }`}
        />
      </div>

      {/* interactive neural network — sits above the art, below the copy */}
      <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
        <NeuralBackground />
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

      <div className="relative mx-auto w-full max-w-7xl px-6">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6B00]" />
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/80">{t.hero.badge}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-4xl font-extrabold leading-[1.12] text-white sm:text-5xl lg:text-6xl"
          >
            {t.hero.titleA} <span className="text-gradient-orange">{t.hero.titleHighlight}</span> {t.hero.titleB}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-[#B9C2D0]"
          >
            {t.hero.desc}
          </motion.p>

          {/* value proposition — 12 specialised divisions */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: "easeOut" }}
            className="mt-5 flex max-w-2xl items-start gap-3 text-base font-medium text-white/85 sm:items-center sm:text-lg"
          >
            <span aria-hidden className="mt-1 h-6 w-[3px] flex-shrink-0 rounded-full bg-gradient-to-b from-[#FF6B00] to-[#ff8c33] sm:mt-0" />
            {t.hero.divisions}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4 lg:w-[880px] lg:max-w-none lg:flex-nowrap"
          >
            <Link
              href="/services"
              className="group flex min-h-[52px] items-center gap-2 rounded-full bg-[#FF6B00] px-7 py-3.5 font-semibold text-white shadow-xl shadow-orange-900/40 transition-transform hover:scale-105"
            >
              {t.hero.ctaPrimary}
              <ArrowRight size={18} className={`transition-transform ${dir === "rtl" ? "rotate-180" : ""}`} />
            </Link>

            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              className="group flex min-h-[52px] items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-white backdrop-blur-md transition-colors hover:border-[#FF6B00]/50 hover:bg-white/10 sm:px-7"
            >
              <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/20">
                <span
                  aria-hidden
                  className="absolute inset-0 animate-ping rounded-full bg-[#FF6B00]/40 [animation-duration:2.2s]"
                />
                <Play size={13} className="relative translate-x-[1px] fill-[#FF6B00] text-[#FF6B00]" />
              </span>
              {t.hero.ctaVideo}
            </button>

            <a
              href="/catalog/Saltus-ONE-Catalog-2026.pdf"
              download
              className="flex min-h-[52px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-white backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/10 sm:px-7"
            >
              <Download size={18} />
              {t.hero.ctaSecondary}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.85 }}
            className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-white/60"
          >
            {t.hero.chips.map((c) => (
              <span key={c} className="text-sm font-medium">
                {c}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        src={videoOpen ? STORY_VIDEO : ""}
        title={t.hero.videoTitle}
        closeLabel={t.hero.videoClose}
      />
    </section>
  );
}
