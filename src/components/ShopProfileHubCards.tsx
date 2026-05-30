"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Star, ExternalLink, Palette } from "lucide-react";

interface ShopProfileHubCardsProps {
  token: string | null;
  shopUserId: string;
}

export function ShopProfileHubCards({ token, shopUserId }: ShopProfileHubCardsProps) {
  const [summary, setSummary] = useState<{
    pageViewsToday: number;
    consultationsTotal: number;
    reviewsTotal: number;
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
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-violet-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">经营数据</p>
            <p className="text-xs text-gray-500 mt-0.5">
                今日访客 {summary?.pageViewsToday ?? "—"} · 咨询 {summary?.consultationsTotal ?? "—"} · 评价{" "}
              {summary?.reviewsTotal ?? "—"}
            </p>
          </div>
          <span className="text-xs text-violet-400 group-hover:text-violet-300 shrink-0">查看 →</span>
        </div>
      </Link>

      <Link
        href="/profile/shop/homepage"
        className="block p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30 transition group"
      >
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-violet-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">主页装修</p>
            <p className="text-xs text-gray-500 mt-0.5">横幅、价格、宣传图、主打陪玩</p>
          </div>
          <span className="text-xs text-violet-400 group-hover:text-violet-300 shrink-0">编辑 →</span>
        </div>
      </Link>

      <Link
        href={`/shop/${shopUserId}`}
        className="block p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30 transition group"
      >
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-yellow-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">我的店铺主页</p>
            <p className="text-xs text-gray-500 mt-0.5">预览对外展示效果</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-violet-300 shrink-0" />
        </div>
      </Link>
    </div>
  );
}