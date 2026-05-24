import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { expireStaleReviewRequests } from "@/lib/shop-review";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { id } = await context.params;
    await expireStaleReviewRequests();

    const request = await prisma.shopReviewRequest.findUnique({
      where: { id },
      include: {
        review: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "邀请不存在" }, { status: 404 });
    }

    if (user.id !== request.bossUserId && user.id !== request.shopUserId) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const shop = await prisma.user.findUnique({
      where: { id: request.shopUserId },
      include: { shopProfile: true },
    });

    return NextResponse.json({
      request: {
        id: request.id,
        status: request.status,
        expiresAt: request.expiresAt,
        shopUserId: request.shopUserId,
        bossUserId: request.bossUserId,
        conversationId: request.conversationId,
        shopName: shop?.shopProfile?.shopName || shop?.nickname || "店铺",
        completed: !!request.review,
      },
    });
  } catch {
    return NextResponse.json({ error: "获取邀请详情失败" }, { status: 500 });
  }
}
