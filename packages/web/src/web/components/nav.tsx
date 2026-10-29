import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Download, FileText, Globe, LogOut, MapPin, Menu, Package, ShoppingCart, User, X } from "lucide-react";
import { BrandWordmark } from "./brand-wordmark";
import { useLang } from "../i18n";
import { useSession } from "../queries/account";
import { useCart } from "../queries/cart";
import { signOut } from "../lib/auth";

export function Nav() {
  const { t, toggleLang, lang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { data: session } = useSession();
  const cartQuery = useCart();
  const cartCount = cartQuery.data?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0;
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const links = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.services, href: "/services" },
    { label: t.nav.conferences, href: "/conferences-exhibitions" },
    { label: t.nav.portfolio, href: "/portfolio" },
    { label: t.nav.insights, href: "/insights" },
    { label: t.nav.marketplace, href: "/marketplace" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);
  useEffect(() => setAccountOpen(false), [location]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSignOut() {
    setAccountOpen(false);
    await signOut();
    navigate("/");
  }

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

        <nav className="hidden items-center gap-4 2xl:gap-7 xl:flex">
          {links.map((l) => {
            const active = l.href === "/" ? location === "/" : location.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap text-[13px] font-medium transition-colors 2xl:text-sm ${
                  active ? "text-[#FF6B00]" : "text-white/70 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden flex-shrink-0 items-center gap-3 lg:flex">
          <Link
            href="/marketplace/cart"
            aria-label={t.nav.cartLabel}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
          >
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6B00] px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <div ref={accountMenuRef} className="relative">
            <button
              onClick={() => setAccountOpen((o) => !o)}
              aria-label={t.nav.accountLabel}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
            >
              <User size={16} />
            </button>
            {accountOpen && (
              <div
                dir={lang === "ar" ? "rtl" : "ltr"}
                className="absolute end-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1f3a] shadow-xl shadow-black/40"
              >
                {session ? (
                  <>
                    <Link
                      href="/account/orders"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Package size={15} /> {t.nav.myOrders}
                    </Link>
                    <Link
                      href="/account/rfqs"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <FileText size={15} /> {t.nav.myRfqs}
                    </Link>
                    <Link
                      href="/account/addresses"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <MapPin size={15} /> {t.nav.myAddresses}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 border-t border-white/10 px-4 py-3 text-sm text-[#FF8A8A] transition-colors hover:bg-white/10"
                    >
                      <LogOut size={15} /> {t.nav.signOut}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/account/login"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <User size={15} /> {t.nav.signIn}
                  </Link>
                )}
              </div>
            )}
          </div>

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
          <Link
            href="/marketplace/cart"
            aria-label={t.nav.cartLabel}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white"
          >
            <ShoppingCart size={15} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6B00] px-0.5 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
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

          <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
            {session ? (
              <>
                <Link href="/account/orders" className="flex items-center gap-2.5 text-white/80">
                  <Package size={16} /> {t.nav.myOrders}
                </Link>
                <Link href="/account/rfqs" className="flex items-center gap-2.5 text-white/80">
                  <FileText size={16} /> {t.nav.myRfqs}
                </Link>
                <Link href="/account/addresses" className="flex items-center gap-2.5 text-white/80">
                  <MapPin size={16} /> {t.nav.myAddresses}
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-2.5 text-[#FF8A8A]">
                  <LogOut size={16} /> {t.nav.signOut}
                </button>
              </>
            ) : (
              <Link href="/account/login" className="flex items-center gap-2.5 text-white/80">
                <User size={16} /> {t.nav.signIn}
              </Link>
            )}
          </div>

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
