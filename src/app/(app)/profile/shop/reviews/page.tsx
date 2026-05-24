"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShopManageLayout } from "@/components/ShopManageLayout";
import { Loader2, Star } from "lucide-react";

interface ReviewItem {
  id: string;
  score: number;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
}

export default function ShopReviewsManagePage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/shops/me/reviews?pageSize=50", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "加载失败");
        setReviews(json.reviews || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <ShopManageLayout title="评价管理" subtitle="查看顾客对你店铺的评价" activeTab="reviews">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm text-center py-10">{error}</p>
      ) : reviews.length === 0 ? (
        <div className="glass rounded-2xl p-10 border border-white/10 text-center">
          <p className="text-gray-400 text-sm">还没有评价</p>
          <p className="text-gray-600 text-xs mt-2">在聊天中邀请老板评价后，评价会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-4 h-4 ${
                        n <= r.score ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-gray-500">
                  {new Date(r.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{r.content}</p>
              {r.isAnonymous && (
                <p className="text-[10px] text-gray-500 mt-2">匿名评价</p>
              )}
            </div>
          ))}
        </div>
      )}
    </ShopManageLayout>
  );
}
