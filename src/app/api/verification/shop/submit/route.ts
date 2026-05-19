import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import {
  buildSubmittedNotes,
  buildVerifyingNotes,
  parseShopVerificationNotes,
  stringifyShopVerificationNotes,
} from "@/lib/verification-notes";

const SHOP_VERIFY_ENABLED = process.env.SHOP_VERIFY_ENABLED === "true";

/**
 * 提交 / 重提店铺企业认证（Phase A：更新资料 + 状态；Phase C 接入 OCR + EntElementVerify）
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (user.role !== "SHOP" || !user.shopProfile) {
      return NextResponse.json({ error: "仅店铺账号可提交认证" }, { status: 403 });
    }

    const body = await req.json();
    const licenseImageUrl =
      typeof body.licenseImageUrl === "string" ? body.licenseImageUrl.trim() : "";
    const creditCode =
      typeof body.creditCode === "string" ? body.creditCode.trim() : "";
    const companyName =
      typeof body.companyName === "string" ? body.companyName.trim() : "";
    const legalPersonName =
      typeof body.legalPersonName === "string" ? body.legalPersonName.trim() : "";

    const profile = user.shopProfile;
    const licenseImage = licenseImageUrl || profile.licenseImage;
    if (!licenseImage) {
      return NextResponse.json({ error: "请上传营业执照" }, { status: 400 });
    }

    if (profile.contactName && legalPersonName && profile.contactName !== legalPersonName) {
      return NextResponse.json(
        { error: "负责人姓名须与营业执照法定代表人一致" },
        { status: 400 }
      );
    }

    await prisma.shopProfile.update({
      where: { userId: user.id },
      data: {
        licenseImage,
        verificationNotes: buildVerifyingNotes(),
      },
    });

    if (!SHOP_VERIFY_ENABLED) {
      const notes = buildSubmittedNotes("资料已更新，企业要素核验将在服务启用后执行（Phase C）");
      const updated = await prisma.shopProfile.update({
        where: { userId: user.id },
        data: {
          verificationStatus: "PENDING",
          verificationNotes: notes,
        },
      });
      return NextResponse.json({
        status: updated.verificationStatus,
        verificationNotes: parseShopVerificationNotes(updated.verificationNotes),
        message: "资料已提交",
      });
    }

    // Phase C: OCR + EntElementVerify，同步写 APPROVED/REJECTED
    const fallback = await prisma.shopProfile.update({
      where: { userId: user.id },
      data: {
        verificationStatus: "PENDING",
        verificationNotes: stringifyShopVerificationNotes({
          phase: "submitted",
          reason: "企业要素核验待接入",
          ocr: { creditCode, companyName, legalPerson: legalPersonName },
        }),
      },
    });

    return NextResponse.json({
      status: fallback.verificationStatus,
      verificationNotes: parseShopVerificationNotes(fallback.verificationNotes),
      message: "已提交认证",
    });
  } catch (error: unknown) {
    console.error("shop/submit error:", error);
    return NextResponse.json({ error: "提交认证失败" }, { status: 500 });
  }
}
