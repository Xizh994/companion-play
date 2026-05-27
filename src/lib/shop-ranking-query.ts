import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HOT_MIN_REVIEW_COUNT, HOT_SHOP_LIMIT } from "@/lib/shop-ranking-constants";

export type HotShopUserRow = Prisma.UserGetPayload<{
  include: { shopProfile: true };
}>;

/** 大厅热门店铺查询（需先 ensureDailyShopRankingRefresh） */
export async function queryHotShopUsers(
  baseWhere: Prisma.UserWhereInput,
  limit: number = HOT_SHOP_LIMIT
): Promise<HotShopUserRow[]> {
  const shopExtra: Prisma.ShopProfileWhereInput = {
    reviewCount: { gte: HOT_MIN_REVIEW_COUNT },
    rankScore: { not: null },
  };

  const shopProfileWhere: Prisma.ShopProfileWhereInput = {
    ...(typeof baseWhere.shopProfile === "object" && baseWhere.shopProfile !== null
      ? (baseWhere.shopProfile as Prisma.ShopProfileWhereInput)
      : {}),
    ...shopExtra,
  };

  const where: Prisma.UserWhereInput = {
    ...baseWhere,
    shopProfile: shopProfileWhere,
  };

  return prisma.user.findMany({
    where,
    include: { shopProfile: true },
    orderBy: [
      { shopProfile: { rankScore: "desc" } },
      { shopProfile: { reviewCount: "desc" } },
      { shopProfile: { orderCount: "desc" } },
      { shopProfile: { shopName: "asc" } },
    ],
    take: limit,
  });
}
