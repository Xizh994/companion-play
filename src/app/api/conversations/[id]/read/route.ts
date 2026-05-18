import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

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

    const otherIds = conv.participants.filter((p) => p !== payload.userId);

    const result = await prisma.message.updateMany({
      where: {
        toId: payload.userId,
        fromId: { in: otherIds },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true, markedCount: result.count });
  } catch {
    return NextResponse.json({ error: "标记已读失败" }, { status: 500 });
  }
}
