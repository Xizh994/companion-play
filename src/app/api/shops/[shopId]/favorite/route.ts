import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { canShopOperatePublicly } from "@/lib/shop-access";

async function loadShop(shopUserId: string) {
  return prisma.user.findUnique({
    where: { id: shopUserId },
    include: { shopProfile: true },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const user = await getAuthUser(_req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "BOSS") {
      return NextResponse.json({ error: "仅老板可收藏店铺" }, { status: 403 });
    }

    const { shopId } = await params;
    const fav = await prisma.shopFavorite.findUnique({
      where: {
        shopUserId_bossUserId: { shopUserId: shopId, bossUserId: user.id },
      },
    });

    return NextResponse.json({ favorited: !!fav });
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const user = await getAuthUser(_req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "BOSS") {
      return NextResponse.json({ error: "仅老板可收藏店铺" }, { status: 403 });
    }

    const { shopId } = await params;
    if (shopId === user.id) {
      return NextResponse.json({ error: "无法收藏自己" }, { status: 400 });
    }

    const shop = await loadShop(shopId);
    if (!shop?.shopProfile || shop.role !== "SHOP") {
      return NextResponse.json({ error: "店铺不存在" }, { status: 404 });
    }
    if (!canShopOperatePublicly(shop)) {
      return NextResponse.json({ error: "店铺暂未营业" }, { status: 403 });
    }

    await prisma.shopFavorite.upsert({
      where: {
        shopUserId_bossUserId: { shopUserId: shopId, bossUserId: user.id },
      },
      create: { shopUserId: shopId, bossUserId: user.id },
      update: {},
    });

    return NextResponse.json({ favorited: true });
  } catch {
    return NextResponse.json({ error: "收藏失败" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const user = await getAuthUser(_req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "BOSS") {
      return NextResponse.json({ error: "仅老板可取消收藏" }, { status: 403 });
    }

    const { shopId } = await params;
    await prisma.shopFavorite.deleteMany({
      where: { shopUserId: shopId, bossUserId: user.id },
    });

    return NextResponse.json({ favorited: false });
  } catch {
    return NextResponse.json({ error: "取消收藏失败" }, { status: 500 });
  }
}
