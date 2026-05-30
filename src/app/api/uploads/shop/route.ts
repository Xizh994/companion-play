import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";

/** 店铺装修图片上传（需登录，仅 SHOP） */
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }
    if (payload.role !== "SHOP") {
      return NextResponse.json({ error: "仅店铺可上传" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    }

    const { url } = await saveUploadedImage("shop", file);
    return NextResponse.json({ url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
