import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyToken, getTokenFromRequest } from "@/lib/auth";

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

    const body = await req.json();
    const { emailVerifiedToken, smsVerifiedToken, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "新密码至少6位" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 邮箱验证
    if (emailVerifiedToken) {
      if (!user.email) {
        return NextResponse.json({ error: "账号未绑定邮箱" }, { status: 400 });
      }
      const emailPayload = verifyToken(emailVerifiedToken);
      if (!emailPayload) {
        return NextResponse.json({ error: "邮箱验证已过期" }, { status: 400 });
      }
    }
    // 短信验证（备选方案，适用于未绑定邮箱的用户）
    else if (smsVerifiedToken) {
      const smsPayload = verifyToken(smsVerifiedToken);
      if (!smsPayload) {
        return NextResponse.json({ error: "短信验证已过期" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "请先完成身份验证" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(newPassword),
        hasPassword: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "修改密码失败" }, { status: 500 });
  }
}
