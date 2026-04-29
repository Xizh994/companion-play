"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SafeAvatar } from "@/components/GeneratedAvatar";

interface PlayerProfile {
  id: string;
  nickname: string;
  avatar: string | null;
  online: boolean;
  rating: number;
  orderCount: number;
  pricePerHour: number;
  gameCategories: string[];
  serviceTags: string[];
  bio: string;
}

const MOCK_PROFILES: Record<string, PlayerProfile> = {
  "1": {
    id: "1", nickname: "糖糖不甜", avatar: null, online: true, rating: 4.9, orderCount: 1280, pricePerHour: 35,
    gameCategories: ["王者荣耀", "英雄联盟"], serviceTags: ["上分", "带飞", "温柔陪伴"],
    bio: "国服打野，野王在线，带飞上分！擅长打野位，擅长前期入侵，中后期团战指挥一流。声音甜美，聊天有趣，保证让你开心~",
  },
  "2": {
    id: "2", nickname: "夜落星河", avatar: null, online: true, rating: 5.0, orderCount: 856, pricePerHour: 50,
    gameCategories: ["原神", "崩坏：星穹铁道"], serviceTags: ["深渊", "剧情", "陪伴"],
    bio: "全角色满命满精，深度玩家，耐心教学。从蒙德到枫丹，每个角落我都探索过，跟着我你不会迷路~",
  },
};

const DEFAULT_PROFILE: PlayerProfile = {
  id: "0", nickname: "待定陪玩师", avatar: null, online: false, rating: 4.5, orderCount: 100, pricePerHour: 30,
  gameCategories: ["王者荣耀"], serviceTags: ["上分"],
  bio: "这位陪玩师很神秘，什么都没写~",
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const profile = useState(() => MOCK_PROFILES[id] ?? { ...DEFAULT_PROFILE, id })[0];

  return (
    <div className="min-h-screen">
      {/* 顶部封面 */}
      <div className="relative h-56 bg-gradient-to-br from-pink-600/80 via-purple-600/60 to-indigo-800/80">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 w-10 h-10 glass rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
        >
          ←
        </button>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <SafeAvatar src={profile.avatar} seed={profile.nickname} size={96} className="rounded-2xl border-4 border-[#0f0f1a]" />
            {profile.online && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-[#0f0f1a]" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-16 pb-8">
        <div className="glass rounded-2xl p-6 glow-card">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{profile.nickname}</h1>
              {profile.online ? (
                <span className="flex items-center gap-1 text-sm text-green-400"><span className="w-2 h-2 bg-green-500 rounded-full" /> 在线</span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-gray-500"><span className="w-2 h-2 bg-gray-500 rounded-full" /> 离线</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mt-2">
              <span className="text-yellow-400">★ {profile.rating}</span>
              <span>{profile.orderCount}单</span>
              <span className="text-2xl font-bold text-pink-400">¥{profile.pricePerHour}<span className="text-xs text-gray-500 font-normal">/小时</span></span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">🎮 游戏品类</p>
              <div className="flex flex-wrap gap-2">
                {profile.gameCategories.map((g) => (
                  <span key={g} className="px-3 py-1 bg-pink-500/15 text-pink-300 text-sm rounded-lg border border-pink-500/30">{g}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">✨ 服务标签</p>
              <div className="flex flex-wrap gap-2">
                {profile.serviceTags.map((s) => (
                  <span key={s} className="px-3 py-1 bg-purple-500/15 text-purple-300 text-sm rounded-lg border border-purple-500/30">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">💬 自我介绍</p>
            <p className="text-gray-300 text-sm leading-relaxed">{profile.bio}</p>
          </div>

          <Link href="/chat" className="btn-gradient w-full py-3 rounded-xl font-medium text-center block">
            💬 联系陪玩
          </Link>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-pink-400 transition">
            ← 返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
