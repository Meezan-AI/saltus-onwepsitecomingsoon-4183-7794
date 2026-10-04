import { useState } from "react";
import { Link } from "wouter";
import { Phone, Mail, Globe, MessageCircle, Youtube, Facebook, Download, Share2, Check, Copy, ArrowLeft } from "lucide-react";
import { Seo, SITE_URL, SAME_AS } from "../components/seo";
import { BrandWordmark } from "../components/brand-wordmark";
import { useLang } from "../i18n";
import {
  PHONE_TEL,
  PHONE_DISPLAY,
  PHONE_E164,
  WHATSAPP_URL,
  EMAIL,
  WEBSITE,
  YOUTUBE_URL,
  FACEBOOK_URL,
} from "../lib/contact";
import { downloadSaltusVCard } from "../lib/vcard";

const CARD_URL = `${SITE_URL}/business-card`;

export default function BusinessCardPage() {
  const { t, dir } = useLang();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const bc = t.businessCard;

  async function handleSave() {
    await downloadSaltusVCard();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleShare() {
    const data = { title: "Saltus ONE", text: bc.actions.shareText, url: CARD_URL };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* user cancelled or share failed — fall through to copy */
      }
    }
    await handleCopy();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(CARD_URL);
    } catch {
      const input = document.createElement("input");
      input.value = CARD_URL;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const rows = [
    { icon: Phone, label: bc.labels.phone, value: PHONE_DISPLAY, href: PHONE_TEL, ltr: true },
    { icon: MessageCircle, label: bc.labels.whatsapp, value: PHONE_DISPLAY, href: WHATSAPP_URL, ltr: true },
    { icon: Mail, label: bc.labels.email, value: EMAIL, href: `mailto:${EMAIL}`, ltr: true },
    { icon: Globe, label: bc.labels.website, value: WEBSITE, href: `https://${WEBSITE}`, ltr: true },
  ];

  const actions = [
    { icon: Phone, label: bc.actions.call, href: PHONE_TEL, hover: "hover:border-[#FF6B00]/60 hover:bg-[#FF6B00]/15" },
    {
      icon: MessageCircle,
      label: bc.actions.whatsapp,
      href: WHATSAPP_URL,
      external: true,
      hover: "hover:border-[#25D366]/60 hover:bg-[#25D366]/15",
    },
    { icon: Mail, label: bc.actions.email, href: `mailto:${EMAIL}`, hover: "hover:border-[#FF6B00]/60 hover:bg-[#FF6B00]/15" },
    {
      icon: Globe,
      label: bc.actions.website,
      href: `https://${WEBSITE}`,
      external: true,
      hover: "hover:border-[#3B82F6]/60 hover:bg-[#3B82F6]/15",
    },
    {
      icon: Facebook,
      label: bc.actions.facebook,
      href: FACEBOOK_URL,
      external: true,
      hover: "hover:border-[#1877F2]/60 hover:bg-[#1877F2]/15",
    },
    {
      icon: Youtube,
      label: bc.actions.youtube,
      href: YOUTUBE_URL,
      external: true,
      hover: "hover:border-[#FF0000]/60 hover:bg-[#FF0000]/15",
    },
  ];

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center overflow-hidden bg-[#060f1f] px-4 py-10 sm:py-16">
      <Seo
        page="businessCard"
        path="/business-card"
        noindex
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          // Same @id as the site-wide Organization so this page adds contact
          // details to the single entity instead of creating a competing one.
          "@id": `${SITE_URL}/#organization`,
          name: "Saltus ONE",
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/images/logo-stacked.png`,
          telephone: PHONE_E164,
          email: EMAIL,
          slogan: "One Partner. All Digital Solutions.",
          sameAs: SAME_AS,
          contactPoint: {
            "@type": "ContactPoint",
            telephone: PHONE_E164,
            email: EMAIL,
            contactType: "customer service",
            areaServed: "JO",
            availableLanguage: ["ar", "en"],
          },
        }}
      />

      {/* ambient brand glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#FF6B00]/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[#1D4ED8]/25 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,0,0.08),transparent_60%)]" />
      </div>

      <main className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-[28px] border border-white/12 bg-gradient-to-b from-[#0b1f3a] to-[#060f1f] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
          {/* header */}
          <div className="relative border-b border-white/10 bg-[#0b1f3a] px-6 pt-9 pb-8 text-center">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent"
            />
            <img
              src="/images/logo-stacked.png"
              alt="Saltus ONE"
              className="mx-auto h-24 w-24 object-contain drop-shadow-[0_0_30px_rgba(255,107,0,0.35)]"
            />
            <h1 className="sr-only">Saltus ONE — {bc.tagline}</h1>
            <BrandWordmark className="font-display mt-4 block text-3xl font-bold" />
            <p
              dir="ltr"
              className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF6B00] sm:text-xs sm:tracking-[0.22em]"
            >
              {bc.tagline}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#B9C2D0]">{bc.intro}</p>
          </div>

          {/* contact rows */}
          <ul className="divide-y divide-white/8 px-6 py-2">
            {rows.map((r) => (
              <li key={r.label}>
                <a
                  href={r.href}
                  target={r.href.startsWith("http") ? "_blank" : undefined}
                  rel={r.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group -mx-2 flex items-center gap-4 rounded-2xl px-2 py-4 transition-colors hover:bg-white/5"
                >
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#FF6B00]/30 bg-[#FF6B00]/10 text-[#FF6B00] transition-transform group-hover:scale-105">
                    <r.icon size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-widest text-white/45">
                      {r.label}
                    </span>
                    <span dir={r.ltr ? "ltr" : undefined} className="mt-0.5 block truncate text-base font-medium text-white">
                      {r.value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* quick actions */}
          <div className="grid grid-cols-3 gap-3 px-6 pt-4">
            {actions.map((a) => (
              <a
                key={a.label}
                href={a.href}
                target={a.external ? "_blank" : undefined}
                rel={a.external ? "noopener noreferrer" : undefined}
                className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-2 py-3 text-center text-xs font-semibold text-white transition-all active:scale-95 ${a.hover}`}
              >
                <a.icon size={20} className="text-[#FF6B00]" />
                <span className="leading-tight">{a.label}</span>
              </a>
            ))}
          </div>

          {/* primary CTA */}
          <div className="px-6 pt-6 pb-8">
            <button
              type="button"
              onClick={handleSave}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#ff8c33] px-6 py-4 text-base font-bold text-[#0b1f3a] shadow-[0_18px_40px_-16px_rgba(255,107,0,0.85)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              {saved ? <Check size={20} /> : <Download size={20} />}
              {bc.actions.save}
            </button>
            <p className="mt-2 text-center text-[11px] text-white/45">{bc.actions.saveHint}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:border-[#FF6B00]/50 hover:bg-white/10 active:scale-[0.98]"
              >
                <Share2 size={17} className="text-[#FF6B00]" />
                {bc.actions.share}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:border-[#FF6B00]/50 hover:bg-white/10 active:scale-[0.98]"
              >
                {copied ? <Check size={17} className="text-[#25D366]" /> : <Copy size={17} className="text-[#FF6B00]" />}
                {copied ? bc.actions.copied : bc.actions.copy}
              </button>
            </div>
          </div>

          {/* footer strip */}
          <div className="border-t border-white/10 bg-[#060f1f] px-6 py-5 text-center">
            <p className="text-xs text-white/50">{bc.footerNote}</p>
            <p dir="ltr" className="mt-1 text-xs text-white/35">
              {WEBSITE} · {EMAIL}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#B9C2D0] transition-colors hover:text-[#FF6B00]"
          >
            <ArrowLeft size={15} className={dir === "rtl" ? "rotate-180" : undefined} />
            {t.nav.home}
          </Link>
        </div>
      </main>
    </div>
  );
}
