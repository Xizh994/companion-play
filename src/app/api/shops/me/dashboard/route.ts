import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { getShopDashboard } from "@/lib/shop-metrics";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    if (user.role !== "SHOP") {
      return NextResponse.json({ error: "仅店铺可访问" }, { status: 403 });
    }

    const rangeDays = Math.min(30, Math.max(1, Number(req.nextUrl.searchParams.get("rangeDays") || 7)));
    const dashboard = await getShopDashboard(user.id, rangeDays);
    if (!dashboard) {
      return NextResponse.json({ error: "店铺资料不存在" }, { status: 404 });
    }

    return NextResponse.json(dashboard);
  } catch {
    return NextResponse.json({ error: "获取经营数据失败" }, { status: 500 });
  }
}
