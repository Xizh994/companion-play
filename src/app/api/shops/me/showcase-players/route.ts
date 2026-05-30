import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  SHOP_SHOWCASE_MAX,
  syncShopPlayerCount,
  validateShowcasePlayerInput,
} from "@/lib/shop-homepage";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "SHOP") {
      return NextResponse.json({ error: "仅店铺可访问" }, { status: 403 });
    }

    const profile = await prisma.shopProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ error: "店铺资料不存在" }, { status: 404 });

    const players = await prisma.shopShowcasePlayer.findMany({
      where: { shopProfileId: profile.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ players });
  } catch {
    return NextResponse.json({ error: "获取陪玩列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "SHOP") {
      return NextResponse.json({ error: "仅店铺可访问" }, { status: 403 });
    }

    const profile = await prisma.shopProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ error: "店铺资料不存在" }, { status: 404 });

    const count = await prisma.shopShowcasePlayer.count({ where: { shopProfileId: profile.id } });
    if (count >= SHOP_SHOWCASE_MAX) {
      return NextResponse.json({ error: `最多添加 ${SHOP_SHOWCASE_MAX} 位主打陪玩` }, { status: 400 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const { data, error } = validateShowcasePlayerInput(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const player = await prisma.shopShowcasePlayer.create({
      data: {
        shopProfileId: profile.id,
        displayName: data.displayName as string,
        avatar: (data.avatar as string | null) ?? null,
        gameTags: (data.gameTags as string[]) ?? [],
        pricePerHour: data.pricePerHour as number | null | undefined,
        highlight: (data.highlight as string | null) ?? null,
        isFeatured: data.isFeatured !== false,
        sortOrder: count,
      },
    });

    await syncShopPlayerCount(profile.id);

    return NextResponse.json({ player });
  } catch {
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }
}
