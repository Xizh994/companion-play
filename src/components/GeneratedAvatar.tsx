"use client";
import { cn } from "@/lib/utils";

/** 16 种纯正面表情组合 — 无负面情绪 */
const POSITIVE_COMBOS = [
  { mouth: "smile", eyes: "happy" },
  { mouth: "twinkle", eyes: "default" },
  { mouth: "tongue", eyes: "wink" },
  { mouth: "eating", eyes: "default" },
  { mouth: "smile", eyes: "winkWacky" },
  { mouth: "twinkle", eyes: "happy" },
  { mouth: "smile", eyes: "surprised" },
  { mouth: "default", eyes: "happy" },
  { mouth: "tongue", eyes: "default" },
  { mouth: "smile", eyes: "wink" },
  { mouth: "twinkle", eyes: "squint" },
  { mouth: "eating", eyes: "happy" },
  { mouth: "smile", eyes: "squint" },
  { mouth: "default", eyes: "wink" },
  { mouth: "tongue", eyes: "surprised" },
  { mouth: "twinkle", eyes: "wink" },
];

/** 柔和马卡龙背景色 */
const BG_COLORS = "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,b5e4ca,ffe4b5,e8d5c4";

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * 正面情绪 DiceBear 卡通头像
 * 根据 seed 哈希自动选择表情 + 背景色，同一 seed 始终同一头像
 */
export function GeneratedAvatar({
  seed,
  size = 48,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const idx = Math.abs(hashCode(seed)) % POSITIVE_COMBOS.length;
  const { mouth, eyes } = POSITIVE_COMBOS[idx];
  const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&mouth=${mouth}&eyes=${eyes}&backgroundColor=${BG_COLORS}`;

  return (
    <img
      src={url}
      alt=""
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}

/**
 * 智能头像：有真实上传头像用 img，否则用正面 DiceBear 生成
 */
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
