import type { ShopPromoImage, ShopShowcasePlayer, ShopProfile, User } from "@prisma/client";
import { normalizeShopGameCategories, validateShopGameCategories } from "@/lib/shop-taxonomy";

export const SHOP_THEME_KEYS = ["violet", "rose", "cyan", "gold"] as const;
export type ShopThemeKey = (typeof SHOP_THEME_KEYS)[number];

export const SHOP_PRICE_UNITS = [
  { value: "hour", label: "小时" },
  { value: "game", label: "局" },
  { value: "session", label: "次" },
] as const;

export const SHOP_PROMO_MAX = 6;
export const SHOP_SHOWCASE_MAX = 12;
export const SHOP_SLOGAN_MAX = 40;
export const SHOP_DESC_MAX = 800;
export const SHOP_PRICE_NOTE_MAX = 60;
export const SHOP_HIGHLIGHT_MAX = 40;
export const SHOP_PLAYER_NAME_MAX = 20;

export const SHOP_THEME_STYLES: Record<
  ShopThemeKey,
  { gradient: string; accent: string; accentMuted: string; chip: string; cta: string }
> = {
  violet: {
    gradient: "from-indigo-600/80 via-purple-600/60 to-pink-800/80",
    accent: "text-violet-400",
    accentMuted: "text-purple-300",
    chip: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    cta: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
  },
  rose: {
    gradient: "from-rose-600/80 via-pink-600/60 to-fuchsia-800/80",
    accent: "text-rose-400",
    accentMuted: "text-pink-300",
    chip: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    cta: "from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700",
  },
  cyan: {
    gradient: "from-cyan-600/80 via-teal-600/60 to-blue-800/80",
    accent: "text-cyan-400",
    accentMuted: "text-teal-300",
    chip: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    cta: "from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700",
  },
  gold: {
    gradient: "from-amber-600/80 via-orange-600/60 to-yellow-800/80",
    accent: "text-amber-400",
    accentMuted: "text-yellow-300",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    cta: "from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700",
  },
};

export function parseShopThemeKey(raw: unknown): ShopThemeKey {
  if (typeof raw === "string" && SHOP_THEME_KEYS.includes(raw as ShopThemeKey)) {
    return raw as ShopThemeKey;
  }
  return "violet";
}

export function parsePriceUnit(raw: unknown): string {
  const v = typeof raw === "string" ? raw.trim() : "hour";
  return SHOP_PRICE_UNITS.some((u) => u.value === v) ? v : "hour";
}

export function formatPriceUnitLabel(unit: string): string {
  return SHOP_PRICE_UNITS.find((u) => u.value === unit)?.label ?? "小时";
}

export type ShopHomepageShowcasePlayer = {
  id: string;
  displayName: string;
  avatar: string | null;
  gameTags: string[];
  pricePerHour: number | null;
  highlight: string | null;
  sortOrder: number;
  isFeatured: boolean;
};

export type ShopHomepagePromoImage = {
  id: string;
  url: string;
  status: string;
  sortOrder: number;
};

export type ShopHomepagePayload = {
  shopUserId: string;
  shopName: string;
  nickname: string;
  avatar: string | null;
  status: string;
  slogan: string | null;
  shopDesc: string | null;
  shopGames: string[];
  shopCover: string | null;
  shopBanner: string | null;
  priceFrom: number | null;
  priceUnit: string;
  priceNote: string | null;
  themeKey: ShopThemeKey;
  showPromoImages: boolean;
  showShowcasePlayers: boolean;
  showReviews: boolean;
  playerCount: number;
  rating: number | null;
  orderCount: number;
  reviewCount: number;
  promoImages: ShopHomepagePromoImage[];
  showcasePlayers: ShopHomepageShowcasePlayer[];
  isFavorited?: boolean;
};

type ShopWithRelations = ShopProfile & {
  user: Pick<User, "id" | "nickname" | "avatar" | "status">;
  promoImages?: ShopPromoImage[];
  showcasePlayers?: ShopShowcasePlayer[];
};

function formatShowcasePlayer(p: ShopShowcasePlayer): ShopHomepageShowcasePlayer {
  return {
    id: p.id,
    displayName: p.displayName,
    avatar: p.avatar,
    gameTags: normalizeShopGameCategories(p.gameTags),
    pricePerHour: p.pricePerHour != null ? Number(p.pricePerHour) : null,
    highlight: p.highlight,
    sortOrder: p.sortOrder,
    isFeatured: p.isFeatured,
  };
}

export function buildShopHomepagePayload(
  profile: ShopWithRelations,
  opts: { includePendingMedia?: boolean; isFavorited?: boolean } = {}
): ShopHomepagePayload {
  const includePending = opts.includePendingMedia ?? false;
  const promoImages = (profile.promoImages ?? [])
    .filter((img) => includePending || img.status === "APPROVED")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => ({
      id: img.id,
      url: img.url,
      status: img.status,
      sortOrder: img.sortOrder,
    }));

  const showcasePlayers = (profile.showcasePlayers ?? [])
    .filter((p) => p.isFeatured)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(formatShowcasePlayer);

  const bannerOk = includePending || profile.shopBannerStatus === "APPROVED";
  const coverOk = includePending || profile.shopCoverStatus === "APPROVED";

  return {
    shopUserId: profile.userId,
    shopName: profile.shopName,
    nickname: profile.user.nickname,
    avatar: profile.user.avatar,
    status: profile.user.status,
    slogan: profile.slogan,
    shopDesc: profile.shopDesc,
    shopGames: normalizeShopGameCategories(profile.gameCategories),
    shopCover: coverOk ? profile.shopCover : null,
    shopBanner: bannerOk ? profile.shopBanner : null,
    priceFrom: profile.priceFrom != null ? Number(profile.priceFrom) : null,
    priceUnit: profile.priceUnit,
    priceNote: profile.priceNote,
    themeKey: parseShopThemeKey(profile.themeKey),
    showPromoImages: profile.showPromoImages,
    showShowcasePlayers: profile.showShowcasePlayers,
    showReviews: profile.showReviews,
    playerCount: showcasePlayers.length || profile.playerCount,
    rating: profile.rating != null ? Number(profile.rating) : null,
    orderCount: profile.orderCount,
    reviewCount: profile.reviewCount,
    promoImages,
    showcasePlayers,
    isFavorited: opts.isFavorited,
  };
}

export function validateHomepagePatch(body: Record<string, unknown>): {
  data: Record<string, unknown>;
  error: string | null;
} {
  const data: Record<string, unknown> = {};

  if ("slogan" in body) {
    const s = typeof body.slogan === "string" ? body.slogan.trim() : "";
    if (s.length > SHOP_SLOGAN_MAX) return { data, error: `标语最多 ${SHOP_SLOGAN_MAX} 字` };
    data.slogan = s || null;
  }

  if ("shopDesc" in body) {
    const d = typeof body.shopDesc === "string" ? body.shopDesc.trim() : "";
    if (d.length > SHOP_DESC_MAX) return { data, error: `简介最多 ${SHOP_DESC_MAX} 字` };
    data.shopDesc = d || null;
  }

  if ("priceFrom" in body) {
    if (body.priceFrom === null || body.priceFrom === "") {
      data.priceFrom = null;
    } else {
      const n = Number(body.priceFrom);
      if (!Number.isFinite(n) || n < 0 || n > 99999) {
        return { data, error: "起步价无效" };
      }
      data.priceFrom = n;
    }
  }

  if ("priceUnit" in body) {
    data.priceUnit = parsePriceUnit(body.priceUnit);
  }

  if ("priceNote" in body) {
    const n = typeof body.priceNote === "string" ? body.priceNote.trim() : "";
    if (n.length > SHOP_PRICE_NOTE_MAX) return { data, error: `价格备注最多 ${SHOP_PRICE_NOTE_MAX} 字` };
    data.priceNote = n || null;
  }

  if ("themeKey" in body) {
    data.themeKey = parseShopThemeKey(body.themeKey);
  }

  if ("showPromoImages" in body) {
    data.showPromoImages = Boolean(body.showPromoImages);
  }
  if ("showShowcasePlayers" in body) {
    data.showShowcasePlayers = Boolean(body.showShowcasePlayers);
  }
  if ("showReviews" in body) {
    data.showReviews = Boolean(body.showReviews);
  }

  if ("gameCategories" in body) {
    const gameCategories = normalizeShopGameCategories(body.gameCategories);
    const gameErr = validateShopGameCategories(gameCategories, { min: 0 });
    if (gameErr) return { data, error: gameErr };
    data.gameCategories = gameCategories;
  }

  if ("shopBanner" in body) {
    const url = typeof body.shopBanner === "string" ? body.shopBanner.trim() : "";
    data.shopBanner = url || null;
    if (url) {
      data.shopBannerStatus = "APPROVED";
    }
  }

  if ("shopCover" in body) {
    const url = typeof body.shopCover === "string" ? body.shopCover.trim() : "";
    data.shopCover = url || null;
    if (url) {
      data.shopCoverStatus = "APPROVED";
    }
  }

  return { data, error: null };
}

export function validateShowcasePlayerInput(body: Record<string, unknown>, partial = false) {
  const data: Record<string, unknown> = {};

  if (!partial || "displayName" in body) {
    const name = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (!name) return { data, error: "陪玩昵称不能为空" };
    if (name.length > SHOP_PLAYER_NAME_MAX) return { data, error: `昵称最多 ${SHOP_PLAYER_NAME_MAX} 字` };
    data.displayName = name;
  }

  if ("avatar" in body) {
    const url = typeof body.avatar === "string" ? body.avatar.trim() : "";
    data.avatar = url || null;
  }

  if ("gameTags" in body) {
    const tags = normalizeShopGameCategories(body.gameTags);
    data.gameTags = tags;
  }

  if ("pricePerHour" in body) {
    if (body.pricePerHour === null || body.pricePerHour === "") {
      data.pricePerHour = null;
    } else {
      const n = Number(body.pricePerHour);
      if (!Number.isFinite(n) || n < 0 || n > 99999) return { data, error: "价格无效" };
      data.pricePerHour = n;
    }
  }

  if ("highlight" in body) {
    const h = typeof body.highlight === "string" ? body.highlight.trim() : "";
    if (h.length > SHOP_HIGHLIGHT_MAX) return { data, error: `亮点最多 ${SHOP_HIGHLIGHT_MAX} 字` };
    data.highlight = h || null;
  }

  if ("isFeatured" in body) {
    data.isFeatured = Boolean(body.isFeatured);
  }

  if ("sortOrder" in body) {
    const n = Number(body.sortOrder);
    if (!Number.isFinite(n)) return { data, error: "排序无效" };
    data.sortOrder = Math.max(0, Math.floor(n));
  }

  return { data, error: null };
}

export async function syncShopPlayerCount(shopProfileId: string) {
  const { prisma } = await import("@/lib/prisma");
  const count = await prisma.shopShowcasePlayer.count({
    where: { shopProfileId, isFeatured: true },
  });
  await prisma.shopProfile.update({
    where: { id: shopProfileId },
    data: { playerCount: count },
  });
  return count;
}
