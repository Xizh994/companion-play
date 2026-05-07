import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (user.role !== "BOSS") {
      return NextResponse.json({ error: "仅老板角色需要实名认证" }, { status: 403 });
    }

    const { realName, idCardNumber } = await req.json();

    if (!realName || !idCardNumber) {
      return NextResponse.json({ error: "姓名和身份证号不能为空" }, { status: 400 });
    }

    if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCardNumber)) {
      return NextResponse.json({ error: "身份证号格式不正确" }, { status: 400 });
    }

    // 检查是否已有认证记录
    const existing = await prisma.realNameVerification.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      if (existing.status === "APPROVED") {
        return NextResponse.json({ error: "已完成实名认证" }, { status: 409 });
      }
      // 覆盖已有的待审核/已拒绝记录
      await prisma.realNameVerification.update({
        where: { id: existing.id },
        data: {
          realName,
          idCardNumber: encrypt(idCardNumber),
          status: "PENDING",
          submittedAt: new Date(),
          verifiedAt: null,
          notes: null,
        },
      });
    } else {
      await prisma.realNameVerification.create({
        data: {
          userId: user.id,
          realName,
          idCardNumber: encrypt(idCardNumber),
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify identity error:", error);
    return NextResponse.json({ error: "实名认证提交失败" }, { status: 500 });
  }
}
