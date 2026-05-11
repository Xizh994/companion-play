import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, signToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid_link", req.url));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login?error=expired_link", req.url));
    }

    const record = await prisma.verificationCode.findFirst({
      where: {
        userId: payload.userId,
        type: "MAGIC_LINK",
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.redirect(new URL("/login?error=used_link", req.url));
    }

    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    });

    await prisma.user.update({
      where: { id: payload.userId },
      data: { status: "online" },
    });

    const authToken = signToken({ userId: payload.userId, role: payload.role });

    const response = NextResponse.redirect(new URL("/lobby", req.url));
    response.cookies.set("dazistar_token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Verify magic link error:", error);
    return NextResponse.redirect(new URL("/login?error=link_failed", req.url));
  }
}
