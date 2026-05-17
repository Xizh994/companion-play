import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads", "avatars");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // directory exists
  }
}

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

    const formData = await req.formData();
    const nickname = formData.get("nickname") as string | null;
    const avatarFile = formData.get("avatar") as File | null;

    const shopName = formData.get("shopName") as string | null;
    const shopDesc = formData.get("shopDesc") as string | null;
    const shopAddress = formData.get("shopAddress") as string | null;
    const contactName = formData.get("contactName") as string | null;
    const contactPhone = formData.get("contactPhone") as string | null;

    const updateData: Record<string, unknown> = {};
    const shopUpdateData: Record<string, unknown> = {};

    if (nickname !== null && nickname !== undefined) {
      const trimmed = nickname.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
      }
      if (trimmed.length > 20) {
        return NextResponse.json({ error: "昵称最多20个字符" }, { status: 400 });
      }
      updateData.nickname = trimmed;
    }

    if (avatarFile && avatarFile.size > 0) {
      if (!ALLOWED_TYPES.includes(avatarFile.type)) {
        return NextResponse.json({ error: "仅支持 JPG/PNG/WebP/GIF 格式" }, { status: 400 });
      }
      if (avatarFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "头像大小不能超过 5MB" }, { status: 400 });
      }

      await ensureUploadDir();

      const ext = avatarFile.type.split("/")[1] || "jpg";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      await writeFile(path.join(UPLOAD_DIR, filename), buffer);

      updateData.avatar = `/api/uploads/avatars/${filename}`;
    }

    if (shopName !== null) {
      const trimmed = shopName.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "店铺名称不能为空" }, { status: 400 });
      }
      shopUpdateData.shopName = trimmed;
    }
    if (shopDesc !== null) {
      shopUpdateData.shopDesc = shopDesc.trim() || null;
    }
    if (shopAddress !== null) {
      shopUpdateData.shopAddress = shopAddress.trim() || null;
    }
    if (contactName !== null) {
      const trimmed = contactName.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "联系人姓名不能为空" }, { status: 400 });
      }
      shopUpdateData.contactName = trimmed;
    }
    if (contactPhone !== null) {
      const trimmed = contactPhone.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "联系电话不能为空" }, { status: 400 });
      }
      if (!/^1\d{10}$/.test(trimmed)) {
        return NextResponse.json({ error: "联系电话格式不正确" }, { status: 400 });
      }
      shopUpdateData.contactPhone = trimmed;
    }

    if (Object.keys(updateData).length === 0 && Object.keys(shopUpdateData).length === 0) {
      return NextResponse.json({ error: "没有要更新的内容" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      include: { shopProfile: true, playerProfile: true, realNameVerification: true },
    });

    if (Object.keys(shopUpdateData).length > 0 && user.shopProfile) {
      await prisma.shopProfile.update({
        where: { userId: payload.userId },
        data: shopUpdateData,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar,
        email: user.email,
        emailVerified: user.emailVerified,
        bio: user.bio,
        hasPassword: user.hasPassword,
        shopProfile: user.shopProfile,
        realNameVerification: user.realNameVerification,
      },
    });
  } catch (error: unknown) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
