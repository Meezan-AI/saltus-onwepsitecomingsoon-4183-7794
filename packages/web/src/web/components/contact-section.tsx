import { Link } from "wouter";
import { Reveal } from "./reveal";
import { Phone, Mail, Globe, MessageCircle, Clock, MapPin, IdCard, ArrowRight } from "lucide-react";
import { useLang } from "../i18n";
import { PHONE_TEL, PHONE_DISPLAY, EMAIL, WEBSITE, WHATSAPP_URL } from "../lib/contact";

export function ContactSection() {
  const { t } = useLang();

  const cards = [
    {
      icon: Phone,
      label: t.contact.callLabel,
      value: PHONE_DISPLAY,
      href: PHONE_TEL,
      ltr: true,
    },
    {
      icon: Mail,
      label: t.contact.emailLabel,
      value: EMAIL,
      href: `mailto:${EMAIL}`,
      ltr: true,
    },
    {
      icon: Globe,
      label: t.contact.webLabel,
      value: WEBSITE,
      href: `https://${WEBSITE}`,
      ltr: true,
    },
    {
      icon: MessageCircle,
      label: t.contact.whatsappLabel,
      value: t.contact.whatsappCta,
      href: WHATSAPP_URL,
    },
    { icon: Clock, label: t.contact.hoursLabel, value: t.contact.hours, href: null },
    { icon: MapPin, label: t.contact.locationLabel, value: t.contact.location, href: null },
  ];

  return (
    <section id="contact" className="relative bg-[#0b1f3a] py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{t.contact.eyebrow}</span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">{t.contact.title}</h2>
          <p className="mt-5 text-[#B9C2D0]">{t.contact.desc}</p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => {
            const Icon = c.icon;
            const inner = (
              <div className="glass-card glow-orange flex h-full min-w-0 items-center gap-4 rounded-2xl p-5 sm:p-6">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FF6B00]/15">
                  <Icon size={22} className="text-[#FF6B00]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs uppercase tracking-widest text-white/40">{c.label}</p>
                  <p
                    dir={"ltr" in c && (c as { ltr?: boolean }).ltr ? "ltr" : undefined}
                    className="font-display truncate text-base font-bold text-white sm:text-lg"
                  >
                    {c.value}
                  </p>
                </div>
              </div>
            );
            return (
              <Reveal key={c.label} delay={i * 0.05} className="min-w-0">
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="block min-w-0"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.15} className="mt-8">
          <div className="glass-card glow-orange flex flex-col items-center gap-6 rounded-3xl p-8 text-center sm:flex-row sm:justify-between sm:text-start">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FF6B00]/15">
                <IdCard size={24} className="text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">{t.businessCard.promptTitle}</h3>
                <p className="mt-1 text-sm text-[#B9C2D0]">{t.businessCard.promptDesc}</p>
              </div>
            </div>
            <Link
              href="/business-card"
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#ff8c33] px-7 py-3.5 text-sm font-bold text-[#0b1f3a] shadow-[0_16px_36px_-16px_rgba(255,107,0,0.8)] transition-all hover:brightness-110"
            >
              {t.businessCard.linkLabel}
              <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
