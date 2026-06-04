import { prisma } from "@/lib/prisma";
import { assertChatAllowed } from "@/lib/boss-access";
import { getShanghaiDayBounds } from "@/lib/shop-time";
import type { ReviewRequestStatus } from "@prisma/client";

import {
  REVIEW_REQUEST_TTL_DAYS,
  REVIEW_CONTENT_MIN,
  REVIEW_CONTENT_MAX,
  RECENT_MUTUAL_CHAT_HOURS,
  type ShopReviewInviteState,
} from "@/lib/shop-review-constants";

export { REVIEW_REQUEST_TTL_DAYS, REVIEW_CONTENT_MIN, REVIEW_CONTENT_MAX, RECENT_MUTUAL_CHAT_HOURS };
export type { ShopReviewInviteState };

const CHAT_MESSAGE_TYPES = ["text", "image"];

export async function hasMutualChat(shopUserId: string, bossUserId: string): Promise<boolean> {
  const [shopToBoss, bossToShop] = await Promise.all([
    prisma.message.count({
      where: {
        fromId: shopUserId,
        toId: bossUserId,
        type: { in: CHAT_MESSAGE_TYPES },
      },
    }),
    prisma.message.count({
      where: {
        fromId: bossUserId,
        toId: shopUserId,
        type: { in: CHAT_MESSAGE_TYPES },
      },
    }),
  ]);
  return shopToBoss >= 1 && bossToShop >= 1;
}

/** 近 RECENT_MUTUAL_CHAT_HOURS 小时内双方各至少 1 条 text/image */
export async function hasRecentMutualChat(shopUserId: string, bossUserId: string): Promise<boolean> {
  const since = new Date(Date.now() - RECENT_MUTUAL_CHAT_HOURS * 60 * 60 * 1000);
  const [shopToBoss, bossToShop] = await Promise.all([
    prisma.message.count({
      where: {
        fromId: shopUserId,
        toId: bossUserId,
        type: { in: CHAT_MESSAGE_TYPES },
        createdAt: { gte: since },
      },
    }),
    prisma.message.count({
      where: {
        fromId: bossUserId,
        toId: shopUserId,
        type: { in: CHAT_MESSAGE_TYPES },
        createdAt: { gte: since },
      },
    }),
  ]);
  return shopToBoss >= 1 && bossToShop >= 1;
}

/** 是否曾向该老板发过评价邀请（含已完成/过期/进行中等） */
export async function hasPriorReviewRequest(shopUserId: string, bossUserId: string): Promise<boolean> {
  const count = await prisma.shopReviewRequest.count({
    where: { shopUserId, bossUserId },
  });
  return count > 0;
}

/** 首次邀：历史互聊；再次邀：近 72h 内互聊 */
export async function meetsInviteChatRequirement(
  shopUserId: string,
  bossUserId: string
): Promise<"ok" | "not_mutual_chat" | "not_recent_mutual_chat"> {
  const mutual = await hasMutualChat(shopUserId, bossUserId);
  if (!mutual) return "not_mutual_chat";

  const prior = await hasPriorReviewRequest(shopUserId, bossUserId);
  if (!prior) return "ok";

  const recent = await hasRecentMutualChat(shopUserId, bossUserId);
  if (!recent) return "not_recent_mutual_chat";

  return "ok";
}

export async function expireStaleReviewRequests(shopUserId?: string, bossUserId?: string) {
  const now = new Date();
  await prisma.shopReviewRequest.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
      ...(shopUserId ? { shopUserId } : {}),
      ...(bossUserId ? { bossUserId } : {}),
    },
    data: { status: "EXPIRED" },
  });
}

export async function hasInviteToday(shopUserId: string, bossUserId: string): Promise<boolean> {
  const { start, end } = getShanghaiDayBounds();
  const count = await prisma.shopReviewRequest.count({
    where: {
      shopUserId,
      bossUserId,
      createdAt: { gte: start, lt: end },
    },
  });
  return count > 0;
}

export async function hasPublishedReviewToday(
  shopUserId: string,
  bossUserId: string
): Promise<boolean> {
  const { start, end } = getShanghaiDayBounds();
  const count = await prisma.shopReview.count({
    where: {
      shopUserId,
      bossUserId,
      status: "PUBLISHED",
      createdAt: { gte: start, lt: end },
    },
  });
  return count > 0;
}

export async function getActivePendingRequest(shopUserId: string, bossUserId: string) {
  await expireStaleReviewRequests(shopUserId, bossUserId);
  return prisma.shopReviewRequest.findFirst({
    where: { shopUserId, bossUserId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getShopReviewInviteState(
  shopUserId: string,
  bossUserId: string
): Promise<ShopReviewInviteState> {
  await expireStaleReviewRequests(shopUserId, bossUserId);

  const chatReq = await meetsInviteChatRequirement(shopUserId, bossUserId);
  if (chatReq === "not_mutual_chat") return "not_mutual_chat";
  if (chatReq === "not_recent_mutual_chat") return "not_recent_mutual_chat";

  if (await hasPublishedReviewToday(shopUserId, bossUserId)) {
    return "boss_reviewed_today";
  }

  const pending = await prisma.shopReviewRequest.findFirst({
    where: { shopUserId, bossUserId, status: "PENDING" },
  });
  if (pending) return "pending";

  if (await hasInviteToday(shopUserId, bossUserId)) {
    return "invited_today";
  }

  return "can_invite";
}

export function validateReviewContent(content: unknown): string | null {
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  if (trimmed.length < REVIEW_CONTENT_MIN || trimmed.length > REVIEW_CONTENT_MAX) {
    return null;
  }
  return trimmed;
}

export function validateReviewScore(score: unknown): number | null {
  const n = typeof score === "number" ? score : Number(score);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

export async function recalculateShopRating(shopUserId: string) {
  const agg = await prisma.shopReview.aggregate({
    where: { shopUserId, status: "PUBLISHED" },
    _avg: { score: true },
    _count: { id: true },
  });

  const profile = await prisma.shopProfile.findFirst({ where: { userId: shopUserId } });
  if (!profile) return;

  await prisma.shopProfile.update({
    where: { id: profile.id },
    data: {
      rating: agg._avg.score != null ? Number(agg._avg.score.toFixed(2)) : null,
      reviewCount: agg._count.id,
      // rankScore 仅由每日任务 refreshAllShopRankScores 更新，不在此处即时改榜
    },
  });
}

export async function assertReviewRequestAllowed(
  shopUserId: string,
  bossUserId: string,
  conversationId: string
) {
  const chatAccess = await assertChatAllowed(shopUserId, bossUserId);
  if (!chatAccess.allowed) {
    return { ok: false as const, error: chatAccess.error, status: chatAccess.status };
  }

  const [shop, boss, conv] = await Promise.all([
    prisma.user.findUnique({ where: { id: shopUserId } }),
    prisma.user.findUnique({ where: { id: bossUserId } }),
    prisma.conversation.findUnique({ where: { id: conversationId } }),
  ]);

  if (!shop || shop.role !== "SHOP") {
    return { ok: false as const, error: "仅店铺可发起评价邀请", status: 403 };
  }
  if (!boss || boss.role !== "BOSS") {
    return { ok: false as const, error: "只能邀请老板评价", status: 400 };
  }
  if (!conv || !conv.participants.includes(shopUserId) || !conv.participants.includes(bossUserId)) {
    return { ok: false as const, error: "会话无效", status: 400 };
  }

  await expireStaleReviewRequests(shopUserId, bossUserId);

  const chatReq = await meetsInviteChatRequirement(shopUserId, bossUserId);
  if (chatReq === "not_mutual_chat") {
    return { ok: false as const, error: "需与老板互发过消息后才能邀请评价", status: 403 };
  }
  if (chatReq === "not_recent_mutual_chat") {
    return {
      ok: false as const,
      error: `再次邀请需近 ${RECENT_MUTUAL_CHAT_HOURS} 小时内双方互发过消息`,
      status: 403,
    };
  }

  if (await hasPublishedReviewToday(shopUserId, bossUserId)) {
    return { ok: false as const, error: "该老板今日已评价，明日可再次邀请", status: 409 };
  }

  const pending = await getActivePendingRequest(shopUserId, bossUserId);
  if (pending) {
    return { ok: false as const, error: "已有进行中的评价邀请", status: 409 };
  }

  if (await hasInviteToday(shopUserId, bossUserId)) {
    return { ok: false as const, error: "今日已向该老板发送过邀请", status: 409 };
  }

  return { ok: true as const, shop, boss, conv };
}

/** 邀请在发起日（上海自然日）内有效，次日 0 点起视为过期 */
export function reviewRequestExpiresAt(from: Date = new Date()) {
  const { end } = getShanghaiDayBounds(from);
  return end;
}

export function formatPublicReviewer(nickname: string, isAnonymous: boolean) {
  return isAnonymous ? "匿名老板" : nickname;
}

export type ReviewRequestStatusLabel = ReviewRequestStatus;
