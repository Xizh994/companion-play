import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { emitNewMessage } from "@/lib/socket-emit";
import { assertChatAllowed } from "@/lib/boss-access";
import { formatMessagePreview } from "@/lib/chat-message";
import { maybeRecordConsultation } from "@/lib/shop-metrics";

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

    const requestIds = messages
      .filter((m) => m.type === "review_request")
      .map((m) => {
        const meta = m.metadata as { requestId?: string } | null;
        return meta?.requestId;
      })
      .filter((id): id is string => Boolean(id));

    const requestMap = new Map<string, { status: string; hasReview: boolean }>();
    if (requestIds.length > 0) {
      const requests = await prisma.shopReviewRequest.findMany({
        where: { id: { in: requestIds } },
        include: { review: { select: { id: true } } },
      });
      for (const r of requests) {
        requestMap.set(r.id, {
          status: r.status,
          hasReview: !!r.review,
        });
      }
    }

    const enriched = messages.map((m) => {
      if (m.type !== "review_request") return m;
      const meta = (m.metadata as Record<string, unknown> | null) ?? {};
      const requestId = meta.requestId as string | undefined;
      const req = requestId ? requestMap.get(requestId) : undefined;
      return {
        ...m,
        metadata: {
          ...meta,
          completed: req?.status === "COMPLETED" || req?.hasReview === true,
        },
      };
    });

    return NextResponse.json({ messages: enriched });
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

    const shopUserId = payload.userId;
    const bossUserId = toId;
    void maybeRecordConsultation(shopUserId, bossUserId).catch(() => {});
    void maybeRecordConsultation(bossUserId, shopUserId).catch(() => {});

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