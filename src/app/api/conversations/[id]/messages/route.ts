import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "登录已过期" }, { status: 401 });

    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv || !conv.participants.includes(payload.userId)) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromId: payload.userId, toId: { in: conv.participants } },
          { toId: payload.userId, fromId: { in: conv.participants } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "获取消息失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "登录已过期" }, { status: 401 });

    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv || !conv.participants.includes(payload.userId)) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const toId = conv.participants.find((p) => p !== payload.userId)!;
    const { content, type = "text" } = await req.json();

    const message = await prisma.message.create({
      data: { fromId: payload.userId, toId, content, type },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessage: content, lastMessageAt: new Date(), updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: "发送消息失败" }, { status: 500 });
  }
}