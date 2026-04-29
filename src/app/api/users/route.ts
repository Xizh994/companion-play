import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;

    const url = new URL(req.url);
    const userId = url.searchParams.get("id");
    const role = url.searchParams.get("role");
    const game = url.searchParams.get("game");

    // 单用户查询
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { playerProfile: true },
      });
      if (!user) return NextResponse.json({ users: [] });
      return NextResponse.json({
        users: [{
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio,
          status: user.status,
          role: user.role,
          games: user.playerProfile?.gameCategories || [],
          services: user.playerProfile?.serviceTags || [],
          pricePerHour: user.playerProfile?.pricePerHour,
          createdAt: user.createdAt,
        }],
      });
    }

    // 列表查询
    const where: any = { status: { not: "offline" }, role: "PLAYER" };
    if (game) {
      where.playerProfile = { gameCategories: { has: game } };
    }

    const users = await prisma.user.findMany({
      where,
      include: { playerProfile: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        bio: u.bio,
        status: u.status,
        role: u.role,
        games: u.playerProfile?.gameCategories || [],
        services: u.playerProfile?.serviceTags || [],
        pricePerHour: u.playerProfile?.pricePerHour,
        createdAt: u.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}