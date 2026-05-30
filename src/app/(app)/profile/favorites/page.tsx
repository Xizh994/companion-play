"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SafeAvatar } from "@/components/GeneratedAvatar";
import { ArrowLeft, Heart, Loader2, Store } from "lucide-react";

interface FavoriteShop {
  shopUserId: string;
  shopName: string;
  avatar: string | null;
  slogan: string | null;
  shopBanner: string | null;
  shopCover: string | null;
  shopGames: string[];
  rating: number | null;
  reviewCount: number;
  priceFrom: number | null;
  status: string;
  favoritedAt: string;
}

export default function BossFavoritesPage() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/shops/me/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "加载失败");
        setFavorites(data.favorites ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        返回我的
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-5 h-5 text-rose-400 fill-rose-400/30" />
        <h1 className="text-2xl font-bold text-white">收藏的店铺</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center py-10">{error}</p>}

      {!loading && !error && favorites.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Store className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-gray-400">还没有收藏任何店铺</p>
          <Link href="/lobby" className="text-sm text-pink-400 hover:text-pink-300">
            去大厅逛逛 →
          </Link>
        </div>
      )}

      {!loading && !error && favorites.length > 0 && (
        <div className="space-y-3">
          {favorites.map((shop) => (
            <Link
              key={shop.shopUserId}
              href={`/shop/${shop.shopUserId}`}
              className="flex gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-pink-500/30 transition group"
            >
              <div className="relative shrink-0">
                <SafeAvatar src={shop.avatar} seed={shop.shopName} size={52} />
                {shop.status !== "offline" && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f1a]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-pink-200 transition">
                  {shop.shopName}
                </p>
                {shop.slogan && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{shop.slogan}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-gray-500">
                  {shop.rating != null && (
                    <span className="text-yellow-400/90">★ {shop.rating.toFixed(1)}</span>
                  )}
                  {shop.reviewCount > 0 && <span>{shop.reviewCount} 评</span>}
                  {shop.priceFrom != null && (
                    <span className="text-pink-400">¥{shop.priceFrom} 起</span>
                  )}
                  {shop.shopGames.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-600 self-center shrink-0 group-hover:text-pink-400">
                查看 →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
