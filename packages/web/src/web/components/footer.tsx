import { Reveal } from "./reveal";
import { Phone, Mail, Globe } from "lucide-react";
import { BrandWordmark } from "./brand-wordmark";

export function Footer() {
  return (
    <footer id="contact" className="relative border-t border-white/10 bg-[#060f1f] pt-24 pb-10">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="grid gap-12 border-b border-white/10 pb-16 lg:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B00]/15">
              <Phone size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">Call Us</p>
              <a href="tel:+962795881811" className="font-display text-lg font-bold text-white">
                +962 79 588 1811
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B00]/15">
              <Mail size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">Email Us</p>
              <a href="mailto:info@saltus-one.com" className="font-display text-lg font-bold text-white">
                info@saltus-one.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B00]/15">
              <Globe size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">Website</p>
              <a href="https://www.saltus-one.com" className="font-display text-lg font-bold text-white">
                www.saltus-one.com
              </a>
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col items-center gap-6 pt-10 text-center">
          <img src="/images/logo-stacked.png" alt="Saltus ONE" className="h-16 w-16 object-contain" />
          <BrandWordmark className="text-xl font-bold" />
          <p className="max-w-xl text-sm text-[#B9C2D0]">
            Creative • Branding • Printing • AI • SaaS • Websites • Mobile Apps • Marketing • Enterprise Solutions
          </p>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Saltus ONE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
