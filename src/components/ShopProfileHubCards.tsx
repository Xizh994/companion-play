"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, MessageSquare, Star, ExternalLink } from "lucide-react";

interface ShopProfileHubCardsProps {
  token: string | null;
  shopUserId: string;
}

export function ShopProfileHubCards({ token, shopUserId }: ShopProfileHubCardsProps) {
  const [summary, setSummary] = useState<{
    pageViewsToday: number;
    consultationsTotal: number;
    reviewsTotal: number;
    reviewsToday: number;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/shops/me/dashboard?rangeDays=7", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.summary) setSummary(data.summary);
      })
      .catch(() => {});
  }, [token]);

  return (
    <div className="mb-6 space-y-2">
      <h2 className="text-sm font-semibold text-gray-300 px-1">店铺经营</h2>
      <Link
        href="/profile/shop/stats"
        className="block p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30 transition group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BarChart3 className="w-5 h-5 text-violet-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">经营数据</p>
              <p className="text-xs text-gray-500 mt-0.5">
                今日访问 {summary?.pageViewsToday ?? "—"} · 咨询 {summary?.consultationsTotal ?? "—"} · 评价{" "}
                {summary?.reviewsTotal ?? "—"}
              </p>
            </div>
          </div>
          <span className="text-xs text-violet-400 group-hover:text-violet-300 shrink-0">查看 →</span>
        </div>
      </Link>

      <Link
        href="/profile/shop/reviews"
        className="block p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30 transition group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <MessageSquare className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">评价管理</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summary?.reviewsToday ? `今日 +${summary.reviewsToday} 评价` : "查看全部评价"}
              </p>
            </div>
          </div>
          <span className="text-xs text-violet-400 group-hover:text-violet-300 shrink-0">查看 →</span>
        </div>
      </Link>

      <Link
        href={`/shop/${shopUserId}`}
        className="block p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30 transition group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Star className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">我的店铺主页</p>
              <p className="text-xs text-gray-500 mt-0.5">预览对外展示效果</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-violet-300 shrink-0" />
        </div>
      </Link>
    </div>
  );
}
