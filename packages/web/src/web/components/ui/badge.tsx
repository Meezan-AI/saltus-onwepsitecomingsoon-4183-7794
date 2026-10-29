import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-white/15 bg-white/5 text-white/70",
        orange: "border-[#FF6B00]/40 bg-[#FF6B00]/15 text-[#FF8A3D]",
        green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
        red: "border-red-400/30 bg-red-400/10 text-red-300",
        blue: "border-sky-400/30 bg-sky-400/10 text-sky-300",
        yellow: "border-amber-400/30 bg-amber-400/10 text-amber-300",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
