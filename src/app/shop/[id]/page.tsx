"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SafeAvatar } from "@/components/GeneratedAvatar";

interface ShopPlayer {
  id: string; nickname: string; avatar: string | null; gameCategories: string[];
  pricePerHour: number; rating: number; online: boolean;
}

interface ShopProfile {
  id: string; shopName: string; avatar: string | null; online: boolean;
  rating: number; orderCount: number; priceFrom: number; playerCount: number;
  serviceTags: string[]; bio: string; players: ShopPlayer[];
}

const MOCK_SHOPS: Record<string, ShopProfile> = {
  "3": {
    id: "3", shopName: "皮皮陪玩旗舰店", avatar: null, online: true, rating: 4.8,
    orderCount: 5680, priceFrom: 30, playerCount: 12,
    serviceTags: ["上分", "教学", "陪聊", "声优"],
    bio: "专业陪玩团队，24小时在线服务。我们拥有经验丰富的陪玩师团队，覆盖主流游戏品类，致力于为每一位老板提供最优质的陪伴体验。",
    players: [
      { id: "1", nickname: "糖糖不甜", avatar: null, gameCategories: ["王者荣耀", "英雄联盟"], pricePerHour: 35, rating: 4.9, online: true },
      { id: "7", nickname: "小鱼干", avatar: null, gameCategories: ["和平精英"], pricePerHour: 28, rating: 4.7, online: true },
      { id: "8", nickname: "星辰大海", avatar: null, gameCategories: ["原神"], pricePerHour: 32, rating: 4.8, online: false },
      { id: "9", nickname: "闪电侠", avatar: null, gameCategories: ["英雄联盟", "CS2"], pricePerHour: 45, rating: 4.9, online: true },
    ],
  },
  "6": {
    id: "6", shopName: "月光陪玩小馆", avatar: null, online: true, rating: 4.6,
    orderCount: 3200, priceFrom: 40, playerCount: 8,
    serviceTags: ["上分", "陪聊", "代练"],
    bio: "专注于MOBA类游戏，耐心细心。我们的陪玩师都是经过严格筛选的精英，保证每一位老板都能享受到最专业的服务。",
    players: [
      { id: "10", nickname: "月牙儿", avatar: null, gameCategories: ["王者荣耀"], pricePerHour: 40, rating: 4.6, online: true },
      { id: "11", nickname: "夜精灵", avatar: null, gameCategories: ["英雄联盟"], pricePerHour: 42, rating: 4.5, online: false },
      { id: "12", nickname: "星河漫步", avatar: null, gameCategories: ["原神", "崩坏：星穹铁道"], pricePerHour: 38, rating: 4.7, online: true },
    ],
  },
};

const DEFAULT_SHOP: ShopProfile = {
  id: "0", shopName: "待定店铺", avatar: null, online: false, rating: 4.0,
  orderCount: 0, priceFrom: 30, playerCount: 0, serviceTags: [],
  bio: "这家店铺还没有介绍~", players: [],
};

export default function ShopPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const shop = useState(() => MOCK_SHOPS[id] ?? { ...DEFAULT_SHOP, id })[0];

  return (
    <div className="min-h-screen">
      <div className="relative h-56 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-pink-800/80">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] to-transparent" />
        <button onClick={() => router.back()} className="absolute top-4 left-4 z-10 w-10 h-10 glass rounded-full flex items-center justify-center text-white hover:bg-white/20 transition">←</button>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <SafeAvatar src={shop.avatar} seed={shop.shopName} size={96} className="rounded-2xl border-4 border-[#0f0f1a]" />
            {shop.online && <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-[#0f0f1a]" />}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-16 pb-8">
        <div className="glass rounded-2xl p-6 glow-card mb-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full">店铺</span>
              <h1 className="text-2xl font-bold text-white">{shop.shopName}</h1>
              {shop.online ? (
                <span className="flex items-center gap-1 text-sm text-green-400"><span className="w-2 h-2 bg-green-500 rounded-full" /> 营业中</span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-gray-500"><span className="w-2 h-2 bg-gray-500 rounded-full" /> 休息中</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mt-2">
              <span className="text-yellow-400">★ {shop.rating}</span>
              <span>{shop.orderCount}单</span>
              <span>{shop.playerCount}位陪玩师</span>
              <span className="text-pink-400 font-medium">¥{shop.priceFrom}起<span className="text-gray-500 font-normal">/小时</span></span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {shop.serviceTags.map((s) => (
              <span key={s} className="px-3 py-1 bg-purple-500/15 text-purple-300 text-sm rounded-lg border border-purple-500/30">{s}</span>
            ))}
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">🏠 店铺介绍</p>
            <p className="text-gray-300 text-sm leading-relaxed">{shop.bio}</p>
          </div>
        </div>

        {shop.players.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4">🌟 旗下陪玩师</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shop.players.map((p) => (
                <Link key={p.id} href={`/profile/${p.id}`} className="glass rounded-xl p-4 hover:bg-white/10 transition flex items-center gap-4">
                  <div className="relative shrink-0">
                    <SafeAvatar src={p.avatar} seed={p.nickname} size={56} className="rounded-xl" />
                    {p.online && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{p.nickname}</h3>
                    <p className="text-sm text-gray-400 truncate">{p.gameCategories.join(" · ")}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="text-yellow-400">★ {p.rating}</span>
                      <span className="text-pink-400 font-medium">¥{p.pricePerHour}<span className="text-gray-500 font-normal">/h</span></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-pink-400 transition">← 返回上一页</button>
        </div>
      </div>
    </div>
  );
}
