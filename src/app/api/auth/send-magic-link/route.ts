import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";
import { canSendCode, createVerificationCode } from "@/lib/verification";

export async function POST(req: NextRequest) {
  try {
    const { email }: { email: string } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "该邮箱未绑定任何账号" }, { status: 404 });
    }

    const { allowed, waitSeconds } = await canSendCode(email);
    if (!allowed) {
      return NextResponse.json({ error: `请 ${waitSeconds} 秒后再试` }, { status: 429 });
    }

    const magicToken = signToken(
      { userId: user.id, role: user.role },
      "5m"
    );

    // 保存到 verification_codes 表作为一次性使用标记
    await createVerificationCode(user.id, "MAGIC_LINK", user.id);

    // 使用 magicToken 作为邮件中的 token
    await prisma.verificationCode.updateMany({
      where: { userId: user.id, type: "MAGIC_LINK", used: false },
      data: { target: magicToken },
    });

    await sendMagicLink(email, magicToken);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Send magic link error:", error);
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}
