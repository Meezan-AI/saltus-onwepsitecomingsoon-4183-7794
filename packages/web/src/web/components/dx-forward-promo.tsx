import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "../i18n";

/**
 * Floating promo card for DX Forward Jordan 2027 — the digital transformation
 * forum Saltus ONE organizes (dxforwardjo.com). Always visible for the whole
 * visit (no dismiss), slides in once the main hero animation settles, then
 * floats gently in place — same technique as the hero's `.blob` elements.
 *
 * `compact` is used on the Conferences & Exhibitions page, whose header is
 * shorter and centered: smaller card, different corner, hidden on very small
 * screens rather than risking an overlap with the centered heading.
 *
 * The CTA carries `data-analytics-cta="dx-forward-forum"`, which the site's
 * existing click-delegation in analytics-listener.tsx already tracks as
 * `service_cta_click` — no extra analytics wiring needed here.
 */
export function DxForwardPromo({ compact = false }: { compact?: boolean }) {
  const { t, dir } = useLang();
  const isRtl = dir === "rtl";

  // Mobile: a normal in-flow card (the hero/header content is taller than the
  // viewport there, so any fixed corner offset risks overlapping the real
  // CTAs). Only from `lg` up — where free corner space is confirmed — does it
  // detach into the absolutely positioned floating card.
  const positionClass = compact
    ? `hidden sm:block sm:mt-8 sm:mx-auto lg:absolute lg:z-10 lg:mt-0 lg:top-28 ${isRtl ? "lg:left-8" : "lg:right-8"}`
    : `mt-10 lg:mt-0 lg:absolute lg:z-10 lg:bottom-32 ${isRtl ? "lg:left-10" : "lg:right-10"}`;

  const widthClass = compact ? "max-w-[220px] lg:max-w-[220px]" : "max-w-[260px] lg:max-w-[260px]";

  return (
    <motion.div
      className={`${positionClass} ${widthClass}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: compact ? 0.3 : 0.6 }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-2xl border border-[#20E3C2]/30 bg-white/5 p-4 shadow-xl shadow-black/30 backdrop-blur-md"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#20E3C2]/60 [animation-duration:2.2s]" />
            <span className="relative h-2 w-2 rounded-full bg-[#20E3C2]" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
            {t.dxForward.eyebrow}
          </span>
        </div>

        <img
          src="/images/dx-forward-logo.png"
          alt={t.dxForward.name}
          width={682}
          height={700}
          className={`mx-auto h-auto ${compact ? "w-20" : "w-24"}`}
        />

        <p className="mt-2 text-center text-xs font-medium text-[#20E3C2]">{t.dxForward.tagline}</p>
        <p className="mt-1 text-center text-xs text-white/60">{t.dxForward.dateLine}</p>

        <a
          href="https://dxforwardjo.com"
          target="_blank"
          rel="noopener noreferrer"
          data-analytics-cta="dx-forward-forum"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-[#20E3C2]/40 bg-[#20E3C2]/10 px-3 py-2 text-xs font-semibold text-[#20E3C2] transition-colors hover:bg-[#20E3C2]/20"
        >
          {t.dxForward.cta}
          <ArrowUpRight size={13} className={isRtl ? "-scale-x-100" : ""} />
        </a>
      </motion.div>
    </motion.div>
  );
}
