/**
 * 手动全量刷新店铺热门榜 rankScore（无视「今日已刷新」）
 * 用法: npx tsx scripts/refresh-shop-ranking.ts
 */
import { ensureDailyShopRankingRefresh } from "../src/lib/shop-ranking";

async function main() {
  const result = await ensureDailyShopRankingRefresh({ force: true });
  console.log(
    `[OK] 热门榜已刷新 dateKey=${result.dateKey} shops=${result.shopCount ?? 0} refreshed=${result.refreshed}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
