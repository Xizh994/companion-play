"use client";

import { MessageSquareHeart } from "lucide-react";

interface ReviewRequestMetadata {
  requestId?: string;
  shopName?: string;
  expiresAt?: string;
  completed?: boolean;
}

interface ReviewRequestMessageCardProps {
  content: string;
  metadata: ReviewRequestMetadata | null;
  isMine: boolean;
  isBoss: boolean;
  onReview?: (requestId: string, shopName: string) => void;
}

export function ReviewRequestMessageCard({
  content,
  metadata,
  isMine,
  isBoss,
  onReview,
}: ReviewRequestMessageCardProps) {
  const requestId = metadata?.requestId;
  const shopName = metadata?.shopName || "店铺";
  const completed = metadata?.completed;

  return (
    <div
      className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
        isMine
          ? "ml-auto bg-violet-500/15 border-violet-500/30"
          : "bg-amber-500/10 border-amber-500/30"
      }`}
    >
      <div className="flex items-start gap-2">
        <MessageSquareHeart className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{content}</p>
          <p className="text-[11px] text-gray-500 mt-1">邀请你分享真实体验，帮助其他老板选择</p>

          {isBoss && !isMine && requestId && !completed && (
            <button
              type="button"
              onClick={() => onReview?.(requestId, shopName)}
              className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition"
            >
              去评价
            </button>
          )}

          {completed && <p className="mt-2 text-xs text-green-400/90">✓ 已完成评价</p>}

          {isMine && !isBoss && <p className="mt-2 text-xs text-gray-400">等待对方评价</p>}
        </div>
      </div>
    </div>
  );
}
