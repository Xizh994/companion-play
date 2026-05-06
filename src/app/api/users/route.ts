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
    const search = url.searchParams.get("search");

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { playerProfile: true, shopProfile: true },
      });
      if (!user) return NextResponse.json({ users: [] });
      return NextResponse.json({
        users: [formatUser(user)],
      });
    }

    if (role === "SHOP") {
      const where: any = {};
      if (search) {
        where.OR = [
          { nickname: { contains: search, mode: "insensitive" } },
          { shopProfile: { shopName: { contains: search, mode: "insensitive" } } },
          { shopProfile: { shopDesc: { contains: search, mode: "insensitive" } } },
        ];
      }

      const users = await prisma.user.findMany({
        where: { ...where, role: "SHOP" },
        include: { shopProfile: true },
        take: 50,
        orderBy: { shopProfile: { orderCount: "desc" } },
      });

      return NextResponse.json({
        users: users.map(formatUser),
      });
    }

    if (role === "BOSS") {
      const where: any = { role: "BOSS", status: "online" };
      if (search) {
        where.OR = [
          { nickname: { contains: search, mode: "insensitive" } },
          { bio: { contains: search, mode: "insensitive" } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        take: 50,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        users: users.map(formatUser),
      });
    }

    const where: any = { status: { not: "offline" }, role: "PLAYER" };
    if (game) {
      where.playerProfile = { gameCategories: { has: game } };
    }
    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { playerProfile: { gameCategories: { has: search } } },
        { playerProfile: { serviceTags: { has: search } } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: { playerProfile: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users: users.map(formatUser),
    });
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

function formatUser(u: any) {
  return {
    id: u.id,
    nickname: u.nickname,
    avatar: u.avatar,
    bio: u.bio,
    status: u.status,
    role: u.role,
    games: u.playerProfile?.gameCategories || [],
    services: u.playerProfile?.serviceTags || [],
    pricePerHour: u.playerProfile?.pricePerHour,
    shopName: u.shopProfile?.shopName || null,
    shopDesc: u.shopProfile?.shopDesc || null,
    shopCover: u.shopProfile?.shopCover || null,
    shopAddress: u.shopProfile?.shopAddress || null,
    playerCount: u.shopProfile?.playerCount || 0,
    rating: u.shopProfile?.rating ? Number(u.shopProfile.rating) : null,
    orderCount: u.shopProfile?.orderCount || 0,
    createdAt: u.createdAt,
  };
}
