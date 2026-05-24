import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { emitNewMessage } from "@/lib/socket-emit";
import { formatMessagePreview } from "@/lib/chat-message";
import {
  assertReviewRequestAllowed,
  reviewRequestExpiresAt,
} from "@/lib/shop-review";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { shopId } = await context.params;
    if (user.role !== "SHOP" || user.id !== shopId) {
      return NextResponse.json({ error: "仅店铺可发起评价邀请" }, { status: 403 });
    }

    const body = await req.json();
    const { bossUserId, conversationId } = body as {
      bossUserId?: string;
      conversationId?: string;
    };

    if (!bossUserId || !conversationId) {
      return NextResponse.json({ error: "缺少 bossUserId 或 conversationId" }, { status: 400 });
    }

    const allowed = await assertReviewRequestAllowed(shopId, bossUserId, conversationId);
    if (!allowed.ok) {
      return NextResponse.json({ error: allowed.error }, { status: allowed.status });
    }

    const expiresAt = reviewRequestExpiresAt();
    const shopName = user.shopProfile?.shopName || user.nickname;

    const request = await prisma.shopReviewRequest.create({
      data: {
        shopUserId: shopId,
        bossUserId,
        conversationId,
        expiresAt,
      },
    });

    const message = await prisma.message.create({
      data: {
        fromId: shopId,
        toId: bossUserId,
        type: "review_request",
        content: `${shopName} 邀请你评价本次服务`,
        metadata: {
          requestId: request.id,
          shopName,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: formatMessagePreview("review_request", message.content),
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    });

    emitNewMessage(conversationId, {
      id: message.id,
      content: message.content,
      fromId: message.fromId,
      toId: message.toId,
      type: message.type,
      metadata: message.metadata,
      createdAt: message.createdAt.toISOString(),
      isRead: message.isRead,
    });

    return NextResponse.json({ request, message });
  } catch {
    return NextResponse.json({ error: "发起评价邀请失败" }, { status: 500 });
  }
}
