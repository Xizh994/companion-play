import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import {
  BOSS_PREVIEW_SHOP_LIMIT,
  canBossUseFullPlatform,
  isBossRealNameApproved,
  loadUserWithRealName,
} from "@/lib/boss-access";
import {
  canShopOperatePublicly,
  SHOP_VERIFY_RESTRICTION_MESSAGE,
} from "@/lib/shop-access";
import { normalizeShopGameCategories } from "@/lib/shop-taxonomy";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    const caller = payload ? await loadUserWithRealName(payload.userId) : null;

    const url = new URL(req.url);
    const userId = url.searchParams.get("id");
    const idsParam = url.searchParams.get("ids");
    const role = url.searchParams.get("role");
    const game = url.searchParams.get("game");
    const search = url.searchParams.get("search");

    const buildMeta = () => {
      if (!caller) return undefined;
      if (caller.role === "BOSS") {
        const verified = canBossUseFullPlatform(caller);
        return {
          bossVerified: verified,
          previewLimit: verified ? null : BOSS_PREVIEW_SHOP_LIMIT,
          chatRestricted: !verified,
          restrictionMessage: verified
            ? null
            : "完成实名认证后可浏览全部店铺并发起聊天",
        };
      }
      if (caller.role === "SHOP") {
        const verified = canShopOperatePublicly(caller);
        return {
          shopVerified: verified,
          chatRestricted: !verified,
          restrictionMessage: verified ? null : SHOP_VERIFY_RESTRICTION_MESSAGE,
        };
      }
      return undefined;
    };

    if (idsParam) {
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ users: [] });
      }
      const users = await prisma.user.findMany({
        where: { id: { in: ids.slice(0, 50) } },
        include: { playerProfile: true, shopProfile: true, realNameVerification: true },
      });
      return NextResponse.json({ users: users.map(formatUser) });
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { playerProfile: true, shopProfile: true, realNameVerification: true },
      });
      if (!user) return NextResponse.json({ users: [] });
      return NextResponse.json({
        users: [formatUser(user)],
        meta: buildMeta(),
      });
    }

    if (role === "SHOP") {
      const shopProfileWhere: Record<string, unknown> = {
        verificationStatus: "APPROVED",
      };
      if (game) {
        shopProfileWhere.gameCategories = { has: game };
      }

      const where: Record<string, unknown> = {
        role: "SHOP",
        status: "online",
        shopProfile: shopProfileWhere,
      };
      if (search) {
        where.OR = [
          { nickname: { contains: search, mode: "insensitive" } },
          { shopProfile: { shopName: { contains: search, mode: "insensitive" } } },
          { shopProfile: { shopDesc: { contains: search, mode: "insensitive" } } },
          { shopProfile: { gameCategories: { has: search } } },
        ];
      }

      const bossPreview =
        caller?.role === "BOSS" && !canBossUseFullPlatform(caller);

      const users = await prisma.user.findMany({
        where,
        include: { shopProfile: true },
        take: bossPreview ? BOSS_PREVIEW_SHOP_LIMIT : 50,
        orderBy: { shopProfile: { orderCount: "desc" } },
      });

      return NextResponse.json({
        users: users.map(formatUser),
        meta: buildMeta(),
      });
    }

    if (role === "BOSS") {
      const where: Record<string, unknown> = {
        role: "BOSS",
        status: "online",
        realNameVerification: { status: "APPROVED" },
      };
      if (search) {
        where.OR = [
          { nickname: { contains: search, mode: "insensitive" } },
          { bio: { contains: search, mode: "insensitive" } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        include: { realNameVerification: true },
        take: 50,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        users: users.map(formatUser),
      });
    }

    const where: Record<string, unknown> = { status: { not: "offline" }, role: "PLAYER" };
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

function formatUser(u: {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  status: string;
  role: string;
  playerProfile?: {
    gameCategories: string[];
    serviceTags: string[];
    pricePerHour: unknown;
  } | null;
  shopProfile?: {
    shopName: string;
    shopDesc: string | null;
    shopCover: string | null;
    shopAddress: string | null;
    gameCategories: string[];
    playerCount: number;
    rating: unknown;
    orderCount: number;
  } | null;
  realNameVerification?: { status: string } | null;
  createdAt: Date;
}) {
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
    shopGames: normalizeShopGameCategories(u.shopProfile?.gameCategories ?? []),
    playerCount: u.shopProfile?.playerCount || 0,
    rating: u.shopProfile?.rating ? Number(u.shopProfile.rating) : null,
    orderCount: u.shopProfile?.orderCount || 0,
    realNameApproved: isBossRealNameApproved(u),
    createdAt: u.createdAt,
  };
}
