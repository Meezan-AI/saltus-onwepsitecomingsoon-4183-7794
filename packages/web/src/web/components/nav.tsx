import { useEffect, useState } from "react";
import { Download, Menu, X } from "lucide-react";
import { BrandWordmark } from "./brand-wordmark";

const LINKS = [
  { label: "Solutions", href: "#solutions" },
  { label: "Branding & Print", href: "#branding" },
  { label: "Why Us", href: "#why" },
  { label: "Process", href: "#process" },
  { label: "Showcase", href: "#showcase" },
  { label: "Contact", href: "#contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled ? "bg-[#0b1f3a]/90 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2">
          <img src="/images/logo-stacked.png" alt="Saltus ONE" className="h-11 w-11 object-contain" />
          <BrandWordmark className="text-lg font-bold tracking-tight" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <a
            href="/catalog/Saltus-ONE-Catalog-2026.pdf"
            download
            className="flex items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition-transform hover:scale-105"
          >
            <Download size={16} />
            Company Catalog
          </a>
        </div>

        <button className="text-white lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="mx-6 mt-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b1f3a] p-6 lg:hidden">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-white/80" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a
            href="/catalog/Saltus-ONE-Catalog-2026.pdf"
            download
            className="flex items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Download size={16} /> Company Catalog
          </a>
        </div>
      )}
    </header>
  );
}
