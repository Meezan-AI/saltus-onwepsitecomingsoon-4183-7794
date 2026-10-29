import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Plain native `<select>`, styled to match the rest of the admin UI — no extra dependency needed for this scope. */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 pr-9 text-sm text-white outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#0b1f3a]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
    </div>
  );
}

export { Select };
