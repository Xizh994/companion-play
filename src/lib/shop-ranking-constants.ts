/** 大厅热门店铺：每日刷新一次 rankScore，评价提交不即时改榜 */

export const HOT_SHOP_LIMIT = 10;
export const HOT_MIN_REVIEW_COUNT = 3;

/** 贝叶斯先验：等价于已有 m 条 C 分评价，拉平小样本 */
export const BAYESIAN_PRIOR_MEAN = 4.0;
export const BAYESIAN_PRIOR_WEIGHT = 5;

export const SHOP_RANKING_REFRESH_KV_KEY = "shop_ranking_refresh_date";
