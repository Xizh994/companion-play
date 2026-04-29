import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: "手机号和密码不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: "手机号未注册" }, { status: 401 });
    }

    if (!comparePassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { status: "online" } });

    const token = signToken({ userId: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: { id: user.id, phone: user.phone, role: user.role, nickname: user.nickname, avatar: user.avatar, bio: user.bio },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "登录失败，请稍后重试" }, { status: 500 });
  }
}