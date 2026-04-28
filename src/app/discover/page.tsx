"use client";

import { useState } from "react";
import Link from "next/link";

const PLAYERS = [
  {
    id: "1",
    nickname: "糖糖不甜",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sugar",
    role: "player" as const,
    gameCategories: ["王者荣耀", "英雄联盟"],
    pricePerHour: 35,
    rating: 4.9,
    orderCount: 1280,
    serviceTags: ["上分", "带飞", "温柔陪伴"],
    bio: "国服打野，野王在线，带飞上分！",
    online: true,
  },
  {
    id: "2",
    nickname: "夜落星河",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=star",
    role: "player" as const,
    gameCategories: ["原神", "崩坏：星穹铁道"],
    pricePerHour: 50,
    rating: 5.0,
    orderCount: 856,
    serviceTags: ["深渊", "剧情", "陪伴"],
    bio: "全角色满命满精，深度玩家，耐心教学",
    online: true,
  },
  {
    id: "3",
    nickname: "皮皮不皮",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pepper",
    role: "shop" as const,
    shopName: "皮皮陪玩旗舰店",
    gameCategories: ["王者荣耀", "和平精英", "英雄联盟"],
    pricePerHour: 30,
    rating: 4.8,
    orderCount: 5680,
    serviceTags: ["上分", "教学", "陪聊", "声优"],
    bio: "专业陪玩团队，24小时在线服务",
    online: true,
    playerCount: 12,
  },
  {
    id: "4",
    nickname: "奶茶三分甜",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bubble",
    role: "player" as const,
    gameCategories: ["蛋仔派对", "第五人格"],
    pricePerHour: 25,
    rating: 4.7,
    orderCount: 432,
    serviceTags: ["上分", "声优", "聊天"],
    bio: "声甜可爱，会撒娇，适合治愈系玩家",
    online: false,
  },
  {
    id: "5",
    nickname: "电竞狂人小K",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=killer",
    role: "player" as const,
    gameCategories: ["CS2", "PUBG", "永劫无间"],
    pricePerHour: 60,
    rating: 4.9,
    orderCount: 2100,
    serviceTags: ["刚枪", "技术流", "上分"],
    bio: "FPS全能选手，枪刚人稳，技术教学",
    online: true,
  },
  {
    id: "6",
    nickname: "月光小雅",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=moon",
    role: "shop" as const,
    shopName: "月光陪玩小馆",
    gameCategories: ["王者荣耀", "英雄联盟"],
    pricePerHour: 40,
    rating: 4.6,
    orderCount: 3200,
    serviceTags: ["上分", "陪聊", "代练"],
    bio: "专注于MOBA类游戏，耐心细心",
    online: true,
    playerCount: 8,
  },
];

const GAME_CATEGORIES = [
  { name: "全部", icon: "✨" },
  { name: "王者荣耀", icon: "👑" },
  { name: "英雄联盟", icon: "⚔️" },
  { name: "原神", icon: "🌟" },
  { name: "和平精英", icon: "🎯" },
  { name: "蛋仔派对", icon: "🥚" },
  { name: "第五人格", icon: "🏚️" },
  { name: "CS2", icon: "🔫" },
  { name: "永劫无间", icon: "⚔️" },
];

export default function DiscoverPage() {
  const [activeGame, setActiveGame] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = PLAYERS.filter((p) => {
    const matchGame = activeGame === "全部" || p.gameCategories.includes(activeGame);
    const matchSearch =
      !searchQuery ||
      p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.serviceTags.some((t) => t.includes(searchQuery)) ||
      p.gameCategories.some((g) => g.includes(searchQuery));
    return matchGame && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* 搜索框 */}
      <div className="glass rounded-2xl p-2 flex items-center gap-2">
        <span className="pl-3 text-gray-500">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索搭子、游戏或店铺..."
          className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-white placeholder-gray-500 text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="pr-3 text-gray-500 hover:text-gray-300 text-sm">
            ✕
          </button>
        )}
      </div>

      {/* 游戏分类横向滚动 */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {GAME_CATEGORIES.map((game) => (
            <button
              key={game.name}
              onClick={() => setActiveGame(game.name)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition whitespace-nowrap ${
                activeGame === game.name
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium"
                  : "glass text-gray-300 hover:bg-white/10"
              }`}
            >
              <span>{game.icon}</span>
              {game.name}
            </button>
          ))}
        </div>
      </div>

      {/* 卡片网格列表 */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((item) => (
            <Link
              key={item.id}
              href={item.role === "shop" ? `/shop/${item.id}` : `/profile/${item.id}`}
              className="glass rounded-2xl p-5 glow-card hover:scale-[1.02] transition-transform cursor-pointer block"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative shrink-0">
                  <img src={item.avatar} alt={item.nickname} className="w-16 h-16 rounded-xl object-cover" />
                  {item.online && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white truncate">{item.nickname}</h3>
                    {item.role === "shop" && (
                      <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full shrink-0">
                        店铺
                      </span>
                    )}
                  </div>
                  {item.role === "shop" ? (
                    <p className="text-sm text-gray-400 truncate">{(item as any).shopName}</p>
                  ) : (
                    <p className="text-sm text-gray-400 truncate">{item.gameCategories.join(" · ")}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {item.serviceTags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-pink-500/10 text-pink-300 text-xs rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-400">★ {item.rating}</span>
                  <span className="text-gray-400">{item.orderCount}单</span>
                  {item.role === "shop" && (item as any).playerCount && (
                    <span className="text-gray-400">{(item as any).playerCount}位陪玩师</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-pink-400">¥{item.pricePerHour}</span>
                  <span className="text-xs text-gray-500">/小时</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">🔍</span>
          <h3 className="text-lg font-bold text-gray-400">没有找到结果</h3>
          <p className="text-gray-500 text-sm mt-2">换个关键词或游戏分类试试</p>
        </div>
      )}
    </div>
  );
}