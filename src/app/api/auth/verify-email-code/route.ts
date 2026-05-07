import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/verification";

export async function POST(req: NextRequest) {
  try {
    const { email, code, purpose }: { email: string; code: string; purpose: "bind" | "recovery" | "change_pwd" } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "邮箱和验证码不能为空" }, { status: 400 });
    }

    const typeMap: Record<string, "EMAIL_BIND" | "EMAIL_RECOVERY" | "EMAIL_CHANGE_PWD"> = {
      bind: "EMAIL_BIND",
      recovery: "EMAIL_RECOVERY",
      change_pwd: "EMAIL_CHANGE_PWD",
    };

    const type = typeMap[purpose];
    if (!type) {
      return NextResponse.json({ error: "无效的验证码用途" }, { status: 400 });
    }

    // 邮箱唯一性检查
    if (purpose === "bind") {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "该邮箱已被其他账号绑定" }, { status: 409 });
      }
    } else if (purpose === "recovery") {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        return NextResponse.json({ error: "该邮箱未绑定任何账号" }, { status: 404 });
      }
    }

    const { valid, verifiedToken } = await verifyCode(email, code, type);

    if (!valid || !verifiedToken) {
      return NextResponse.json({ error: "验证码已过期或已使用" }, { status: 400 });
    }

    return NextResponse.json({ valid: true, verifiedToken });
  } catch (error: any) {
    console.error("Verify email code error:", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
