import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { isValidIdCardNumber } from "@/lib/id-card";

/**
 * 店铺更换负责人（Phase A：格式校验 + 更新姓名；Phase B 接入 Id2MetaVerify）
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (user.role !== "SHOP" || !user.shopProfile) {
      return NextResponse.json({ error: "仅店铺账号可更换负责人" }, { status: 403 });
    }

    const { contactName, realName, idCardNumber } = await req.json();

    const picked = typeof contactName === "string" ? contactName.trim() : "";
    if (!picked) {
      return NextResponse.json({ error: "请输入新负责人姓名" }, { status: 400 });
    }
    if (!realName || !idCardNumber) {
      return NextResponse.json({ error: "请填写操作人真实姓名和身份证号" }, { status: 400 });
    }
    if (!isValidIdCardNumber(idCardNumber)) {
      return NextResponse.json({ error: "身份证号格式不正确" }, { status: 400 });
    }

    // Phase B: 调用 Id2MetaVerify 校验 realName + idCardNumber

    await prisma.shopProfile.update({
      where: { userId: user.id },
      data: { contactName: picked },
    });

    return NextResponse.json({ success: true, contactName: picked });
  } catch (error: unknown) {
    console.error("contact-person error:", error);
    return NextResponse.json({ error: "更换负责人失败" }, { status: 500 });
  }
}
