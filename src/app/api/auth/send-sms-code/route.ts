import { NextRequest, NextResponse } from "next/server";
import { sendSmsCode } from "@/lib/sms";
import { canSendCode, createVerificationCode } from "@/lib/verification";

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose }: { phone: string; purpose: "register" | "login" } = await req.json();

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
    }

    const type = purpose === "login" ? "SMS_LOGIN" : ("SMS_REGISTER" as const);

    const { allowed, waitSeconds } = await canSendCode(phone);
    if (!allowed) {
      return NextResponse.json({ error: `请 ${waitSeconds} 秒后再试` }, { status: 429 });
    }

    const code = await createVerificationCode(phone, type);
    const { requestId } = await sendSmsCode(phone, code);

    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    console.error("Send SMS code error:", error);
    return NextResponse.json({ error: "发送验证码失败" }, { status: 500 });
  }
}
