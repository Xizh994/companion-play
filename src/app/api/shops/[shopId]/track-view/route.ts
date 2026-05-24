import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { recordShopPageView } from "@/lib/shop-metrics";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await context.params;
    const user = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const source = typeof body.source === "string" ? body.source : undefined;

    await recordShopPageView(shopId, user?.id ?? null, source);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "记录访问失败" }, { status: 500 });
  }
}
