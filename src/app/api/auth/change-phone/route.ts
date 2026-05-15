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

    const { newPhone, currentPhoneVerifiedToken, newPhoneVerifiedToken }:
      { newPhone: string; currentPhoneVerifiedToken: string; newPhoneVerifiedToken: string } = await req.json();

    if (!newPhone || !/^1\d{10}$/.test(newPhone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
    }

    if (!currentPhoneVerifiedToken) {
      return NextResponse.json({ error: "请先完成当前手机验证" }, { status: 400 });
    }

    if (!newPhoneVerifiedToken) {
      return NextResponse.json({ error: "请先完成新手机验证" }, { status: 400 });
    }

    const currentPayload = verifyToken(currentPhoneVerifiedToken);
    if (!currentPayload) {
      return NextResponse.json({ error: "当前手机验证已过期，请重新验证" }, { status: 400 });
    }

    const newPayload = verifyToken(newPhoneVerifiedToken);
    if (!newPayload) {
      return NextResponse.json({ error: "新手机验证已过期，请重新验证" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (currentPayload.userId !== user.phone) {
      return NextResponse.json({ error: "当前手机验证不匹配" }, { status: 400 });
    }

    if (newPayload.userId !== newPhone) {
      return NextResponse.json({ error: "新手机验证不匹配" }, { status: 400 });
    }

    if (newPhone === user.phone) {
      return NextResponse.json({ error: "新手机号不能与当前手机号相同" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone: newPhone } });
    if (existing) {
      return NextResponse.json({ error: "该手机号已被注册" }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { phone: newPhone },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        role: updatedUser.role,
        nickname: updatedUser.nickname,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        hasPassword: !!updatedUser.passwordHash,
      },
    });
  } catch (error: any) {
    console.error("Change phone error:", error);
    return NextResponse.json({ error: "更换手机号失败" }, { status: 500 });
  }
}
