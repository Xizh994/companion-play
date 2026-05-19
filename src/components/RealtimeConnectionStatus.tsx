"use client";

import {
  getSocketConnectionDotClass,
  getSocketConnectionLabel,
  type SocketConnectionStatus,
} from "@/lib/socket-connection";
import { cn } from "@/lib/utils";

type RealtimeConnectionStatusProps = {
  status: SocketConnectionStatus;
  /** 为 true 时不展示 idle（未登录 / 尚未建立连接） */
  hideWhenIdle?: boolean;
  className?: string;
  title?: string;
};

/**
 * 展示 Socket.IO 实时通道状态（与 HTTP 登录无关）。
 */
export function RealtimeConnectionStatus({
  status,
  hideWhenIdle = true,
  className,
  title,
}: RealtimeConnectionStatusProps) {
  if (hideWhenIdle && status === "idle") {
    return null;
  }

  const label = getSocketConnectionLabel(status);
  const dotClass = getSocketConnectionDotClass(status);

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-sm", className)}
      title={title ?? label}
      role="status"
      aria-live="polite"
    >
      <span className={cn("select-none", dotClass)} aria-hidden>
        ●
      </span>
      <span className={cn("text-gray-500", status === "connected" && "text-green-400/90")}>
        {label}
      </span>
    </span>
  );
}
