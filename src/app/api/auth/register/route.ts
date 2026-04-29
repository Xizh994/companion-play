import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password, role, nickname, games, services, bio, shopName, shopBio, shopCover, contactPhone, contactName } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: "手机号和密码不能为空" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: "该手机号已注册" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash: hashPassword(password),
        role: role || "PLAYER",
        nickname: nickname || phone.slice(-4),
        bio: bio || "",
        status: "online",
      },
    });

    // 如果是陪玩店，创建ShopProfile
    if (role === "SHOP" && shopName) {
      await prisma.shopProfile.create({
        data: {
          userId: user.id,
          shopName,
          shopDesc: shopBio || "",
          shopCover: shopCover || "",
          contactPhone: contactPhone || phone,
          contactName: contactName || "",
          licenseType: "real_photo",
          licenseImage: "",
          verificationStatus: "PENDING",
        },
      });
    }

    // 如果是个人陪玩，创建PlayerProfile
    if (role === "PLAYER") {
      await prisma.playerProfile.create({
        data: {
          userId: user.id,
          realName: "",
          idCardNumber: "",
          idCardFront: "",
          idCardBack: "",
          gameCategories: games || [],
          serviceTags: services || [],
          serviceDesc: bio || "",
          verificationStatus: "PENDING",
        },
      });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: { id: user.id, phone: user.phone, role: user.role, nickname: user.nickname, bio: user.bio },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}