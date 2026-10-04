import { Reveal } from "./reveal";
import { useLang } from "../i18n";

/**
 * Placeholder client marks grouped by sector. Each mark is an inline SVG so the
 * set can be swapped for real client logos later by replacing `Mark` with an
 * <img src="/images/clients/..." /> and keeping the same layout.
 */
function Mark({ index }: { index: number }) {
  const shapes = [
    <g key="a">
      <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="2.5" />
      <path d="M18 6v24" stroke="currentColor" strokeWidth="2.5" />
    </g>,
    <g key="b">
      <rect x="6" y="6" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 22l6-10 6 10" stroke="currentColor" strokeWidth="2.5" />
    </g>,
    <g key="c">
      <path d="M6 26L18 6l12 20H6z" stroke="currentColor" strokeWidth="2.5" />
    </g>,
    <g key="d">
      <path d="M8 24c0-8 4-14 10-14s10 6 10 14" stroke="currentColor" strokeWidth="2.5" />
      <path d="M6 28h24" stroke="currentColor" strokeWidth="2.5" />
    </g>,
    <g key="e">
      <circle cx="13" cy="18" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="23" cy="18" r="7" stroke="currentColor" strokeWidth="2.5" />
    </g>,
    <g key="f">
      <path d="M8 28V10l10 6 10-6v18" stroke="currentColor" strokeWidth="2.5" />
    </g>,
    <g key="g">
      <rect x="7" y="12" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M13 12V7h10v5" stroke="currentColor" strokeWidth="2.5" />
    </g>,
    <g key="h">
      <path d="M18 6l10 6v12l-10 6-10-6V12l10-6z" stroke="currentColor" strokeWidth="2.5" />
    </g>,
  ];

  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-9 w-9 text-[#FF6B00]" aria-hidden="true">
      {shapes[index % shapes.length]}
    </svg>
  );
}

export function Partners() {
  const { t } = useLang();
  const loop = [...t.partners.items, ...t.partners.items];

  return (
    <section id="partners" className="relative overflow-hidden bg-[#0b1f3a] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.partners.eyebrow}
          </span>
          <h2 className="font-display mt-4 text-3xl font-extrabold text-white sm:text-4xl">{t.partners.title}</h2>
          <p className="mt-5 text-[#B9C2D0]">{t.partners.desc}</p>
        </Reveal>
      </div>

      <div className="marquee-mask relative" dir="ltr">
        <div className="marquee-track gap-5 px-3">
          {loop.map((c, i) => (
            <div
              key={`${c.label}-${i}`}
              className="glass-card flex w-64 flex-shrink-0 items-center gap-4 rounded-2xl px-6 py-5"
            >
              <Mark index={i} />
              <div className="min-w-0">
                <p className="font-display truncate text-sm font-bold text-white">{c.label}</p>
                <p className="truncate text-[11px] text-white/45">{c.sector}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-xl px-6 text-center text-xs text-white/35">{t.partners.note}</p>
    </section>
  );
}
