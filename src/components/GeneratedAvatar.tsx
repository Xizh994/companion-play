"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { generateAvatarUrl } from "@/lib/avatar";

/**
 * 透明背景 DiceBear 卡通头像 — 无形状无边框，像贴纸一样融入页面
 * 根据 seed 哈希自动选择表情，同一 seed 始终同一头像
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
  const url = generateAvatarUrl(seed);

  return (
    <img
      src={url}
      alt=""
      className={cn("shrink-0 drop-shadow-md rounded-full", className)}
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
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("object-cover shrink-0 drop-shadow-md rounded-full", className)}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }
  return <GeneratedAvatar seed={seed} size={size} className={className} />;
}
