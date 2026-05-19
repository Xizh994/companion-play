import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import type { ShopProfile, User } from "@prisma/client";

export type AuthUser = User & {
  shopProfile: ShopProfile | null;
};

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { shopProfile: true },
  });
  return user;
}
