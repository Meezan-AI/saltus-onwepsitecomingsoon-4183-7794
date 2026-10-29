import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal controlled modal — no extra dependency needed for this admin-only
 * scope (the project only ships `@radix-ui/react-slot` so far). Esc + overlay
 * click close it; it does not trap focus or lock body scroll beyond the
 * overlay, which is enough for an internal dashboard.
 */
function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0e2443] p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, children, onClose, ...props }: React.ComponentProps<"div"> & { onClose?: () => void }) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)} {...props}>
      <div>{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("font-display text-lg font-bold text-white", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-6 flex items-center justify-end gap-3", className)} {...props} />;
}

export { Dialog, DialogHeader, DialogTitle, DialogFooter };
