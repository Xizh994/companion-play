import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "登录已过期" }, { status: 401 });

    const conversations = await prisma.conversation.findMany({
      where: { participants: { has: payload.userId } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: "获取会话列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "登录已过期" }, { status: 401 });

    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: "缺少目标用户ID" }, { status: 400 });

    const participants = [payload.userId, targetUserId].sort();

    let conv = await prisma.conversation.findFirst({
      where: { participants: { equals: participants } },
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: { participants },
      });
    }

    return NextResponse.json({ conversation: conv });
  } catch {
    return NextResponse.json({ error: "创建会话失败" }, { status: 500 });
  }
}