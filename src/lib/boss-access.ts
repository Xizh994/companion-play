import { prisma } from "@/lib/prisma";
import type { RealNameVerification, User } from "@prisma/client";

/** 未实名老板在大厅可预览的店铺数量上限 */
export const BOSS_PREVIEW_SHOP_LIMIT = 2;

export type UserWithRealName = User & {
  realNameVerification?: RealNameVerification | null;
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
    include: { realNameVerification: true },
  });
}

export type ChatAccessResult =
  | { allowed: true }
  | { allowed: false; error: string; status: number };

/** 校验双方是否允许发起/继续私聊（未实名老板不可聊，店铺也不能找未实名老板） */
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

  if (!canBossUseFullPlatform(target)) {
    return {
      allowed: false,
      error: "对方尚未完成实名认证，暂无法发起聊天",
      status: 403,
    };
  }

  return { allowed: true };
}
