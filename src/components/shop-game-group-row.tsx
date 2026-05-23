"use client";

import { cn } from "@/lib/utils";

const chipBase =
  "shrink-0 px-3 py-1.5 rounded-full text-sm border transition whitespace-nowrap";

export const shopGameChipClass = (active: boolean, extra?: string) =>
  cn(
    chipBase,
    active
      ? "bg-purple-500/25 text-purple-200 border-purple-500/40 font-medium"
      : "bg-white/5 text-gray-300 border-white/10 hover:border-purple-500/30 hover:text-white",
    extra
  );

export function ShopGameGroupRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <span className="shrink-0 text-sm font-semibold text-gray-200 whitespace-nowrap min-w-[2.5rem]">
        {label}
      </span>
      <div
        className={cn(
          "flex flex-nowrap items-center gap-2 min-w-0 flex-1 overflow-x-auto",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {children}
      </div>
    </div>
  );
}
