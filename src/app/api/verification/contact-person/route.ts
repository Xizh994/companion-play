import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { encrypt } from "@/lib/crypto";
import { isValidIdCardNumber } from "@/lib/id-card";

/**
 * 更换店铺平台负责人：更新 contactName + contactIdCard，二要素核验（Phase B）
 * 不修改企业认证状态；企业主体仍以执照 OCR + EntElementVerify 为准。
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (user.role !== "SHOP" || !user.shopProfile) {
      return NextResponse.json({ error: "仅店铺账号可更换平台负责人" }, { status: 403 });
    }

    const { contactName, contactIdCard } = await req.json();

    const picked = typeof contactName === "string" ? contactName.trim() : "";
    const newContactIdCard =
      typeof contactIdCard === "string" ? contactIdCard.trim() : "";

    if (!picked) {
      return NextResponse.json({ error: "请输入平台负责人姓名" }, { status: 400 });
    }
    if (!newContactIdCard) {
      return NextResponse.json({ error: "请输入平台负责人身份证号" }, { status: 400 });
    }
    if (!isValidIdCardNumber(newContactIdCard)) {
      return NextResponse.json({ error: "平台负责人身份证号格式不正确" }, { status: 400 });
    }

    // Phase B: Id2MetaVerify(picked, newContactIdCard)

    await prisma.shopProfile.update({
      where: { userId: user.id },
      data: {
        contactName: picked,
        contactIdCard: encrypt(newContactIdCard),
      },
    });

    return NextResponse.json({ success: true, contactName: picked });
  } catch (error: unknown) {
    console.error("contact-person error:", error);
    return NextResponse.json({ error: "更换平台负责人失败" }, { status: 500 });
  }
}
