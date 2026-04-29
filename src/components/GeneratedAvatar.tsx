"use client";
import { cn } from "@/lib/utils";

const GRADIENTS: [string, string][] = [
  ["#f43f5e", "#f97316"],
  ["#ec4899", "#8b5cf6"],
  ["#8b5cf6", "#3b82f6"],
  ["#06b6d4", "#10b981"],
  ["#f59e0b", "#ef4444"],
  ["#6366f1", "#ec4899"],
  ["#14b8a6", "#3b82f6"],
  ["#a855f7", "#06b6d4"],
  ["#f97316", "#dc2626"],
  ["#22c55e", "#06b6d4"],
  ["#3b82f6", "#9333ea"],
  ["#e11d48", "#7c3aed"],
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

interface GeneratedAvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

export function GeneratedAvatar({ seed, size = 48, className }: GeneratedAvatarProps) {
  const idx = Math.abs(hashCode(seed)) % GRADIENTS.length;
  const [from, to] = GRADIENTS[idx];

  return (
    <div
      className={cn("rounded-full shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: `0 0 0 2px rgba(168,85,247,0.15), inset 0 0 20px rgba(255,255,255,0.08)`,
      }}
      aria-hidden="true"
    />
  );
}

/** 头像渲染：有真实头像用 img，否则用渐变生成 */
export function SafeAvatar({
  src,
  seed,
  size = 48,
  className,
  alt = "",
}: {
  src?: string | null;
  seed: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("object-cover shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return <GeneratedAvatar seed={seed} size={size} className={className} />;
}
