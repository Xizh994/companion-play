import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { tryRecordShopPageView, getClientIp } from "@/lib/shop-metrics";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await context.params;
    const user = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const source = typeof body.source === "string" ? body.source : undefined;

    const result = await tryRecordShopPageView(shopId, {
      visitorId: user?.id ?? null,
      visitorRole: user?.role ?? null,
      ip: getClientIp(req),
      source,
    });

    return NextResponse.json({ ok: true, recorded: result.recorded });
  } catch {
    return NextResponse.json({ error: "记录访问失败" }, { status: 500 });
  }
}
