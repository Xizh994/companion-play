/** 会话列表 / 通知用的消息摘要 */
export function formatMessagePreview(type: string, content: string): string {
  if (type === "image") return "[图片]";
  const trimmed = content.trim();
  if (trimmed.startsWith("/api/uploads/chat/")) return "[图片]";
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
}

export function isImageMessage(type: string, content: string): boolean {
  return type === "image" || content.startsWith("/api/uploads/chat/");
}
