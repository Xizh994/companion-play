import { NextRequest, NextResponse } from "next/server";
import { sendSmsCode } from "@/lib/sms";
import { prisma } from "@/lib/prisma";
import { canSendCode } from "@/lib/verification";
import type { VerificationCodeType } from "@prisma/client";

const PURPOSE_TYPE_MAP: Record<string, VerificationCodeType> = {
  register: "SMS_REGISTER",
  login: "SMS_LOGIN",
  resetPassword: "SMS_RESET_PWD",
  changePhone: "SMS_LOGIN",
  bindPhone: "SMS_LOGIN",
  verifyPhone: "SMS_LOGIN",
};

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose }: { 
      phone: string; 
      purpose: "register" | "login" | "changePhone" | "resetPassword" | "bindPhone" | "verifyPhone" 
    } = await req.json();

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
    }

    const smsType = PURPOSE_TYPE_MAP[purpose];

    const typeCheck = await canSendCode(phone, smsType);
    if (!typeCheck.allowed) {
      return NextResponse.json({ error: `请 ${typeCheck.waitSeconds} 秒后再试` }, { status: 429 });
    }

    const phoneCheck = await canSendCode(phone);
    if (!phoneCheck.allowed) {
      return NextResponse.json({ error: `请 ${phoneCheck.waitSeconds} 秒后再试` }, { status: 429 });
    }

    const { requestId, code: generatedCode } = await sendSmsCode(phone, "", purpose);

    await prisma.verificationCode.create({
      data: {
        target: phone,
        code: generatedCode || "000000",
        type: smsType,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    console.log("[Send SMS] 发送成功，requestId:", requestId, "阿里云生成的验证码:", generatedCode);

    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    console.error("Send SMS code error:", error);
    return NextResponse.json({ error: "发送验证码失败" }, { status: 500 });
  }
}
