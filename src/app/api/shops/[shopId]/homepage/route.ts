import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { buildShopHomepagePayload } from "@/lib/shop-homepage";
import { canShopOperatePublicly } from "@/lib/shop-access";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const caller = await getAuthUser(req);
    const isOwner = caller?.id === shopId;

    const user = await prisma.user.findUnique({
      where: { id: shopId },
      include: {
        shopProfile: {
          include: {
            promoImages: { orderBy: { sortOrder: "asc" } },
            showcasePlayers: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    if (!user?.shopProfile || user.role !== "SHOP") {
      return NextResponse.json({ error: "店铺不存在" }, { status: 404 });
    }

    if (!isOwner && !canShopOperatePublicly(user)) {
      return NextResponse.json({ error: "店铺暂未营业" }, { status: 403 });
    }

    let isFavorited = false;
    if (caller?.role === "BOSS") {
      const fav = await prisma.shopFavorite.findUnique({
        where: {
          shopUserId_bossUserId: { shopUserId: shopId, bossUserId: caller.id },
        },
      });
      isFavorited = !!fav;
    }

    const profile = {
      ...user.shopProfile,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        status: user.status,
      },
    };

    return NextResponse.json({
      homepage: buildShopHomepagePayload(profile, {
        includePendingMedia: isOwner,
        isFavorited,
      }),
      isOwner,
    });
  } catch {
    return NextResponse.json({ error: "获取店铺主页失败" }, { status: 500 });
  }
}
