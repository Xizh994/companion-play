import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const LICENSE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const CHAT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadKind = "avatars" | "licenses" | "chat";

const CONFIG: Record<
  UploadKind,
  { dir: string; publicPath: string; allowed: string[]; maxBytes: number }
> = {
  avatars: {
    dir: path.join(process.cwd(), "data", "uploads", "avatars"),
    publicPath: "/api/uploads/avatars",
    allowed: AVATAR_TYPES,
    maxBytes: 5 * 1024 * 1024,
  },
  licenses: {
    dir: path.join(process.cwd(), "data", "uploads", "licenses"),
    publicPath: "/api/uploads/licenses",
    allowed: LICENSE_TYPES,
    maxBytes: 10 * 1024 * 1024,
  },
  chat: {
    dir: path.join(process.cwd(), "data", "uploads", "chat"),
    publicPath: "/api/uploads/chat",
    allowed: CHAT_IMAGE_TYPES,
    maxBytes: 5 * 1024 * 1024,
  },
};

async function ensureDir(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // exists
  }
}

export async function saveUploadedImage(
  kind: UploadKind,
  file: File
): Promise<{ url: string; filename: string }> {
  const cfg = CONFIG[kind];
  if (!cfg.allowed.includes(file.type)) {
    const formatMsg =
      kind === "licenses" || kind === "chat"
        ? "仅支持 JPG/PNG/WebP 格式"
        : "仅支持 JPG/PNG/WebP/GIF 格式";
    throw new Error(formatMsg);
  }
  if (file.size > cfg.maxBytes) {
    const sizeMsg =
      kind === "licenses" ? "图片大小不能超过 10MB" : "图片大小不能超过 5MB";
    throw new Error(sizeMsg);
  }

  await ensureDir(cfg.dir);
  const ext = file.type.split("/")[1] || "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(cfg.dir, filename), buffer);

  return { url: `${cfg.publicPath}/${filename}`, filename };
}

export function getUploadDir(kind: UploadKind): string {
  return CONFIG[kind].dir;
}
