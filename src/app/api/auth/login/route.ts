import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, password, loginType, smsVerifiedToken, magicLinkToken, emailVerifiedToken } = body;

    // 密码登录
    if (loginType === "password" || (!loginType && password)) {
      if (!phone || !password) {
        return NextResponse.json({ error: "手机号和密码不能为空" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        return NextResponse.json({ error: "手机号未注册" }, { status: 401 });
      }

      if (!user.passwordHash || !comparePassword(password, user.passwordHash)) {
        return NextResponse.json({ error: "密码错误" }, { status: 401 });
      }

      await prisma.user.update({ where: { id: user.id }, data: { status: "online" } });

      const token = signToken({ userId: user.id, role: user.role });

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          hasPassword: !!user.passwordHash,
        },
      });
    }

    // 短信验证码登录
    if (loginType === "sms") {
      if (!phone) {
        return NextResponse.json({ error: "手机号不能为空" }, { status: 400 });
      }

      if (!smsVerifiedToken) {
        return NextResponse.json({ error: "请先完成短信验证" }, { status: 400 });
      }

      const smsPayload = verifyToken(smsVerifiedToken);
      if (!smsPayload) {
        return NextResponse.json({ error: "短信验证已过期" }, { status: 400 });
      }

      let user = await prisma.user.findUnique({ where: { phone } });

      // 如果用户不存在，自动注册（无密码）
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            role: "BOSS",
            nickname: phone.slice(-4),
            hasPassword: false,
            status: "online",
          },
        });
      } else {
        await prisma.user.update({ where: { id: user.id }, data: { status: "online" } });
      }

      const token = signToken({ userId: user.id, role: user.role });

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          hasPassword: !!user.passwordHash,
        },
      });
    }

    // Magic Link 登录
    if (loginType === "magic_link") {
      if (!magicLinkToken) {
        return NextResponse.json({ error: "无效的登录链接" }, { status: 400 });
      }

      const magicPayload = verifyToken(magicLinkToken);
      if (!magicPayload) {
        return NextResponse.json({ error: "登录链接已过期" }, { status: 401 });
      }

      const user = await prisma.user.findUnique({ where: { id: magicPayload.userId } });
      if (!user) {
        return NextResponse.json({ error: "用户不存在" }, { status: 404 });
      }

      await prisma.user.update({ where: { id: user.id }, data: { status: "online" } });

      const token = signToken({ userId: user.id, role: user.role });

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          hasPassword: !!user.passwordHash,
        },
      });
    }

    // 邮箱验证码登录（紧急登录）
    if (loginType === "email_code") {
      if (!email) {
        return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
      }

      if (!emailVerifiedToken) {
        return NextResponse.json({ error: "请先完成邮箱验证" }, { status: 400 });
      }

      const emailPayload = verifyToken(emailVerifiedToken);
      if (!emailPayload) {
        return NextResponse.json({ error: "邮箱验证已过期" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: "该邮箱未绑定任何账号" }, { status: 404 });
      }

      await prisma.user.update({ where: { id: user.id }, data: { status: "online" } });

      const token = signToken({ userId: user.id, role: user.role });

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          hasPassword: !!user.passwordHash,
        },
      });
    }

    return NextResponse.json({ error: "无效的登录方式" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "登录失败，请稍后重试" }, { status: 500 });
  }
}
