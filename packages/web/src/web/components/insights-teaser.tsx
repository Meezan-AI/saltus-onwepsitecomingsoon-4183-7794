import { Link } from "wouter";
import { ArrowRight, Clock } from "lucide-react";
import { Reveal } from "./reveal";
import { useLang } from "../i18n";
import type { InsightPost } from "../i18n/types";

export function InsightCard({ post, delay = 0 }: { post: InsightPost; delay?: number }) {
  const { t, dir, lang } = useLang();

  return (
    <Reveal delay={delay}>
      <Link href={`/insights/${post.slug}`} className="block h-full">
        <article className="glass-card glow-orange group flex h-full flex-col overflow-hidden rounded-3xl">
          <div className="relative h-44 overflow-hidden">
            <img
              src={post.cover}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060f1f] via-[#060f1f]/20 to-transparent" />
            <span className="absolute top-4 start-4 rounded-full bg-[#0b1f3a]/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#FF6B00] backdrop-blur">
              {post.category}
            </span>
          </div>
          <div className="flex flex-1 flex-col p-6">
            <div className="flex items-center gap-3 text-[11px] text-white/40">
              <span>
                {new Date(post.date).toLocaleDateString(lang === "ar" ? "ar-JO-u-nu-latn" : "en-GB", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {post.readMinutes} {t.insights.minRead}
              </span>
            </div>
            <h3 className="font-display mt-3 text-lg font-bold leading-snug text-white">{post.title}</h3>
            <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[#B9C2D0]">{post.excerpt}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF6B00]">
              {t.insights.readMore}
              <ArrowRight size={15} className={dir === "rtl" ? "rotate-180" : ""} />
            </span>
          </div>
        </article>
      </Link>
    </Reveal>
  );
}

export function InsightsTeaser() {
  const { t, dir } = useLang();

  return (
    <section id="insights" className="relative bg-[#060f1f] py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
              {t.insights.eyebrow}
            </span>
            <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">{t.insights.title}</h2>
            <p className="mt-5 text-[#B9C2D0]">{t.insights.desc}</p>
          </div>
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#0b1f3a]"
          >
            {t.insights.viewAll}
            <ArrowRight size={16} className={dir === "rtl" ? "rotate-180" : ""} />
          </Link>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {t.insights.posts.slice(0, 3).map((p, i) => (
            <InsightCard key={p.slug} post={p} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}
