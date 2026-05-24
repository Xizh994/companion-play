import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPublicReviewer } from "@/lib/shop-review";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await context.params;
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
    const pageSize = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") || 10)));
    const skip = (page - 1) * pageSize;

    const shop = await prisma.user.findUnique({
      where: { id: shopId, role: "SHOP" },
      include: { shopProfile: true },
    });
    if (!shop) {
      return NextResponse.json({ error: "店铺不存在" }, { status: 404 });
    }

    const [reviews, total] = await Promise.all([
      prisma.shopReview.findMany({
        where: { shopUserId: shopId, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          request: false,
        },
      }),
      prisma.shopReview.count({
        where: { shopUserId: shopId, status: "PUBLISHED" },
      }),
    ]);

    const bossIds = [...new Set(reviews.filter((r) => !r.isAnonymous).map((r) => r.bossUserId))];
    const bosses =
      bossIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: bossIds } },
            select: { id: true, nickname: true, avatar: true },
          })
        : [];
    const bossMap = new Map(bosses.map((b) => [b.id, b]));

    const items = reviews.map((r) => {
      const boss = bossMap.get(r.bossUserId);
      return {
        id: r.id,
        score: r.score,
        content: r.content,
        isAnonymous: r.isAnonymous,
        createdAt: r.createdAt,
        reviewerNickname: formatPublicReviewer(boss?.nickname ?? "老板", r.isAnonymous),
        reviewerAvatar: r.isAnonymous ? null : (boss?.avatar ?? null),
      };
    });

    return NextResponse.json({
      summary: {
        avgRating: shop.shopProfile?.rating != null ? Number(shop.shopProfile.rating) : null,
        reviewCount: shop.shopProfile?.reviewCount ?? 0,
      },
      reviews: items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch {
    return NextResponse.json({ error: "获取评价列表失败" }, { status: 500 });
  }
}
