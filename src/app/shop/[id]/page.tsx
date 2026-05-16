"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SafeAvatar } from "@/components/GeneratedAvatar";
import { MessageCircle, Loader2 } from "lucide-react";

const TOKEN_KEY = "dazistar_token";

interface ShopData {
  id: string;
  nickname: string;
  avatar: string | null;
  status: string;
  shopName: string | null;
  shopDesc: string | null;
  playerCount: number;
  rating: number | null;
  orderCount: number;
}

export default function ShopPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    fetch(`/api/users?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.users?.length > 0) {
          setShop(data.users[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleChat = async () => {
    if (!shop) return;
    setChatLoading(true);
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: shop.id }),
      });
      if (res.ok) {
        const { conversation } = await res.json();
        router.push(`/chat/${conversation.id}`);
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">🏪</span>
        <p className="text-gray-400 text-lg">店铺不存在</p>
        <button onClick={() => router.back()} className="text-sm text-purple-400 hover:text-purple-300 transition">← 返回</button>
      </div>
    );
  }

  const shopName = shop.shopName || shop.nickname;
  const isOnline = shop.status !== "offline";

  return (
    <div className="min-h-screen">
      <div className="relative h-56 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-pink-800/80">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 w-10 h-10 glass rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
        >
          ←
        </button>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <SafeAvatar src={shop.avatar} seed={shopName} size={96} />
            {isOnline && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-[#0f0f1a]" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{shopName}</h1>
          <div className="flex items-center justify-center gap-1">
            {isOnline ? (
              <span className="flex items-center gap-1 text-sm text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                营业中
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <span className="w-2 h-2 bg-gray-500 rounded-full" />
                休息中
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleChat}
          disabled={chatLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60 mb-8"
        >
          {chatLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MessageCircle className="h-5 w-5" />
          )}
          发起聊天
        </button>

        <div className="glass rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-sm text-gray-400">
            {shop.rating != null && (
              <span className="text-yellow-400 font-medium">★ {(Number(shop.rating)).toFixed(1)}</span>
            )}
            {shop.orderCount > 0 && <span>{shop.orderCount} 单</span>}
            {shop.playerCount > 0 && <span>{shop.playerCount} 位陪玩师</span>}
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-3">店铺介绍</p>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {shop.shopDesc || shop.nickname && "这家店铺还没有详细介绍~"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
