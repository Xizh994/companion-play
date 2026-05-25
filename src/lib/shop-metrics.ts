import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMutualChat } from "@/lib/shop-review";
import { getShanghaiDayBounds, formatShanghaiDateKey } from "@/lib/shop-time";

const RATE_LIMIT_MS = 60 * 1000;

export type RecordPageViewResult = {
  recorded: boolean;
  reason?: "shop_viewer" | "self_view" | "no_identity" | "rate_limit" | "already_today";
};

export function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || null;
}

export function buildVisitorKey(visitorId: string | null, ip: string | null): string | null {
  if (visitorId) return visitorId;
  if (ip) {
    const hash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
    return `ip:${hash}`;
  }
  return null;
}

/** 同日同访客只计 1 次；60 秒内重复请求忽略；店铺账号/本人访问不计 */
export async function tryRecordShopPageView(
  shopUserId: string,
  opts: {
    visitorId: string | null;
    visitorRole?: string | null;
    ip?: string | null;
    source?: string;
  }
): Promise<RecordPageViewResult> {
  const { visitorId, visitorRole, ip, source } = opts;

  if (visitorRole === "SHOP") {
    return { recorded: false, reason: "shop_viewer" };
  }
  if (visitorId && visitorId === shopUserId) {
    return { recorded: false, reason: "self_view" };
  }

  const visitorKey = buildVisitorKey(visitorId, ip ?? null);
  if (!visitorKey) {
    return { recorded: false, reason: "no_identity" };
  }

  const now = new Date();
  const { start: todayStart, end: todayEnd } = getShanghaiDayBounds(now);
  const since = new Date(now.getTime() - RATE_LIMIT_MS);

  const [recent, today] = await Promise.all([
    prisma.shopPageView.findFirst({
      where: { shopUserId, visitorKey, createdAt: { gte: since } },
      select: { id: true },
    }),
    prisma.shopPageView.findFirst({
      where: {
        shopUserId,
        visitorKey,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
      select: { id: true },
    }),
  ]);

  if (recent) return { recorded: false, reason: "rate_limit" };
  if (today) return { recorded: false, reason: "already_today" };

  await prisma.$transaction([
    prisma.shopPageView.create({
      data: {
        shopUserId,
        visitorId,
        visitorKey,
        source: source ?? null,
      },
    }),
    prisma.shopProfile.updateMany({
      where: { userId: shopUserId },
      data: { pageViewCount: { increment: 1 } },
    }),
  ]);

  return { recorded: true };
}

/** @deprecated 请使用 tryRecordShopPageView */
export async function recordShopPageView(
  shopUserId: string,
  visitorId: string | null,
  source?: string
) {
  await tryRecordShopPageView(shopUserId, { visitorId, source });
}

/** 双方互聊达标后，首次计入咨询量（幂等） */
export async function maybeRecordConsultation(shopUserId: string, bossUserId: string) {
  const shop = await prisma.user.findUnique({ where: { id: shopUserId }, select: { role: true } });
  const boss = await prisma.user.findUnique({ where: { id: bossUserId }, select: { role: true } });
  if (shop?.role !== "SHOP" || boss?.role !== "BOSS") return;

  const mutual = await hasMutualChat(shopUserId, bossUserId);
  if (!mutual) return;

  const existing = await prisma.shopConsultation.findUnique({
    where: { shopUserId_bossUserId: { shopUserId, bossUserId } },
  });
  if (existing) return;

  await prisma.$transaction([
    prisma.shopConsultation.create({ data: { shopUserId, bossUserId } }),
    prisma.shopProfile.updateMany({
      where: { userId: shopUserId },
      data: { consultationCount: { increment: 1 } },
    }),
  ]);
}

function countDistinctVisitorKeys(
  rows: { visitorKey: string | null; visitorId: string | null }[]
): number {
  const keys = new Set<string>();
  for (const r of rows) {
    const k = r.visitorKey ?? r.visitorId;
    if (k) keys.add(k);
  }
  return keys.size;
}

export async function getShopDashboard(shopUserId: string, rangeDays = 7) {
  const { start: todayStart, end: todayEnd } = getShanghaiDayBounds();
  const rangeStart = new Date(todayStart.getTime() - (rangeDays - 1) * 24 * 60 * 60 * 1000);

  const profile = await prisma.shopProfile.findFirst({ where: { userId: shopUserId } });
  if (!profile) return null;

  const [viewsTodayRows, reviewsToday, pageViewsInRange, reviewsInRange] = await Promise.all([
    prisma.shopPageView.findMany({
      where: { shopUserId, createdAt: { gte: todayStart, lt: todayEnd } },
      select: { visitorKey: true, visitorId: true },
    }),
    prisma.shopReview.count({
      where: {
        shopUserId,
        status: "PUBLISHED",
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.shopPageView.findMany({
      where: { shopUserId, createdAt: { gte: rangeStart, lt: todayEnd } },
      select: { createdAt: true, visitorKey: true, visitorId: true },
    }),
    prisma.shopReview.findMany({
      where: {
        shopUserId,
        status: "PUBLISHED",
        createdAt: { gte: rangeStart, lt: todayEnd },
      },
      select: { createdAt: true },
    }),
  ]);

  const visitorsToday = countDistinctVisitorKeys(viewsTodayRows);

  const trendMap = new Map<string, { uniqueVisitors: Set<string>; reviews: number }>();
  for (let i = 0; i < rangeDays; i++) {
    const dayStart = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
    trendMap.set(formatShanghaiDateKey(dayStart), {
      uniqueVisitors: new Set(),
      reviews: 0,
    });
  }

  for (const pv of pageViewsInRange) {
    const key = formatShanghaiDateKey(pv.createdAt);
    const bucket = trendMap.get(key);
    if (!bucket) continue;
    const vk = pv.visitorKey ?? pv.visitorId;
    if (vk) bucket.uniqueVisitors.add(vk);
  }

  for (const rv of reviewsInRange) {
    const key = formatShanghaiDateKey(rv.createdAt);
    const bucket = trendMap.get(key);
    if (bucket) bucket.reviews += 1;
  }

  const trend = Array.from(trendMap.entries()).map(([date, v]) => ({
    date,
    pageViews: v.uniqueVisitors.size,
    uniqueVisitors: v.uniqueVisitors.size,
    reviews: v.reviews,
  }));

  return {
    summary: {
      pageViewsToday: visitorsToday,
      uniqueVisitorsToday: visitorsToday,
      consultationsTotal: profile.consultationCount,
      reviewsTotal: profile.reviewCount,
      avgRating: profile.rating != null ? Number(profile.rating) : null,
      reviewsToday,
      pageViewsTotal: profile.pageViewCount,
    },
    trend,
  };
}
