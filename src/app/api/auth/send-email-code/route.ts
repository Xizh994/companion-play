import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import { canSendCode, createVerificationCode } from "@/lib/verification";

export async function POST(req: NextRequest) {
  try {
    const { email, purpose }: { email: string; purpose: "bind" | "recovery" | "change_pwd" } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "请输入正确的邮箱地址" }, { status: 400 });
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

    const { allowed, waitSeconds } = await canSendCode(email);
    if (!allowed) {
      return NextResponse.json({ error: `请 ${waitSeconds} 秒后再试` }, { status: 429 });
    }

    const code = await createVerificationCode(email, type);
    await sendVerificationEmail(email, code);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Send email code error:", error);
    return NextResponse.json({ error: "发送邮箱验证码失败" }, { status: 500 });
  }
}
