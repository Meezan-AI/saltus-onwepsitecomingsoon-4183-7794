import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { WHATSAPP_URL } from "../lib/contact";

/** `hideOn` lets pages with their own WhatsApp action (e.g. the business card) skip the floating button. */
export function WhatsAppButton({ hideOn = [] }: { hideOn?: string[] }) {
  const [location] = useLocation();
  /** Mobile-only: stay out of the way of the hero CTAs until the visitor scrolls. */
  const [pastHero, setPastHero] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const isMobile = window.innerWidth < 640;
      setPastHero(!isMobile || window.scrollY > 260);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location]);

  if (hideOn.includes(location)) return null;

  return createPortal(
    <AnimatePresence>
      {pastHero && (
        <motion.a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.08 }}
          className="fixed right-4 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] shadow-xl shadow-black/30 sm:right-6 sm:h-14 sm:w-14"
          style={{
            zIndex: 9999,
            bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
          }}
        >
          <motion.span
            className="absolute inset-0 rounded-full bg-[#25D366]"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <svg viewBox="0 0 32 32" className="relative h-7 w-7 fill-white">
            <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.386.702 4.606 1.912 6.47L4 29l7.72-1.87A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3zm0 21.75a9.7 9.7 0 0 1-4.95-1.36l-.355-.21-4.58 1.11 1.13-4.47-.23-.365A9.7 9.7 0 0 1 5.75 15c0-5.66 4.6-10.25 10.254-10.25S26.25 9.34 26.25 15 20.66 24.75 16.004 24.75zm5.6-7.61c-.307-.154-1.815-.895-2.097-.997-.28-.103-.485-.154-.69.154-.204.307-.79.996-.968 1.2-.178.205-.357.23-.663.077-.307-.154-1.294-.477-2.465-1.52-.911-.812-1.526-1.815-1.704-2.122-.178-.307-.02-.473.134-.626.137-.137.307-.358.46-.537.154-.18.205-.307.307-.512.103-.205.051-.384-.026-.538-.077-.154-.69-1.663-.945-2.278-.249-.598-.502-.517-.69-.527l-.588-.01c-.204 0-.537.077-.818.384-.28.307-1.07 1.046-1.07 2.552s1.096 2.96 1.25 3.165c.153.205 2.157 3.293 5.228 4.618.73.315 1.3.503 1.744.643.733.233 1.4.2 1.928.121.588-.088 1.815-.742 2.07-1.459.256-.717.256-1.332.18-1.46-.077-.128-.282-.205-.588-.358z" />
          </svg>
        </motion.a>
      )}
    </AnimatePresence>,
    document.body,
  );
}
