import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { emitNewMessage } from "@/lib/socket-emit";
import { assertChatAllowed } from "@/lib/boss-access";
import { formatMessagePreview } from "@/lib/chat-message";

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
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "消息内容不能为空" }, { status: 400 });
    }
    const normalizedType = type === "image" ? "image" : "text";
    const normalizedContent = content.trim();

    const chatAccess = await assertChatAllowed(payload.userId, toId);
    if (!chatAccess.allowed) {
      return NextResponse.json({ error: chatAccess.error, code: "CHAT_RESTRICTED" }, { status: chatAccess.status });
    }

    const message = await prisma.message.create({
      data: {
        fromId: payload.userId,
        toId,
        content: normalizedContent,
        type: normalizedType,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessage: formatMessagePreview(normalizedType, normalizedContent),
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    });

    emitNewMessage(id, {
      id: message.id,
      content: message.content,
      fromId: message.fromId,
      toId: message.toId,
      type: message.type,
      createdAt: message.createdAt.toISOString(),
      isRead: message.isRead,
    });

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: "发送消息失败" }, { status: 500 });
  }
}