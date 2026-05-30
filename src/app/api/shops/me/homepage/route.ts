import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  buildShopHomepagePayload,
  SHOP_PROMO_MAX,
  validateHomepagePatch,
} from "@/lib/shop-homepage";

async function loadShopHomepage(shopUserId: string, includePendingMedia: boolean) {
  return prisma.shopProfile.findUnique({
    where: { userId: shopUserId },
    include: {
      user: { select: { id: true, nickname: true, avatar: true, status: true } },
      promoImages: { orderBy: { sortOrder: "asc" } },
      showcasePlayers: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "SHOP") {
      return NextResponse.json({ error: "仅店铺可访问" }, { status: 403 });
    }

    const profile = await loadShopHomepage(user.id, true);
    if (!profile) return NextResponse.json({ error: "店铺资料不存在" }, { status: 404 });

    return NextResponse.json({
      homepage: buildShopHomepagePayload(profile, { includePendingMedia: true }),
    });
  } catch {
    return NextResponse.json({ error: "获取主页配置失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "SHOP") {
      return NextResponse.json({ error: "仅店铺可访问" }, { status: 403 });
    }

    const profile = await prisma.shopProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ error: "店铺资料不存在" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const { data, error } = validateHomepagePatch(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    if ("promoImageIds" in body && Array.isArray(body.promoImageIds)) {
      const ids = body.promoImageIds.filter((id): id is string => typeof id === "string");
      const existing = await prisma.shopPromoImage.findMany({
        where: { shopProfileId: profile.id },
      });
      const existingIds = new Set(existing.map((e) => e.id));
      for (const id of ids) {
        if (!existingIds.has(id)) {
          return NextResponse.json({ error: "宣传图不存在" }, { status: 400 });
        }
      }
      await prisma.$transaction(
        ids.map((id, index) =>
          prisma.shopPromoImage.update({
            where: { id },
            data: { sortOrder: index },
          })
        )
      );
      const toDelete = existing.filter((e) => !ids.includes(e.id));
      if (toDelete.length > 0) {
        await prisma.shopPromoImage.deleteMany({
          where: { id: { in: toDelete.map((d) => d.id) } },
        });
      }
    }

    if ("addPromoImageUrl" in body && typeof body.addPromoImageUrl === "string") {
      const url = body.addPromoImageUrl.trim();
      if (!url.startsWith("/api/uploads/shop/")) {
        return NextResponse.json({ error: "宣传图地址无效" }, { status: 400 });
      }
      const count = await prisma.shopPromoImage.count({ where: { shopProfileId: profile.id } });
      if (count >= SHOP_PROMO_MAX) {
        return NextResponse.json({ error: `最多上传 ${SHOP_PROMO_MAX} 张宣传图` }, { status: 400 });
      }
      await prisma.shopPromoImage.create({
        data: {
          shopProfileId: profile.id,
          url,
          sortOrder: count,
          status: "APPROVED",
        },
      });
    }

    if ("removePromoImageId" in body && typeof body.removePromoImageId === "string") {
      await prisma.shopPromoImage.deleteMany({
        where: { id: body.removePromoImageId, shopProfileId: profile.id },
      });
    }

    if (Object.keys(data).length > 0) {
      await prisma.shopProfile.update({
        where: { id: profile.id },
        data,
      });
    }

    const updated = await loadShopHomepage(user.id, true);
    if (!updated) return NextResponse.json({ error: "店铺资料不存在" }, { status: 404 });

    return NextResponse.json({
      success: true,
      homepage: buildShopHomepagePayload(updated, { includePendingMedia: true }),
    });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
