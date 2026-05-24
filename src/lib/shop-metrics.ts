import { prisma } from "@/lib/prisma";
import { hasMutualChat } from "@/lib/shop-review";
import { getShanghaiDayBounds, formatShanghaiDateKey } from "@/lib/shop-time";

export async function recordShopPageView(
  shopUserId: string,
  visitorId: string | null,
  source?: string
) {
  await prisma.$transaction([
    prisma.shopPageView.create({
      data: { shopUserId, visitorId, source: source ?? null },
    }),
    prisma.shopProfile.updateMany({
      where: { userId: shopUserId },
      data: { pageViewCount: { increment: 1 } },
    }),
  ]);
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

export async function getShopDashboard(shopUserId: string, rangeDays = 7) {
  const { start: todayStart, end: todayEnd } = getShanghaiDayBounds();
  const rangeStart = new Date(todayStart.getTime() - (rangeDays - 1) * 24 * 60 * 60 * 1000);

  const profile = await prisma.shopProfile.findFirst({ where: { userId: shopUserId } });
  if (!profile) return null;

  const [pageViewsToday, uniqueVisitorsTodayRows, reviewsToday, pageViewsInRange, reviewsInRange] =
    await Promise.all([
      prisma.shopPageView.count({
        where: { shopUserId, createdAt: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.shopPageView.findMany({
        where: {
          shopUserId,
          createdAt: { gte: todayStart, lt: todayEnd },
          visitorId: { not: null },
        },
        distinct: ["visitorId"],
        select: { visitorId: true },
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
        select: { createdAt: true, visitorId: true },
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

  const trendMap = new Map<string, { pageViews: number; uniqueVisitors: Set<string>; reviews: number }>();
  for (let i = 0; i < rangeDays; i++) {
    const dayStart = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
    trendMap.set(formatShanghaiDateKey(dayStart), {
      pageViews: 0,
      uniqueVisitors: new Set(),
      reviews: 0,
    });
  }

  for (const pv of pageViewsInRange) {
    const key = formatShanghaiDateKey(pv.createdAt);
    const bucket = trendMap.get(key);
    if (!bucket) continue;
    bucket.pageViews += 1;
    if (pv.visitorId) bucket.uniqueVisitors.add(pv.visitorId);
  }

  for (const rv of reviewsInRange) {
    const key = formatShanghaiDateKey(rv.createdAt);
    const bucket = trendMap.get(key);
    if (bucket) bucket.reviews += 1;
  }

  const trend = Array.from(trendMap.entries()).map(([date, v]) => ({
    date,
    pageViews: v.pageViews,
    uniqueVisitors: v.uniqueVisitors.size,
    reviews: v.reviews,
  }));

  return {
    summary: {
      pageViewsToday,
      uniqueVisitorsToday: uniqueVisitorsTodayRows.length,
      consultationsTotal: profile.consultationCount,
      reviewsTotal: profile.reviewCount,
      avgRating: profile.rating != null ? Number(profile.rating) : null,
      reviewsToday,
      pageViewsTotal: profile.pageViewCount,
    },
    trend,
  };
}
