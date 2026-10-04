import { Link } from "wouter";
import { Phone, Mail, Globe, MapPin, Youtube, Facebook, IdCard } from "lucide-react";
import { BrandWordmark } from "./brand-wordmark";
import { useLang } from "../i18n";
import { PHONE_TEL, PHONE_DISPLAY, EMAIL, WEBSITE, YOUTUBE_URL, FACEBOOK_URL } from "../lib/contact";

export function Footer() {
  const { t } = useLang();

  const links = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.services, href: "/services" },
    { label: t.nav.conferences, href: "/conferences-exhibitions" },
    { label: t.nav.portfolio, href: "/portfolio" },
    { label: t.nav.insights, href: "/insights" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-[#060f1f] pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <img src="/images/logo-stacked.png" alt="Saltus ONE" className="h-14 w-14 object-contain" />
              <div className="flex flex-col">
                <BrandWordmark className="text-xl font-bold" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-[#B9C2D0]/80">
                  {t.footer.legalName}
                </span>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[#B9C2D0]">{t.footer.tagline}</p>
            {/* Digital Business Card — subtle orange accent, 44px min touch target on mobile */}
            <Link
              href="/business-card"
              aria-label={t.businessCard.footerLink}
              className="group mt-6 inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full border border-[#FF6B00]/35 bg-[#FF6B00]/[0.08] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:border-[#FF6B00]/70 hover:bg-[#FF6B00]/15 hover:text-[#FF6B00] sm:text-sm"
            >
              <IdCard size={17} className="flex-shrink-0 text-[#FF6B00]" />
              {t.businessCard.footerLink}
            </Link>
          </div>

          <div>
            <h3 className="font-display mb-5 text-sm font-bold uppercase tracking-widest text-white">
              {t.footer.quickLinks}
            </h3>
            <ul className="flex flex-col gap-3">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block py-1.5 text-sm text-[#B9C2D0] transition-colors hover:text-[#FF6B00]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display mb-5 text-sm font-bold uppercase tracking-widest text-white">
              {t.footer.servicesTitle}
            </h3>
            <ul className="grid content-start gap-3 sm:grid-cols-2">
              {t.services.items.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="inline-block py-1.5 text-sm text-[#B9C2D0] transition-colors hover:text-[#FF6B00]"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display mb-5 text-sm font-bold uppercase tracking-widest text-white">
              {t.footer.contactTitle}
            </h3>
            <ul className="flex flex-col gap-4 text-sm text-[#B9C2D0]">
              <li className="flex items-center gap-3">
                <Phone size={16} className="flex-shrink-0 text-[#FF6B00]" />
                <a href={PHONE_TEL} dir="ltr" className="hover:text-white">
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="flex-shrink-0 text-[#FF6B00]" />
                <a href={`mailto:${EMAIL}`} dir="ltr" className="hover:text-white">
                  {EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Globe size={16} className="flex-shrink-0 text-[#FF6B00]" />
                <a href={`https://${WEBSITE}`} dir="ltr" className="hover:text-white">
                  {WEBSITE}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin size={16} className="flex-shrink-0 text-[#FF6B00]" />
                {t.contact.location}
              </li>
            </ul>

            <h3 className="font-display mt-8 mb-4 text-sm font-bold uppercase tracking-widest text-white">
              {t.footer.followUs}
            </h3>
            <div className="flex items-center gap-3">
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Saltus ONE on YouTube"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#B9C2D0] transition-all hover:border-[#FF0000]/60 hover:bg-[#FF0000] hover:text-white"
              >
                <Youtube size={18} className="transition-transform group-hover:scale-110" />
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Saltus ONE on Facebook"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#B9C2D0] transition-all hover:border-[#1877F2]/60 hover:bg-[#1877F2] hover:text-white"
              >
                <Facebook size={18} className="transition-transform group-hover:scale-110" />
              </a>
            </div>
          </div>
        </div>

        <p className="pt-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Saltus ONE. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
