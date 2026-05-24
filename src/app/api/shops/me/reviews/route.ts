import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "SHOP") {
      return NextResponse.json({ error: "仅店铺可访问" }, { status: 403 });
    }

    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") || 20)));
    const skip = (page - 1) * pageSize;

    const [reviews, total] = await Promise.all([
      prisma.shopReview.findMany({
        where: { shopUserId: user.id, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.shopReview.count({
        where: { shopUserId: user.id, status: "PUBLISHED" },
      }),
    ]);

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        score: r.score,
        content: r.content,
        isAnonymous: r.isAnonymous,
        createdAt: r.createdAt,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch {
    return NextResponse.json({ error: "获取评价列表失败" }, { status: 500 });
  }
}
