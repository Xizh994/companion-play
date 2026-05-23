"use client";

import { cn } from "@/lib/utils";

export const shopGameChipClass = (active: boolean, extra?: string) =>
  cn(
    "shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition whitespace-nowrap",
    active
      ? "bg-purple-500/30 text-purple-100 border-purple-400/50 font-medium shadow-sm shadow-purple-500/10"
      : "bg-white/[0.06] text-gray-300 border-white/12 hover:border-purple-500/35 hover:bg-white/[0.09] hover:text-white",
    extra
  );

export function ShopGameChipGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap justify-center items-center gap-2 max-w-3xl mx-auto w-full",
        className
      )}
    >
      {children}
    </div>
  );
}
