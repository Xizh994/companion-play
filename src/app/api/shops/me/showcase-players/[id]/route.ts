import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { syncShopPlayerCount, validateShowcasePlayerInput } from "@/lib/shop-homepage";

async function getOwnedPlayer(shopUserId: string, playerId: string) {
  const profile = await prisma.shopProfile.findUnique({ where: { userId: shopUserId } });
  if (!profile) return { profile: null, player: null };
  const player = await prisma.shopShowcasePlayer.findFirst({
    where: { id: playerId, shopProfileId: profile.id },
  });
  return { profile, player };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "SHOP") {
      return NextResponse.json({ error: "仅店铺可访问" }, { status: 403 });
    }

    const { id } = await params;
    const { profile, player } = await getOwnedPlayer(user.id, id);
    if (!profile || !player) {
      return NextResponse.json({ error: "陪玩不存在" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;

    if ("reorderIds" in body && Array.isArray(body.reorderIds)) {
      const ids = body.reorderIds.filter((x): x is string => typeof x === "string");
      const existing = await prisma.shopShowcasePlayer.findMany({
        where: { shopProfileId: profile.id },
      });
      if (ids.length !== existing.length) {
        return NextResponse.json({ error: "排序数据不完整" }, { status: 400 });
      }
      const set = new Set(existing.map((e) => e.id));
      for (const pid of ids) {
        if (!set.has(pid)) return NextResponse.json({ error: "陪玩不存在" }, { status: 400 });
      }
      await prisma.$transaction(
        ids.map((pid, index) =>
          prisma.shopShowcasePlayer.update({
            where: { id: pid },
            data: { sortOrder: index },
          })
        )
      );
      const players = await prisma.shopShowcasePlayer.findMany({
        where: { shopProfileId: profile.id },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json({ players });
    }

    const { data, error } = validateShowcasePlayerInput(body, true);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const updated = await prisma.shopShowcasePlayer.update({
      where: { id: player.id },
      data,
    });

    if ("isFeatured" in data) {
      await syncShopPlayerCount(profile.id);
    }

    return NextResponse.json({ player: updated });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "SHOP") {
      return NextResponse.json({ error: "仅店铺可访问" }, { status: 403 });
    }

    const { id } = await params;
    const { profile, player } = await getOwnedPlayer(user.id, id);
    if (!profile || !player) {
      return NextResponse.json({ error: "陪玩不存在" }, { status: 404 });
    }

    await prisma.shopShowcasePlayer.delete({ where: { id: player.id } });
    await syncShopPlayerCount(profile.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
