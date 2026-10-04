import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Download, Globe, Menu, X } from "lucide-react";
import { BrandWordmark } from "./brand-wordmark";
import { useLang } from "../i18n";

export function Nav() {
  const { t, toggleLang, lang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  const links = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.services, href: "/services" },
    { label: t.nav.conferences, href: "/conferences-exhibitions" },
    { label: t.nav.portfolio, href: "/portfolio" },
    { label: t.nav.insights, href: "/insights" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <header
      className={`fixed top-0 z-40 w-full border-b backdrop-blur-xl transition-all duration-500 ${
        scrolled
          ? "border-white/10 bg-[#0b1f3a]/95 py-3 shadow-lg shadow-black/30"
          : "border-white/10 bg-[#0b1f3a]/80 py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <img src="/images/logo-stacked.png" alt="Saltus ONE" className="h-14 w-14 object-contain" />
          <BrandWordmark className="text-xl font-bold tracking-tight" />
        </Link>

        <nav className="hidden items-center gap-7 xl:flex">
          {links.map((l) => {
            const active = location === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors ${
                  active ? "text-[#FF6B00]" : "text-white/70 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden flex-shrink-0 items-center gap-3 lg:flex">
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            aria-label={lang === "en" ? "Switch to Arabic" : "التحويل إلى الإنجليزية"}
          >
            <Globe size={15} />
            {t.nav.langToggle}
          </button>
          <a
            href="/catalog/Saltus-ONE-Catalog-2026.pdf"
            download
            className="flex items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition-transform hover:scale-105"
          >
            <Download size={16} />
            {t.nav.catalog}
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white"
          >
            <Globe size={14} />
            {t.nav.langToggle}
          </button>
          <button
            className="-m-2.5 flex h-11 w-11 items-center justify-center text-white"
            onClick={() => setOpen((o) => !o)}
            aria-label={t.nav.menu}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-6 mt-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b1f3a] p-6 lg:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/80">
              {l.label}
            </Link>
          ))}
          <a
            href="/catalog/Saltus-ONE-Catalog-2026.pdf"
            download
            className="flex items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Download size={16} /> {t.nav.catalog}
          </a>
        </div>
      )}
    </header>
  );
}
