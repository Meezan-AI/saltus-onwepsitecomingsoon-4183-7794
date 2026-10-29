import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Plain checkbox styled as a small square — enough for toggles/permission matrices in the admin UI. */
function Checkbox({ className, checked, ...props }: React.ComponentProps<"input">) {
  return (
    <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
      <input type="checkbox" checked={checked} className="peer absolute inset-0 size-5 cursor-pointer opacity-0" {...props} />
      <span
        className={cn(
          "pointer-events-none flex size-5 items-center justify-center rounded-md border border-white/25 bg-white/[0.04] peer-checked:border-[#FF6B00] peer-checked:bg-[#FF6B00] peer-disabled:opacity-50",
          className,
        )}
      >
        {checked && <Check size={13} className="text-white" strokeWidth={3} />}
      </span>
    </span>
  );
}

export { Checkbox };
