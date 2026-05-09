import { NextRequest, NextResponse } from "next/server";
import { sendSmsCode } from "@/lib/sms";
import { canSendCode } from "@/lib/verification";

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose }: { 
      phone: string; 
      purpose: "register" | "login" | "changePhone" | "resetPassword" | "bindPhone" | "verifyPhone" 
    } = await req.json();

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
    }

    const { allowed, waitSeconds } = await canSendCode(phone);
    if (!allowed) {
      return NextResponse.json({ error: `请 ${waitSeconds} 秒后再试` }, { status: 429 });
    }

    // 阿里云自己生成验证码，不需要我们自己生成了
    const { requestId, code: generatedCode } = await sendSmsCode(phone, "", purpose);

    console.log("[Send SMS] 发送成功，requestId:", requestId, "阿里云生成的验证码:", generatedCode);

    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    console.error("Send SMS code error:", error);
    return NextResponse.json({ error: "发送验证码失败" }, { status: 500 });
  }
}
