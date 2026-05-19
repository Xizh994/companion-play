"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SafeAvatar } from "@/components/GeneratedAvatar";
import { MessageCircle, Loader2 } from "lucide-react";

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";

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
  const [chatRestricted, setChatRestricted] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "BOSS") {
          fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => {
              const rn = data.user?.realNameVerification;
              const approved = rn?.status === "APPROVED";
              setChatRestricted(!approved);
            })
            .catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }

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
    if (chatRestricted) {
      setChatError("请先完成实名认证后再发起聊天");
      return;
    }
    setChatError("");
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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const { conversation } = data;
        router.push(`/chat/${conversation.id}`);
      } else {
        setChatError(data.error || "发起聊天失败");
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
      setChatError("发起聊天失败");
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

        {chatError && (
          <p className="text-center text-sm text-red-400 mb-4">{chatError}</p>
        )}

        {chatRestricted ? (
          <div className="w-full mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center text-sm text-amber-100 space-y-2">
            <p>完成实名认证后可与店铺发起聊天</p>
            <Link href="/profile" className="text-pink-400 hover:text-pink-300 font-medium underline">
              前往实名认证 →
            </Link>
          </div>
        ) : (
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
        )}

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
