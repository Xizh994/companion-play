import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

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

    await prisma.user.update({
      where: { id: payload.userId },
      data: { status: "offline" },
    });

    const io = (global as unknown as { __dazistar_io?: { to: (room: string) => { emit: (event: string, data?: unknown) => void } } })
      .__dazistar_io;
    io?.to("lobby").emit("lobby_users", { userId: payload.userId, status: "offline" });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "登出失败" }, { status: 500 });
  }
}
