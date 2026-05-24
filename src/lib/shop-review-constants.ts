export const REVIEW_REQUEST_TTL_DAYS = 7;
export const REVIEW_CONTENT_MIN = 5;
export const REVIEW_CONTENT_MAX = 500;

export type ShopReviewInviteState =
  | "not_mutual_chat"
  | "can_invite"
  | "pending"
  | "expired_can_reinvite"
  | "boss_reviewed_today"
  | "invited_today";
