import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import {
  expireStaleReviewRequests,
  hasPublishedReviewToday,
  recalculateShopRating,
  validateReviewContent,
  validateReviewScore,
} from "@/lib/shop-review";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "BOSS") {
      return NextResponse.json({ error: "仅老板可提交评价" }, { status: 403 });
    }

    const { id } = await context.params;
    await expireStaleReviewRequests();

    const request = await prisma.shopReviewRequest.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!request) {
      return NextResponse.json({ error: "邀请不存在" }, { status: 404 });
    }
    if (request.bossUserId !== user.id) {
      return NextResponse.json({ error: "无权提交此评价" }, { status: 403 });
    }
    if (request.review) {
      return NextResponse.json({ error: "该邀请已完成评价" }, { status: 409 });
    }
    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "邀请已失效" }, { status: 410 });
    }
    if (request.expiresAt < new Date()) {
      await prisma.shopReviewRequest.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "邀请已过期" }, { status: 410 });
    }

    if (await hasPublishedReviewToday(request.shopUserId, user.id)) {
      return NextResponse.json({ error: "今日已评价过该店铺" }, { status: 409 });
    }

    const body = await req.json();
    const score = validateReviewScore(body.score);
    const content = validateReviewContent(body.content);
    const isAnonymous = Boolean(body.isAnonymous);

    if (score == null) {
      return NextResponse.json({ error: "请选择 1-5 星评分" }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "评价内容至少 5 个字" }, { status: 400 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.shopReview.create({
        data: {
          shopUserId: request.shopUserId,
          bossUserId: user.id,
          requestId: request.id,
          score,
          content,
          isAnonymous,
        },
      });

      await tx.shopReviewRequest.update({
        where: { id: request.id },
        data: { status: "COMPLETED" },
      });

      return created;
    });

    await recalculateShopRating(request.shopUserId);

    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "今日已评价过该店铺" }, { status: 409 });
    }
    return NextResponse.json({ error: "提交评价失败" }, { status: 500 });
  }
}
