import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { normalizeShopGameCategories } from "@/lib/shop-taxonomy";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "BOSS") {
      return NextResponse.json({ error: "仅老板可查看收藏" }, { status: 403 });
    }

    const favorites = await prisma.shopFavorite.findMany({
      where: { bossUserId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (favorites.length === 0) {
      return NextResponse.json({ favorites: [] });
    }

    const shopUserIds = favorites.map((f) => f.shopUserId);
    const shops = await prisma.user.findMany({
      where: { id: { in: shopUserIds }, role: "SHOP" },
      include: { shopProfile: true },
    });

    const shopMap = new Map(shops.map((s) => [s.id, s]));

    const list = favorites
      .map((fav) => {
        const shop = shopMap.get(fav.shopUserId);
        if (!shop?.shopProfile) return null;
        const sp = shop.shopProfile;
        return {
          shopUserId: shop.id,
          shopName: sp.shopName,
          avatar: shop.avatar,
          slogan: sp.slogan,
          shopBanner: sp.shopBanner,
          shopCover: sp.shopCover,
          shopGames: normalizeShopGameCategories(sp.gameCategories),
          rating: sp.rating != null ? Number(sp.rating) : null,
          reviewCount: sp.reviewCount,
          priceFrom: sp.priceFrom != null ? Number(sp.priceFrom) : null,
          status: shop.status,
          favoritedAt: fav.createdAt.toISOString(),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ favorites: list });
  } catch {
    return NextResponse.json({ error: "获取收藏列表失败" }, { status: 500 });
  }
}
