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

/**
 * Wide advertising strip for DX Forward Jordan 2027, shown at the bottom of the
 * home hero. The forum's own artwork fills the far side and fades into the
 * hero's navy; copy + CTA sit on the near side. Stacks on phones (artwork on
 * top, copy below). CTA carries the same analytics attribute as the floating
 * card so clicks keep being tracked as `service_cta_click`.
 */
export function DxForwardBanner() {
  const { t, dir } = useLang();
  const isRtl = dir === "rtl";

  return (
    <motion.a
      href="https://dxforwardjo.com"
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-cta="dx-forward-forum"
      aria-label={`${t.dxForward.name} — ${t.dxForward.tagline}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1 }}
      className="group relative mt-12 block overflow-hidden rounded-2xl border border-[#20E3C2]/30 bg-[#06182b] shadow-xl shadow-black/30"
    >
      <img
        src="/images/dx-forward-banner.jpg"
        alt=""
        width={520}
        height={630}
        loading="lazy"
        className={`absolute inset-y-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 lg:w-[34%] ${
          isRtl
            ? "left-0 lg:object-[50%_55%] lg:[mask-image:linear-gradient(to_left,transparent,#000_55%)]"
            : "right-0 lg:object-[50%_55%] lg:[mask-image:linear-gradient(to_right,transparent,#000_55%)]"
        }`}
      />
      <div
        className={`absolute inset-0 ${
          isRtl
            ? "bg-gradient-to-t from-[#06182b] via-[#06182b]/85 to-[#06182b]/20 lg:hidden"
            : "bg-gradient-to-t from-[#06182b] via-[#06182b]/85 to-[#06182b]/20 lg:hidden"
        }`}
      />

      <div className="relative flex min-h-[220px] flex-col justify-end gap-4 p-5 pt-28 sm:p-7 sm:pt-32 lg:min-h-[190px] lg:flex-row lg:items-center lg:justify-start lg:gap-8 lg:p-8">
        <div className="flex items-center gap-5">
          <img
            src="/images/dx-forward-logo.png"
            alt=""
            width={682}
            height={700}
            className="hidden h-auto w-24 flex-shrink-0 sm:block"
          />
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#20E3C2]/60 [animation-duration:2.2s]" />
                <span className="relative h-2 w-2 rounded-full bg-[#20E3C2]" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">{t.dxForward.eyebrow}</span>
            </div>
            <p className="font-display text-xl font-extrabold leading-tight text-white sm:text-2xl">{t.dxForward.name}</p>
            <p className="mt-1 text-sm font-medium text-[#20E3C2] sm:text-base">{t.dxForward.tagline}</p>
            <p className="mt-1 text-xs text-white/70 sm:text-sm">{t.dxForward.dateLine}</p>
          </div>
        </div>

        <span className="inline-flex flex-shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#20E3C2]/50 bg-[#20E3C2]/15 px-5 py-2.5 text-sm font-semibold text-[#20E3C2] backdrop-blur-sm transition-colors group-hover:bg-[#20E3C2]/25 lg:self-center">
          {t.dxForward.cta}
          <ArrowUpRight size={16} className={isRtl ? "-scale-x-100" : ""} />
        </span>
      </div>
    </motion.a>
  );
}
