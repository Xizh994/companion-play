import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";

/** 营业执照上传：注册时凭 phoneVerifiedToken，登录后凭 Bearer */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("license") as File | null;
    const phoneVerifiedToken = formData.get("phoneVerifiedToken") as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "请选择营业执照图片" }, { status: 400 });
    }

    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    const phonePayload = phoneVerifiedToken ? verifyToken(phoneVerifiedToken) : null;

    if (!payload && !phonePayload) {
      return NextResponse.json(
        { error: "请先完成手机验证或登录后再上传" },
        { status: 401 }
      );
    }

    const { url } = await saveUploadedImage("licenses", file);
    return NextResponse.json({ url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
