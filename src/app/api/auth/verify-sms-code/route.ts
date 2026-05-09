import { NextRequest, NextResponse } from "next/server";
import { createVerifiedToken } from "@/lib/verification";
import { verifySmsCode } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const { phone, code }: { phone: string; code: string } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "手机号和验证码不能为空" }, { status: 400 });
    }

    // 调用阿里云 CheckSmsVerifyCode 验证短信验证码
    const aliyunValid = await verifySmsCode(phone, code);

    console.log("[Verify] 阿里云验证结果:", aliyunValid);

    if (!aliyunValid) {
      return NextResponse.json({ error: "验证码错误" }, { status: 400 });
    }

    // 阿里云验证通过，生成 verifiedToken
    const verifiedToken = createVerifiedToken(phone);
    return NextResponse.json({ valid: true, verifiedToken });
  } catch (error: any) {
    console.error("Verify SMS code error:", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
