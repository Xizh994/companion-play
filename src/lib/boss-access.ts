import { prisma } from "@/lib/prisma";
import type { RealNameVerification, ShopProfile, User } from "@prisma/client";
import { canShopOperatePublicly } from "@/lib/shop-access";

/** 未实名老板在大厅可预览的店铺数量上限 */
export const BOSS_PREVIEW_SHOP_LIMIT = 2;

export type UserWithRealName = User & {
  realNameVerification?: RealNameVerification | null;
  shopProfile?: ShopProfile | null;
};

export function isBossRealNameApproved(
  user: { role: string } & { realNameVerification?: { status: string } | null }
): boolean {
  return user.role === "BOSS" && user.realNameVerification?.status === "APPROVED";
}

export function canBossUseFullPlatform(user: UserWithRealName): boolean {
  if (user.role !== "BOSS") return true;
  return isBossRealNameApproved(user);
}

export async function loadUserWithRealName(userId: string): Promise<UserWithRealName | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { realNameVerification: true, shopProfile: true },
  });
}

export type ChatAccessResult =
  | { allowed: true }
  | { allowed: false; error: string; status: number };

/** 校验双方是否允许发起/继续私聊（老板实名 + 店铺企业认证） */
export async function assertChatAllowed(
  initiatorId: string,
  targetUserId: string
): Promise<ChatAccessResult> {
  const [initiator, target] = await Promise.all([
    loadUserWithRealName(initiatorId),
    loadUserWithRealName(targetUserId),
  ]);

  if (!initiator || !target) {
    return { allowed: false, error: "用户不存在", status: 404 };
  }

  if (!canBossUseFullPlatform(initiator)) {
    return {
      allowed: false,
      error: "请先完成实名认证后再发起聊天",
      status: 403,
    };
  }

  if (!canShopOperatePublicly(initiator)) {
    return {
      allowed: false,
      error: "请先完成店铺认证并通过核验后再发起聊天",
      status: 403,
    };
  }

  if (!canBossUseFullPlatform(target)) {
    return {
      allowed: false,
      error: "对方尚未完成实名认证，暂无法发起聊天",
      status: 403,
    };
  }

  if (!canShopOperatePublicly(target)) {
    return {
      allowed: false,
      error: "该店铺尚未完成认证，暂无法联系",
      status: 403,
    };
  }

  return { allowed: true };
}
