import { NextRequest, NextResponse } from "next/server";
import { verifyCode, createVerifiedToken } from "@/lib/verification";

export async function POST(req: NextRequest) {
  try {
    const { phone, code, purpose }: { phone: string; code: string; purpose: "register" | "login" } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "手机号和验证码不能为空" }, { status: 400 });
    }

    const type = purpose === "login" ? "SMS_LOGIN" : ("SMS_REGISTER" as const);

    // 先调用阿里云 CheckSmsVerifyCode 验证短信验证码
    const { verifySmsCode: verifyAliyun } = await import("@/lib/sms");
    const aliyunValid = await verifyAliyun(phone, code);

    if (!aliyunValid) {
      return NextResponse.json({ error: "验证码错误" }, { status: 400 });
    }

    const { valid, verifiedToken } = await verifyCode(phone, code, type);

    if (!valid || !verifiedToken) {
      return NextResponse.json({ error: "验证码已过期或已使用" }, { status: 400 });
    }

    return NextResponse.json({ valid: true, verifiedToken });
  } catch (error: any) {
    console.error("Verify SMS code error:", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
