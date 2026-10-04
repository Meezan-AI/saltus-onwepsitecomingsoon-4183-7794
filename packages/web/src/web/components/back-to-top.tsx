import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { ArrowUp } from "lucide-react";
import { useLang } from "../i18n";

export function BackToTop() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={lang === "ar" ? "العودة إلى الأعلى" : "Back to top"}
          title={lang === "ar" ? "العودة إلى الأعلى" : "Back to top"}
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 12 }}
          transition={{ duration: 0.25 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="fixed right-4 flex h-13 w-13 items-center justify-center rounded-full border border-white/20 bg-[#FF6B00] text-white shadow-xl shadow-black/40 transition-colors hover:bg-[#ff7d1f] sm:right-6 sm:h-14 sm:w-14"
          style={{ zIndex: 9998, bottom: "calc(5.25rem + env(safe-area-inset-bottom))" }}
        >
          <ArrowUp size={24} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>,
    document.body,
  );
}
