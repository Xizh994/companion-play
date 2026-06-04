/** 评价邀请：发起日当天有效，次日 0 点（上海）过期，最早隔 1 天可再邀 */
export const REVIEW_REQUEST_TTL_DAYS = 1;
export const REVIEW_CONTENT_MIN = 5;
export const REVIEW_CONTENT_MAX = 500;

/** 再次邀请：近 N 小时内双方各至少 1 条有效消息 */
export const RECENT_MUTUAL_CHAT_HOURS = 72;

export type ShopReviewInviteState =
  | "not_mutual_chat"
  | "not_recent_mutual_chat"
  | "can_invite"
  | "pending"
  | "expired_can_reinvite"
  | "boss_reviewed_today"
  | "invited_today";
