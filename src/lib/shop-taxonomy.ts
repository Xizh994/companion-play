/**
 * 店铺经营游戏枚举（参考比心 APP 主流品类：手游 + 端游热门）。
 *
 * 说明：UserRole.PLAYER / PlayerProfile 为后期「个人陪玩」预留，
 * 当前产品仅运营 BOSS + SHOP，相关 API 与表结构勿删。
 */

export const SHOP_GAME_GROUPS = [
  {
    id: "mobile",
    label: "手游",
    games: [
      "王者荣耀",
      "英雄联盟手游",
      "和平精英",
      "蛋仔派对",
      "元梦之星",
      "金铲铲之战",
      "第五人格",
      "穿越火线",
    ],
  },
  {
    id: "pc",
    label: "端游",
    games: [
      "英雄联盟",
      "CS2",
      "DOTA2",
      "永劫无间",
      "绝地求生",
      "云顶之弈",
      "Apex英雄",
      "守望先锋",
    ],
  },
] as const;

/** 扁平列表（去重，永劫无间等跨端游戏只保留一项） */
export const SHOP_GAME_OPTIONS = [
  ...new Set(SHOP_GAME_GROUPS.flatMap((g) => g.games)),
] as string[];

export type ShopGameOption = (typeof SHOP_GAME_OPTIONS)[number];

export const SHOP_GAME_MAX = 5;

/** 历史数据别名 → 当前标准名 */
const LEGACY_GAME_ALIASES: Record<string, string> = {
  "CS:GO": "CS2",
  CSGO: "CS2",
  "守望先锋2": "守望先锋",
};

export function resolveShopGameName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const aliased = LEGACY_GAME_ALIASES[trimmed] ?? trimmed;
  return SHOP_GAME_OPTIONS.includes(aliased) ? aliased : null;
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
    if (!SHOP_GAME_OPTIONS.includes(g)) {
      return `无效的游戏项目：${g}`;
    }
  }
  return null;
}
