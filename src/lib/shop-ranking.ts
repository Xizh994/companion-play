import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatShanghaiDateKey } from "@/lib/shop-time";
import {
  BAYESIAN_PRIOR_MEAN,
  BAYESIAN_PRIOR_WEIGHT,
  HOT_MIN_REVIEW_COUNT,
  SHOP_RANKING_REFRESH_KV_KEY,
} from "@/lib/shop-ranking-constants";

export function computeBayesianRankScore(avgRating: number, reviewCount: number): number {
  const n = reviewCount;
  const avg = avgRating;
  const score = (avg * n + BAYESIAN_PRIOR_WEIGHT * BAYESIAN_PRIOR_MEAN) / (n + BAYESIAN_PRIOR_WEIGHT);
  return Number(score.toFixed(2));
}

/** 根据已发布评价聚合结果计算 rankScore；不足门槛则 null */
export function rankScoreFromAggregate(
  avg: number | null,
  count: number
): number | null {
  if (count < HOT_MIN_REVIEW_COUNT || avg == null) return null;
  return computeBayesianRankScore(avg, count);
}

/**
 * 全量重算已认证店铺的 rankScore（rating/reviewCount 仍以评价提交时即时更新为准，此处仅同步 rankScore）
 * 每日任务或首次大厅请求触发。
 */
export async function refreshAllShopRankScores(): Promise<{ updated: number }> {
  const profiles = await prisma.shopProfile.findMany({
    where: { verificationStatus: "APPROVED" },
    select: { id: true, userId: true },
  });

  let updated = 0;
  for (const profile of profiles) {
    const agg = await prisma.shopReview.aggregate({
      where: { shopUserId: profile.userId, status: "PUBLISHED" },
      _avg: { score: true },
      _count: { id: true },
    });

    const count = agg._count.id;
    const avg = agg._avg.score != null ? Number(agg._avg.score) : null;
    const rankScore = rankScoreFromAggregate(avg, count);

    await prisma.shopProfile.update({
      where: { id: profile.id },
      data: { rankScore: rankScore != null ? new Prisma.Decimal(rankScore) : null },
    });
    updated += 1;
  }

  return { updated };
}

export type EnsureDailyRankingResult = {
  refreshed: boolean;
  dateKey: string;
  shopCount?: number;
};

/**
 * 上海自然日内仅刷新一次；force 用于脚本手动全量重算。
 */
export async function ensureDailyShopRankingRefresh(options?: {
  force?: boolean;
}): Promise<EnsureDailyRankingResult> {
  const dateKey = formatShanghaiDateKey();
  const force = options?.force === true;

  if (!force) {
    const kv = await prisma.appKv.findUnique({
      where: { key: SHOP_RANKING_REFRESH_KV_KEY },
    });
    if (kv?.value === dateKey) {
      return { refreshed: false, dateKey };
    }
  }

  const { updated } = await refreshAllShopRankScores();

  await prisma.appKv.upsert({
    where: { key: SHOP_RANKING_REFRESH_KV_KEY },
    create: { key: SHOP_RANKING_REFRESH_KV_KEY, value: dateKey },
    update: { value: dateKey },
  });

  return { refreshed: true, dateKey, shopCount: updated };
}

export async function getShopRankingDateKey(): Promise<string | null> {
  const kv = await prisma.appKv.findUnique({
    where: { key: SHOP_RANKING_REFRESH_KV_KEY },
  });
  return kv?.value ?? null;
}
