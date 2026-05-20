import { prisma } from "@/lib/prisma";
import type { ShopProfile, User } from "@prisma/client";

export type UserWithShopProfile = User & {
  shopProfile?: ShopProfile | null;
};

export function isShopVerificationApproved(
  user: { role: string } & { shopProfile?: { verificationStatus: string } | null }
): boolean {
  return (
    user.role === "SHOP" &&
    user.shopProfile?.verificationStatus === "APPROVED"
  );
}

/** 店铺是否可在大厅展示、与老板私聊（与老板实名通过后的全功能对称） */
export function canShopOperatePublicly(user: UserWithShopProfile): boolean {
  if (user.role !== "SHOP") return true;
  return isShopVerificationApproved(user);
}

export async function loadUserWithShopProfile(
  userId: string
): Promise<UserWithShopProfile | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { shopProfile: true },
  });
}

export const SHOP_VERIFY_RESTRICTION_MESSAGE =
  "完成店铺认证并通过核验后，方可在大厅展示并与老板聊天";

export const SHOP_VERIFY_REGISTER_HINT =
  "注册成功后请前往「我的」→「店铺认证」点击「开始核验」；核验通过后店铺才可正常营业";

/** 店铺在本平台的运营对接人（≠ 营业执照法定代表人） */
export const SHOP_PLATFORM_CONTACT_LABEL = "平台负责人";

export const SHOP_PLATFORM_CONTACT_HINT =
  "在本平台负责店铺运营与联系的自然人，须完成实名核验；与营业执照上的法定代表人/经营者可以不是同一人";

export const SHOP_ENTERPRISE_VERIFY_HINT =
  "核验营业执照对应企业是否真实有效；法定代表人/经营者以证照及工商信息为准";
