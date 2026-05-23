/**
 * 店铺经营游戏枚举（平台维护，店铺多选）。
 *
 * 说明：UserRole.PLAYER / PlayerProfile 为后期「个人陪玩」预留，
 * 当前产品仅运营 BOSS + SHOP，相关 API 与表结构勿删。
 */

export const SHOP_GAME_OPTIONS = [
  "王者荣耀",
  "英雄联盟",
  "和平精英",
  "原神",
  "崩坏：星穹铁道",
  "CS2",
  "DOTA2",
  "永劫无间",
  "蛋仔派对",
  "其他",
] as const;

export type ShopGameOption = (typeof SHOP_GAME_OPTIONS)[number];

export const SHOP_GAME_MAX = 5;

export function normalizeShopGameCategories(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed || !SHOP_GAME_OPTIONS.includes(trimmed as ShopGameOption)) continue;
    set.add(trimmed);
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
