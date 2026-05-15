import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
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

    const updateData: Record<string, unknown> = {};

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

      updateData.avatar = `/uploads/avatars/${filename}`;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "没有要更新的内容" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
    });

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
      },
    });
  } catch (error: unknown) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
