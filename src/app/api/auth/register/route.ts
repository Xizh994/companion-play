import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, verifyToken } from "@/lib/auth";
import { generateAvatarUrl } from "@/lib/avatar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      phone,
      password,
      role,
      nickname,
      avatar,
      email,
      phoneVerifiedToken,
      emailVerifiedToken,
      shopName,
      shopBio,
      shopCover,
      contactName,
      contactIdCard,
      licenseImage,
    } = body;

    if (!phone) {
      return NextResponse.json({ error: "手机号不能为空" }, { status: 400 });
    }

    if (password && password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: "该手机号已注册" }, { status: 409 });
    }

    // 验证手机验证码 token
    if (!phoneVerifiedToken) {
      return NextResponse.json({ error: "请先完成手机验证" }, { status: 400 });
    }
    const phonePayload = verifyToken(phoneVerifiedToken);
    if (!phonePayload) {
      return NextResponse.json({ error: "手机验证已过期，请重新验证" }, { status: 400 });
    }

    // 邮箱绑定验证
    if (email) {
      const emailInUse = await prisma.user.findUnique({ where: { email } });
      if (emailInUse) {
        return NextResponse.json({ error: "该邮箱已被其他账号绑定" }, { status: 409 });
      }
      if (!emailVerifiedToken) {
        return NextResponse.json({ error: "请先完成邮箱验证" }, { status: 400 });
      }
      const emailPayload = verifyToken(emailVerifiedToken);
      if (!emailPayload) {
        return NextResponse.json({ error: "邮箱验证已过期，请重新验证" }, { status: 400 });
      }
    }

    const finalNickname = nickname || phone.slice(-4);
    const avatarUrl = typeof avatar === "string" && avatar.length > 0
      ? avatar
      : generateAvatarUrl(finalNickname);

    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash: password ? hashPassword(password) : null,
        role: role || "BOSS",
        nickname: finalNickname,
        avatar: avatarUrl,
        email: email || null,
        emailVerified: !!email,
        hasPassword: !!password,
        status: "online",
      },
    });

    // 如果是店铺，创建 ShopProfile
    if (role === "SHOP" && shopName) {
      await prisma.shopProfile.create({
        data: {
          userId: user.id,
          shopName,
          shopDesc: shopBio || "",
          shopCover: shopCover || "",
          contactPhone: phone,
          contactName: contactName || "",
          contactIdCard: contactIdCard || null,
          licenseType: "business_license",
          licenseImage: licenseImage || "",
          verificationStatus: "PENDING",
        },
      });
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
        hasPassword: user.hasPassword,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
