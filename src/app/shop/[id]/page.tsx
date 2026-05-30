"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ShopHomepageView, type ShopPublicReview } from "@/components/ShopHomepageView";
import type { ShopHomepagePayload } from "@/lib/shop-homepage";

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";

export default function ShopPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [homepage, setHomepage] = useState<ShopHomepagePayload | null>(null);
  const [reviews, setReviews] = useState<ShopPublicReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ avgRating: number | null; reviewCount: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatRestricted, setChatRestricted] = useState(false);
  const [chatError, setChatError] = useState("");
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    setToken(t);

    const userStr = localStorage.getItem(USER_KEY);
    let currentUserId: string | null = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        currentUserId = user.id ?? null;
        setUserRole(user.role ?? null);
        setIsOwnerPreview(user.id === id);
        if (user.role === "BOSS") {
          fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
            .then((res) => res.json())
            .then((data) => {
              const rn = data.user?.realNameVerification;
              setChatRestricted(rn?.status !== "APPROVED");
            })
            .catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }

    if (currentUserId !== id) {
      fetch(`/api/shops/${id}/track-view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({ source: "shop_page" }),
      }).catch(() => {});
    }

    if (!t) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    Promise.all([
      fetch(`/api/shops/${id}/homepage`, {
        headers: { Authorization: `Bearer ${t}` },
      }).then((res) => res.json()),
      fetch(`/api/shops/${id}/reviews?pageSize=10`, {
        headers: { Authorization: `Bearer ${t}` },
      }).then((res) => res.json()),
    ])
      .then(([homeData, reviewData]) => {
        if (homeData.error || !homeData.homepage) {
          setNotFound(true);
          return;
        }
        setHomepage(homeData.homepage);
        setIsOwnerPreview(homeData.isOwner || currentUserId === id);
        if (reviewData.reviews) setReviews(reviewData.reviews);
        if (reviewData.summary) setReviewSummary(reviewData.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleChat = async () => {
    if (!homepage) return;
    if (chatRestricted) {
      setChatError("请先完成实名认证后再发起聊天");
      return;
    }
    setChatError("");
    setChatLoading(true);
    const t = localStorage.getItem(TOKEN_KEY);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({ targetUserId: homepage.shopUserId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/chat/${data.conversation.id}`);
      } else {
        setChatError(data.error || "发起聊天失败");
      }
    } catch {
      setChatError("发起聊天失败");
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleFavorite = useCallback(async () => {
    if (!homepage || !token || userRole !== "BOSS") return;
    setFavoriteLoading(true);
    try {
      const favorited = homepage.isFavorited;
      const res = await fetch(`/api/shops/${id}/favorite`, {
        method: favorited ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHomepage({ ...homepage, isFavorited: data.favorited });
    } catch (e) {
      console.error(e);
    } finally {
      setFavoriteLoading(false);
    }
  }, [homepage, token, userRole, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (notFound || !homepage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-6xl">🏪</span>
        <p className="text-gray-400 text-lg text-center">
          {!token ? "请先登录后查看店铺主页" : "店铺不存在或暂未营业"}
        </p>
        <button
          onClick={() => (token ? router.back() : router.push("/login"))}
          className="text-sm text-purple-400 hover:text-purple-300 transition"
        >
          {token ? "← 返回" : "去登录 →"}
        </button>
      </div>
    );
  }

  const displayReviews = homepage.showReviews ? reviews : [];

  return (
    <ShopHomepageView
      homepage={homepage}
      mode={isOwnerPreview ? "preview" : "public"}
      displayRating={reviewSummary?.avgRating ?? homepage.rating}
      displayReviewCount={reviewSummary?.reviewCount ?? homepage.reviewCount}
      reviews={displayReviews}
      chatLoading={chatLoading}
      chatRestricted={chatRestricted}
      chatError={chatError}
      favoriteLoading={favoriteLoading}
      onChat={handleChat}
      onToggleFavorite={userRole === "BOSS" ? handleToggleFavorite : undefined}
      onBack={() => router.back()}
      editHref={isOwnerPreview ? "/profile/shop/homepage" : undefined}
    />
  );
}
