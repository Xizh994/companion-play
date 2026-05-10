import { prisma } from "./prisma";
import { signToken } from "./auth";
import type { VerificationCodeType } from "@prisma/client";

const CODE_LENGTH = 6;
const CODE_EXPIRY_MINUTES = 5;
const RATE_LIMIT_SECONDS = 60;
const VERIFIED_TOKEN_EXPIRY = "10m";

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function canSendCode(
  target: string,
  type?: VerificationCodeType
): Promise<{ allowed: boolean; waitSeconds: number }> {
  const recent = await prisma.verificationCode.findFirst({
    where: {
      target,
      type: type ?? undefined,
      createdAt: { gte: new Date(Date.now() - RATE_LIMIT_SECONDS * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    const elapsed = (Date.now() - recent.createdAt.getTime()) / 1000;
    const waitSeconds = Math.ceil(RATE_LIMIT_SECONDS - elapsed);
    return { allowed: false, waitSeconds: Math.max(0, waitSeconds) };
  }

  return { allowed: true, waitSeconds: 0 };
}

export async function createVerificationCode(
  target: string,
  type: VerificationCodeType,
  userId?: string
): Promise<string> {
  const code = generateCode();

  await prisma.verificationCode.create({
    data: {
      target,
      code,
      type,
      userId,
      expiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  return code;
}

export async function verifyCode(
  target: string,
  code: string,
  type: VerificationCodeType
): Promise<{
  valid: boolean;
  verifiedToken?: string;
}> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      target,
      type,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.code !== code) {
    return { valid: false };
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  const verifiedToken = signToken(
    {
      userId: record.userId || "",
      role: "BOSS",
    },
    VERIFIED_TOKEN_EXPIRY
  );

  return { valid: true, verifiedToken };
}

export async function verifyCodeWithoutUser(
  target: string,
  code: string,
  type: VerificationCodeType
): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      target,
      type,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.code !== code) {
    return false;
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return true;
}

export function createVerifiedToken(phone: string): string {
  return signToken(
    { userId: phone, role: "BOSS" },
    VERIFIED_TOKEN_EXPIRY
  );
}
