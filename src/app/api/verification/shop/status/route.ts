import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { parseShopVerificationNotes } from "@/lib/verification-notes";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (user.role !== "SHOP" || !user.shopProfile) {
      return NextResponse.json({ error: "仅店铺账号可查询" }, { status: 403 });
    }

    const sp = user.shopProfile;
    const notes = parseShopVerificationNotes(sp.verificationNotes);

    return NextResponse.json({
      verificationStatus: sp.verificationStatus,
      verificationNotes: notes,
      verifiedAt: sp.verifiedAt,
    });
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
