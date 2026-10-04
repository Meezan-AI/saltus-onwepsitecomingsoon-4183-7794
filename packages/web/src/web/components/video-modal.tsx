import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

/**
 * Cinematic lightbox for the Saltus ONE story video.
 * Closes on ESC, backdrop click and the close button; locks body scroll while open
 * and unmounts the iframe on close so playback always stops.
 */
export function VideoModal({
  open,
  onClose,
  src,
  title,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
  closeLabel: string;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl sm:p-8"
          style={{ zIndex: 10000 }}
        >
          <motion.div
            dir="ltr"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-5xl"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition-colors hover:border-[#FF6B00]/60 hover:bg-[#FF6B00]/20 sm:-top-14 sm:h-11 sm:w-11"
            >
              <X size={20} />
            </button>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)] sm:rounded-3xl">
              <div className="relative aspect-video w-full">
                <iframe
                  src={src}
                  title={title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
