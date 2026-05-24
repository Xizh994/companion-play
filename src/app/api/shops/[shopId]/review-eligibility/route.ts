import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { getShopReviewInviteState } from "@/lib/shop-review";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { shopId } = await context.params;
    const bossUserId = req.nextUrl.searchParams.get("bossUserId");

    if (user.role !== "SHOP" || user.id !== shopId) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }
    if (!bossUserId) {
      return NextResponse.json({ error: "缺少 bossUserId" }, { status: 400 });
    }

    const state = await getShopReviewInviteState(shopId, bossUserId);

    return NextResponse.json({ state });
  } catch {
    return NextResponse.json({ error: "获取评价邀请状态失败" }, { status: 500 });
  }
}
