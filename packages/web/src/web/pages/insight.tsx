import type { ReactNode } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Seo, SITE_URL } from "../components/seo";
import { Nav } from "../components/nav";
import { Reveal } from "../components/reveal";
import { InsightCard } from "../components/insights-teaser";
import { LeadForm } from "../components/lead-form";
import { Footer } from "../components/footer";
import { useLang } from "../i18n";
import NotFoundFallback from "./insights";

const isTableRow = (b: string) => b.startsWith("| ");
const isListItem = (b: string) => /^(- |\d+\. )/.test(b);
const cells = (row: string) =>
  row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** Renders an article body: `## ` headings, `> ` quotes, `| a | b |` tables, `- `/`1. ` lists, plain paragraphs. */
function ArticleBody({ blocks }: { blocks: string[] }) {
  const out: ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i]!;

    if (block.startsWith("## ")) {
      out.push(
        <h2 key={i} className="font-display mt-12 mb-4 text-2xl font-bold text-white sm:text-3xl">
          {block.slice(3)}
        </h2>,
      );
      i += 1;
      continue;
    }

    if (block.startsWith("> ")) {
      out.push(
        <blockquote
          key={i}
          className="my-8 rounded-2xl border-s-4 border-[#FF6B00] bg-white/5 p-6 text-lg font-medium leading-relaxed text-white/90"
        >
          {block.slice(2)}
        </blockquote>,
      );
      i += 1;
      continue;
    }

    if (isTableRow(block)) {
      const rows: string[] = [];
      while (i < blocks.length && isTableRow(blocks[i]!)) {
        rows.push(blocks[i]!);
        i += 1;
      }
      const [head, ...body] = rows;
      out.push(
        <div key={`t-${i}`} className="my-8 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[560px] border-collapse text-start text-sm">
            <thead>
              <tr className="bg-[#FF6B00]/15">
                {cells(head!).map((c, ci) => (
                  <th key={ci} className="border-b border-white/10 p-4 text-start font-bold text-white">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="odd:bg-white/[0.03]">
                  {cells(r).map((c, ci) => (
                    <td
                      key={ci}
                      className={`border-b border-white/5 p-4 align-top ${
                        ci === 0 ? "font-semibold text-white" : "text-white/70"
                      }`}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (isListItem(block)) {
      const items: string[] = [];
      const ordered = /^\d+\. /.test(block);
      while (i < blocks.length && isListItem(blocks[i]!) && /^\d+\. /.test(blocks[i]!) === ordered) {
        items.push(blocks[i]!.replace(/^(- |\d+\. )/, ""));
        i += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      out.push(
        <ListTag key={`l-${i}`} className="my-6 space-y-3">
          {items.map((item, li) => (
            <li key={li} className="flex gap-3 leading-relaxed text-white/70">
              <span className="mt-0.5 shrink-0 font-bold text-[#FF6B00]">{ordered ? `${li + 1}.` : "—"}</span>
              <span>{item}</span>
            </li>
          ))}
        </ListTag>,
      );
      continue;
    }

    out.push(<p key={i}>{block}</p>);
    i += 1;
  }

  return <>{out}</>;
}

export default function InsightPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, dir, lang } = useLang();

  const post = t.insights.posts.find((p) => p.slug === slug);
  if (!post) return <NotFoundFallback />;

  const related = t.insights.posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const dateLabel = new Date(post.date).toLocaleDateString(lang === "ar" ? "ar-JO-u-nu-latn" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo
        path={`/insights/${post.slug}`}
        custom={{
          title: `${post.title} | Saltus ONE`,
          desc: post.excerpt,
          keywords: post.keywords,
          image: post.cover,
          type: "article",
        }}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          dateModified: post.date,
          inLanguage: lang,
          articleSection: post.category,
          keywords: post.keywords,
          image: `${SITE_URL}${post.cover}`,
          mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/insights/${post.slug}` },
          author: {
            "@type": "Person",
            name: post.author,
            jobTitle: post.authorRole,
            image: `${SITE_URL}${post.authorImage}`,
            worksFor: { "@id": `${SITE_URL}/#organization` },
          },
          publisher: {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "Saltus ONE",
            logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logo-stacked.png` },
          },
        }}
      />
      <Nav />

      <section className="relative overflow-hidden bg-[#060f1f] pt-36 pb-14">
        <div className="absolute inset-0">
          <img src={post.cover} alt="" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/80 to-[#0b1f3a]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:text-[#ff8a3d]"
          >
            <ArrowLeft size={15} className={dir === "rtl" ? "rotate-180" : ""} />
            {t.insights.backToList}
          </Link>
          <span className="mt-6 block text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {post.category}
          </span>
          <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              {post.readMinutes} {t.insights.minRead}
            </span>
          </div>
          <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
            <img
              src={post.authorImage}
              alt={post.author}
              loading="lazy"
              className="size-12 shrink-0 rounded-full border border-[#FF6B00]/40 bg-white/5 object-cover object-top"
            />
            <span className="leading-tight">
              <span className="block text-sm font-bold text-white">{post.author}</span>
              <span className="block text-xs text-white/45">{post.authorRole} · Saltus ONE</span>
            </span>
          </div>
        </div>
      </section>

      <article className="bg-[#0b1f3a] py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="glass-card mb-12 overflow-hidden rounded-3xl">
            <img src={post.cover} alt={post.title} className="h-72 w-full object-cover sm:h-96" />
          </div>
          <p className="mb-10 border-s-2 border-[#FF6B00] ps-5 text-lg font-medium leading-relaxed text-white/90">
            {post.excerpt}
          </p>
          <div className="prose-saltus">
            <ArticleBody blocks={post.body} />
          </div>
        </div>
      </article>

      <section className="bg-[#060f1f] py-20">
        <div className="mx-auto max-w-3xl px-6">
          <LeadForm title={t.insights.shareTitle} />
        </div>
      </section>

      <section className="bg-[#0b1f3a] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <h2 className="font-display mb-10 text-3xl font-extrabold text-white">{t.insights.relatedTitle}</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => (
              <InsightCard key={p.slug} post={p} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
