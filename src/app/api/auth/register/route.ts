import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, verifyToken } from "@/lib/auth";
import { generateAvatarUrl } from "@/lib/avatar";
import { encrypt } from "@/lib/crypto";
import { isValidIdCardNumber } from "@/lib/id-card";
import { buildSubmittedNotes } from "@/lib/verification-notes";

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

    const userRole = role === "SHOP" ? "SHOP" : "BOSS";

    if (userRole === "SHOP") {
      if (!shopName || !String(shopName).trim()) {
        return NextResponse.json({ error: "请填写店铺名称" }, { status: 400 });
      }
      if (!contactName || !String(contactName).trim()) {
        return NextResponse.json({ error: "请填写平台负责人姓名" }, { status: 400 });
      }
      if (!contactIdCard || !isValidIdCardNumber(String(contactIdCard))) {
        return NextResponse.json({ error: "请填写正确的平台负责人身份证号" }, { status: 400 });
      }
      if (!licenseImage || !String(licenseImage).trim()) {
        return NextResponse.json({ error: "请上传营业执照" }, { status: 400 });
      }
      if (String(licenseImage).startsWith("data:")) {
        return NextResponse.json(
          { error: "营业执照请通过上传接口提交，勿使用内嵌图片" },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: "该手机号已注册" }, { status: 409 });
    }

    if (!phoneVerifiedToken) {
      return NextResponse.json({ error: "请先完成手机验证" }, { status: 400 });
    }
    const phonePayload = verifyToken(phoneVerifiedToken);
    if (!phonePayload) {
      return NextResponse.json({ error: "手机验证已过期，请重新验证" }, { status: 400 });
    }

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
    const avatarUrl =
      typeof avatar === "string" && avatar.length > 0 && !avatar.startsWith("data:")
        ? avatar
        : typeof avatar === "string" && avatar.startsWith("data:")
          ? generateAvatarUrl(finalNickname)
          : generateAvatarUrl(finalNickname);

    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash: password ? hashPassword(password) : null,
        role: userRole,
        nickname: finalNickname,
        avatar: avatarUrl,
        email: email || null,
        emailVerified: !!email,
        hasPassword: !!password,
        status: "offline",
      },
    });

    if (userRole === "SHOP") {
      await prisma.shopProfile.create({
        data: {
          userId: user.id,
          shopName: String(shopName).trim(),
          shopDesc: shopBio ? String(shopBio).trim() : "",
          shopCover: shopCover && !String(shopCover).startsWith("data:") ? String(shopCover) : "",
          contactPhone: phone,
          contactName: String(contactName).trim(),
          contactIdCard: encrypt(String(contactIdCard).trim()),
          licenseType: "business_license",
          licenseImage: String(licenseImage).trim(),
          verificationStatus: "PENDING",
          verificationNotes: buildSubmittedNotes(),
        },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { shopProfile: true, realNameVerification: true },
    });

    const token = signToken({ userId: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: fullUser
        ? {
            id: fullUser.id,
            phone: fullUser.phone,
            role: fullUser.role,
            nickname: fullUser.nickname,
            email: fullUser.email,
            avatar: fullUser.avatar,
            hasPassword: fullUser.hasPassword,
            shopProfile: fullUser.shopProfile,
            realNameVerification: fullUser.realNameVerification,
          }
        : {
            id: user.id,
            phone: user.phone,
            role: user.role,
            nickname: user.nickname,
            email: user.email,
            avatar: user.avatar,
            hasPassword: user.hasPassword,
          },
    });
  } catch (error: unknown) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
