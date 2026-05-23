/**
 * 店铺经营游戏枚举（比心主流热门，手游仅保留头部 + 端游热门，统一展示）。
 *
 * 说明：UserRole.PLAYER / PlayerProfile 为后期「个人陪玩」预留，
 * 当前产品仅运营 BOSS + SHOP，相关 API 与表结构勿删。
 */

/** 顺序：热门手游 → 端游热门 */
export const SHOP_GAME_OPTIONS = [
  "王者荣耀",
  "和平精英",
  "英雄联盟手游",
  "英雄联盟",
  "CS2",
  "永劫无间",
  "绝地求生",
  "DOTA2",
  "蛋仔派对",
  "金铲铲之战",
  "云顶之弈",
] as const;

export type ShopGameOption = (typeof SHOP_GAME_OPTIONS)[number];

export const SHOP_GAME_MAX = 5;

/** 历史数据别名 → 当前标准名 */
const LEGACY_GAME_ALIASES: Record<string, string> = {
  "CS:GO": "CS2",
  CSGO: "CS2",
};

export function resolveShopGameName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const aliased = LEGACY_GAME_ALIASES[trimmed] ?? trimmed;
  return SHOP_GAME_OPTIONS.includes(aliased as ShopGameOption) ? aliased : null;
}

export function normalizeShopGameCategories(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const resolved = resolveShopGameName(item);
    if (!resolved) continue;
    set.add(resolved);
    if (set.size >= SHOP_GAME_MAX) break;
  }
  return [...set];
}

export function validateShopGameCategories(
  categories: string[],
  opts: { min?: number } = {}
): string | null {
  const min = opts.min ?? 0;
  if (categories.length < min) {
    return min === 1 ? "请至少选择 1 个主打游戏" : "游戏项目不能为空";
  }
  if (categories.length > SHOP_GAME_MAX) {
    return `最多选择 ${SHOP_GAME_MAX} 个游戏`;
  }
  for (const g of categories) {
    if (!SHOP_GAME_OPTIONS.includes(g as ShopGameOption)) {
      return `无效的游戏项目：${g}`;
    }
  }
  return null;
}
