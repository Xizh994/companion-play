"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { SafeAvatar } from "@/components/GeneratedAvatar";

export interface HotShopItem {
  rank: number;
  id: string;
  shopName: string;
  avatar: string | null;
  nickname: string;
  status: string;
  rating: number | null;
  reviewCount: number;
  rankScore: number | null;
  shopGames: string[];
}

interface LobbyHotShopsSectionProps {
  shops: HotShopItem[];
  rankingDate: string | null;
  hasFilters: boolean;
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-amber-500/25 text-amber-300 border-amber-500/40";
  if (rank === 2) return "bg-slate-400/20 text-slate-200 border-slate-400/35";
  if (rank === 3) return "bg-orange-700/25 text-orange-200 border-orange-600/35";
  return "bg-white/10 text-gray-300 border-white/15";
}

export function LobbyHotShopsSection({ shops, rankingDate, hasFilters }: LobbyHotShopsSectionProps) {
  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            热门店铺
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            根据顾客真实评价综合排序，评价越多排名越稳
            {rankingDate ? ` · 榜单 ${rankingDate} 更新` : ""}
          </p>
        </div>
      </div>

      {shops.length === 0 ? (
        <div className="glass rounded-xl border border-white/10 px-4 py-8 text-center">
          <p className="text-sm text-gray-400">
            {hasFilters ? "当前筛选下暂无上榜店铺" : "暂无热门店铺（至少 3 条评价后可参与排名）"}
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/shop/${shop.id}`}
              className="snap-start shrink-0 w-[148px] glass rounded-xl p-4 border border-white/10 hover:border-purple-500/30 hover:bg-white/[0.06] transition flex flex-col items-center gap-2 text-center"
            >
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rankBadgeClass(shop.rank)}`}
              >
                TOP {shop.rank}
              </span>
              <SafeAvatar src={shop.avatar} seed={shop.shopName} size={48} />
              <span className="text-sm font-medium text-white line-clamp-1 w-full">{shop.shopName}</span>
              {shop.rankScore != null && (
                <span className="text-xs font-semibold text-violet-300">综合 {shop.rankScore.toFixed(1)}</span>
              )}
              <span className="text-[11px] text-yellow-400/90">
                {shop.rating != null ? `★ ${shop.rating.toFixed(1)}` : "★ —"}
                {shop.reviewCount > 0 && (
                  <span className="text-gray-500 ml-1">{shop.reviewCount} 评</span>
                )}
              </span>
              {shop.shopGames.length > 0 && (
                <span className="text-[10px] text-purple-300/90 line-clamp-1">{shop.shopGames[0]}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
