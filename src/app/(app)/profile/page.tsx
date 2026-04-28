"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyProfilePage() {
  const router = useRouter();
  const [loggedIn] = useState(true); // 模拟已登录

  if (!loggedIn) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <span className="text-5xl mb-4">🔒</span>
        <h2 className="text-xl font-bold text-gray-400 mb-2">请先登录</h2>
        <p className="text-gray-500 text-sm mb-6">登录后查看个人信息</p>
        <Link href="/login" className="btn-gradient px-8 py-3 rounded-xl font-medium">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* 个人信息卡片 */}
      <div className="glass rounded-2xl p-6 glow-card">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=me"
              alt="头像"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-pink-500/50"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-[#1a1a2e]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">玩家小王</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 text-xs rounded-full">老板</span>
              <span className="text-sm text-gray-400">138****8888</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">ID: CP20240428</p>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-400">12</p>
            <p className="text-xs text-gray-500 mt-1">订单数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">5</p>
            <p className="text-xs text-gray-500 mt-1">收藏</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">280</p>
            <p className="text-xs text-gray-500 mt-1">积分</p>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="glass rounded-2xl overflow-hidden">
        <h3 className="text-sm font-medium text-gray-500 px-6 pt-5 pb-3">快捷入口</h3>
        <Link
          href="/profile/favorites"
          className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">❤️</span>
            <span className="text-gray-200">我的收藏</span>
          </div>
          <span className="text-gray-500">→</span>
        </Link>
        <Link
          href="/chat"
          className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <span className="text-gray-200">我的消息</span>
          </div>
          <span className="text-gray-500">→</span>
        </Link>
        <Link
          href="/profile/settings"
          className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">⚙️</span>
            <span className="text-gray-200">设置</span>
          </div>
          <span className="text-gray-500">→</span>
        </Link>
      </div>

      {/* 其他 */}
      <div className="glass rounded-2xl overflow-hidden">
        <h3 className="text-sm font-medium text-gray-500 px-6 pt-5 pb-3">其他</h3>
        <Link
          href="/register"
          className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🏪</span>
            <span className="text-gray-200">申请成为陪玩师</span>
          </div>
          <span className="text-gray-500">→</span>
        </Link>
        <Link
          href="/register"
          className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🏛️</span>
            <span className="text-gray-200">申请入驻店铺</span>
          </div>
          <span className="text-gray-500">→</span>
        </Link>
      </div>
    </div>
  );
}