import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期，请重新登录" }, { status: 401 });
    }

    const { email, verifiedToken }: { email: string; verifiedToken: string } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    if (!verifiedToken) {
      return NextResponse.json({ error: "请先完成邮箱验证" }, { status: 400 });
    }

    const emailPayload = verifyToken(verifiedToken);
    if (!emailPayload) {
      return NextResponse.json({ error: "邮箱验证已过期，请重新验证" }, { status: 400 });
    }

    const record = await prisma.verificationCode.findFirst({
      where: {
        target: email,
        type: "EMAIL_BIND",
        used: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "邮箱验证已过期，请重新发送验证码" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== payload.userId) {
      return NextResponse.json({ error: "该邮箱已被其他账号绑定" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        email,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        nickname: user.nickname,
        email: user.email,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        bio: user.bio,
        hasPassword: !!user.passwordHash,
      },
    });
  } catch (error: any) {
    console.error("Bind email error:", error);
    return NextResponse.json({ error: "绑定邮箱失败" }, { status: 500 });
  }
}
