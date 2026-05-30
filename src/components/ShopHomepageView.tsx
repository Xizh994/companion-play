"use client";

import Link from "next/link";
import { SafeAvatar } from "@/components/GeneratedAvatar";
import {
  formatPriceUnitLabel,
  SHOP_THEME_STYLES,
  type ShopHomepagePayload,
  type ShopHomepageShowcasePlayer,
} from "@/lib/shop-homepage";
import { cn } from "@/lib/utils";
import { Heart, Loader2, MessageCircle, Pencil, Star } from "lucide-react";

export interface ShopPublicReview {
  id: string;
  score: number;
  content: string;
  reviewerNickname: string;
  reviewerAvatar: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

interface ShopHomepageViewProps {
  homepage: ShopHomepagePayload;
  mode?: "public" | "preview" | "owner";
  displayRating?: number | null;
  displayReviewCount?: number;
  reviews?: ShopPublicReview[];
  chatLoading?: boolean;
  chatRestricted?: boolean;
  chatError?: string;
  favoriteLoading?: boolean;
  onChat?: () => void;
  onToggleFavorite?: () => void;
  onBack?: () => void;
  editHref?: string;
}

export function ShopHomepageView({
  homepage,
  mode = "public",
  displayRating,
  displayReviewCount,
  reviews = [],
  chatLoading = false,
  chatRestricted = false,
  chatError = "",
  favoriteLoading = false,
  onChat,
  onToggleFavorite,
  onBack,
  editHref,
}: ShopHomepageViewProps) {
  const isOwner = mode === "owner" || mode === "preview";
  const theme = SHOP_THEME_STYLES[homepage.themeKey];
  const shopName = homepage.shopName || homepage.nickname;
  const isOnline = homepage.status !== "offline";
  const rating = displayRating ?? homepage.rating;
  const reviewCount = displayReviewCount ?? homepage.reviewCount;

  const showReviews = homepage.showReviews && reviews.length > 0;
  const showPromo = homepage.showPromoImages && homepage.promoImages.length > 0;
  const showPlayers = homepage.showShowcasePlayers && homepage.showcasePlayers.length > 0;

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {isOwner && mode === "preview" && (
        <div className="sticky top-0 z-30 bg-violet-600/90 backdrop-blur-md text-center text-xs text-white py-2 px-4">
          预览中 · 客人看到的效果
          {editHref && (
            <Link href={editHref} className="ml-3 underline font-medium inline-flex items-center gap-1">
              <Pencil className="w-3 h-3" />
              编辑主页
            </Link>
          )}
        </div>
      )}

      <div className="relative">
        <div className="relative h-44 sm:h-52 overflow-hidden">
          {homepage.shopBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={homepage.shopBanner} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br", theme.gradient)} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/40 to-black/20" />

          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            {onBack ? (
              <button
                onClick={onBack}
                className="w-10 h-10 glass rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
                aria-label="返回"
              >
                ←
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {!isOwner && onToggleFavorite && (
                <button
                  onClick={onToggleFavorite}
                  disabled={favoriteLoading}
                  className={cn(
                    "w-10 h-10 glass rounded-full flex items-center justify-center transition",
                    homepage.isFavorited ? "text-rose-400" : "text-white hover:bg-white/20"
                  )}
                  aria-label={homepage.isFavorited ? "取消收藏" : "收藏店铺"}
                >
                  {favoriteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className={cn("w-5 h-5", homepage.isFavorited && "fill-current")} />
                  )}
                </button>
              )}
              {isOwner && editHref && (
                <Link
                  href={editHref}
                  className="px-3 py-2 glass rounded-full text-xs text-white hover:bg-white/20 transition inline-flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  编辑
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-20 flex justify-center -mt-12">
          <div className="relative ring-4 ring-[#0f0f1a] rounded-full">
            <SafeAvatar src={homepage.avatar} seed={shopName} size={96} />
            {!isOwner && isOnline && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-[#0f0f1a]" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">{shopName}</h1>
          {homepage.slogan && (
            <p className={cn("text-sm mt-1", theme.accentMuted)}>{homepage.slogan}</p>
          )}
          {!isOwner && (
            <div className="flex items-center justify-center gap-1 mt-2">
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
          )}
        </div>

        {!isOwner && chatError && (
          <p className="text-center text-sm text-red-400 mb-4">{chatError}</p>
        )}

        {!isOwner && (
          <div className="hidden md:block mb-6">
            <ChatCta
              chatRestricted={chatRestricted}
              chatLoading={chatLoading}
              onChat={onChat}
              themeCta={theme.cta}
            />
          </div>
        )}

        {(homepage.priceFrom != null || homepage.priceNote) && (
          <div className="glass rounded-2xl px-5 py-4 mb-6 border border-white/10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
            {homepage.priceFrom != null && (
              <span className="text-white font-semibold">
                起步价{" "}
                <span className={cn("text-xl", theme.accent.replace("text-", "text-"))}>
                  ¥{homepage.priceFrom}
                </span>
                <span className="text-gray-500 font-normal text-xs">
                  /{formatPriceUnitLabel(homepage.priceUnit)}
                </span>
              </span>
            )}
            {homepage.priceNote && (
              <span className="text-gray-400 text-xs">{homepage.priceNote}</span>
            )}
          </div>
        )}

        <div className="glass rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-5 text-sm text-gray-400">
            {rating != null && (
              <span className="text-yellow-400 font-medium">★ {Number(rating).toFixed(1)}</span>
            )}
            {reviewCount > 0 && <span>{reviewCount} 条评价</span>}
            {homepage.orderCount > 0 && <span>{homepage.orderCount} 单</span>}
            {homepage.playerCount > 0 && <span>{homepage.playerCount} 位陪玩师</span>}
          </div>

          {homepage.shopGames.length > 0 && (
            <div className="mb-5">
              <p className="text-sm text-gray-500 mb-2 text-center">主打游戏</p>
              <div className="flex flex-wrap justify-center gap-2">
                {homepage.shopGames.map((g) =>
                  isOwner ? (
                    <span key={g} className={cn("px-3 py-1 text-sm rounded-lg border", theme.chip)}>
                      {g}
                    </span>
                  ) : (
                    <Link
                      key={g}
                      href={`/lobby?game=${encodeURIComponent(g)}`}
                      className={cn(
                        "px-3 py-1 text-sm rounded-lg border hover:opacity-90 transition",
                        theme.chip
                      )}
                    >
                      {g}
                    </Link>
                  )
                )}
              </div>
            </div>
          )}

          {homepage.shopDesc && (
            <div>
              <p className="text-sm text-gray-500 mb-2 text-center">店铺介绍</p>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line text-center">
                {homepage.shopDesc}
              </p>
            </div>
          )}
        </div>

        {showPromo && (
          <section className="mb-6">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-hide">
              {homepage.promoImages.map((img) => (
                <div
                  key={img.id}
                  className="snap-start shrink-0 w-[72%] sm:w-[280px] aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {showPlayers && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 px-1">主打陪玩</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {homepage.showcasePlayers.map((p) => (
                <ShowcasePlayerCard key={p.id} player={p} themeChip={theme.chip} accent={theme.accent} />
              ))}
            </div>
          </section>
        )}

        {showReviews && (
          <div className="glass rounded-2xl p-6 border border-white/10">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">顾客评价</h2>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <SafeAvatar src={r.reviewerAvatar} seed={r.reviewerNickname} size={28} />
                    <span className="text-sm text-gray-200">{r.reviewerNickname}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={cn(
                            "w-3.5 h-3.5",
                            n <= r.score ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{r.content}</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isOwner && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#0f0f1a]/95 backdrop-blur-md border-t border-white/10">
          <ChatCta
            chatRestricted={chatRestricted}
            chatLoading={chatLoading}
            onChat={onChat}
            themeCta={theme.cta}
            compact
          />
        </div>
      )}
    </div>
  );
}

function ChatCta({
  chatRestricted,
  chatLoading,
  onChat,
  themeCta,
  compact,
}: {
  chatRestricted: boolean;
  chatLoading: boolean;
  onChat?: () => void;
  themeCta: string;
  compact?: boolean;
}) {
  if (chatRestricted) {
    return (
      <div
        className={cn(
          "rounded-xl bg-amber-500/10 border border-amber-500/30 text-center text-sm text-amber-100 space-y-2",
          compact ? "p-3" : "p-4 mb-0"
        )}
      >
        <p>完成实名认证后可与店铺发起聊天</p>
        <Link href="/profile" className="text-pink-400 hover:text-pink-300 font-medium underline">
          前往实名认证 →
        </Link>
      </div>
    );
  }

  return (
    <button
      onClick={onChat}
      disabled={chatLoading}
      className={cn(
        "w-full rounded-xl bg-gradient-to-r text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg disabled:opacity-60",
        themeCta,
        compact ? "py-3" : "py-3.5 hover:shadow-purple-500/25"
      )}
    >
      {chatLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
      发起聊天
    </button>
  );
}

function ShowcasePlayerCard({
  player,
  themeChip,
  accent,
}: {
  player: ShopHomepageShowcasePlayer;
  themeChip: string;
  accent: string;
}) {
  return (
    <div className="glass rounded-2xl p-4 border border-white/10 flex gap-3">
      <div className="relative shrink-0">
        <SafeAvatar src={player.avatar} seed={player.displayName} size={52} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{player.displayName}</p>
          </div>
          {player.pricePerHour != null && (
            <span className={cn("text-sm font-bold shrink-0", accent)}>
              ¥{player.pricePerHour}
              <span className="text-[10px] text-gray-500 font-normal">/时</span>
            </span>
          )}
        </div>
        {player.highlight && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{player.highlight}</p>
        )}
        {player.gameTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {player.gameTags.slice(0, 3).map((g) => (
              <span key={g} className={cn("px-1.5 py-0.5 text-[10px] rounded border", themeChip)}>
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
