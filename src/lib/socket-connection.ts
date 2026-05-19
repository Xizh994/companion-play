/** Socket.IO 客户端实时通道状态（非用户业务在线状态） */
export type SocketConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export function isSocketConnected(status: SocketConnectionStatus): boolean {
  return status === "connected";
}

export function getSocketConnectionLabel(status: SocketConnectionStatus): string {
  switch (status) {
    case "idle":
      return "未就绪";
    case "connecting":
      return "正在连接实时服务…";
    case "connected":
      return "实时已连接";
    case "reconnecting":
      return "重新连接中…";
    case "disconnected":
      return "实时已断开";
    case "error":
      return "连接失败";
    default:
      return "未知状态";
  }
}

export function getSocketConnectionDotClass(status: SocketConnectionStatus): string {
  switch (status) {
    case "connected":
      return "text-green-400";
    case "connecting":
    case "reconnecting":
      return "text-amber-400 animate-pulse";
    case "error":
    case "disconnected":
      return "text-red-400/90";
    default:
      return "text-gray-500";
  }
}
