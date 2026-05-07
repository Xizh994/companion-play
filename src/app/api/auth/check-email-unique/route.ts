import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email }: { email: string } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    return NextResponse.json({ inUse: !!existing });
  } catch (error: any) {
    console.error("Check email unique error:", error);
    return NextResponse.json({ error: "校验失败" }, { status: 500 });
  }
}
