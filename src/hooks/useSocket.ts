"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  isSocketConnected,
  type SocketConnectionStatus,
} from "@/lib/socket-connection";

export function useSocket(userId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<SocketConnectionStatus>("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSocket(null);
      setConnectionStatus("idle");
      setConnectionError(null);
      return;
    }

    setConnectionStatus("connecting");
    setConnectionError(null);

    // polling 优先：Nginx 未正确转发 WebSocket 时仍可连上；upgrade:false 避免连上后升级 WS 失败反复断线
    const client = io(window.location.origin, {
      transports: ["polling", "websocket"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const onConnect = () => {
      client.emit("auth", userId);
      setConnectionError(null);
      setConnectionStatus("connected");
    };

    const onDisconnect = () => {
      setConnectionStatus(client.active ? "reconnecting" : "disconnected");
    };

    const onConnectError = (err: Error) => {
      if (client.connected) return;
      const msg = err.message || "无法连接实时服务";
      setConnectionError(
        msg.toLowerCase().includes("websocket")
          ? "实时服务连接失败，请确认已用 npm start 启动且 Nginx 已配置 WebSocket 转发"
          : msg
      );
      setConnectionStatus(client.active ? "reconnecting" : "error");
    };

    const onReconnectAttempt = () => {
      setConnectionStatus("reconnecting");
    };

    const onReconnect = () => {
      client.emit("auth", userId);
      setConnectionError(null);
      setConnectionStatus("connected");
    };

    const onReconnectFailed = () => {
      setConnectionStatus("error");
    };

    client.on("connect", onConnect);
    client.on("disconnect", onDisconnect);
    client.on("connect_error", onConnectError);
    client.io.on("reconnect_attempt", onReconnectAttempt);
    client.io.on("reconnect", onReconnect);
    client.io.on("reconnect_failed", onReconnectFailed);

    setSocket(client);

    return () => {
      client.off("connect", onConnect);
      client.off("disconnect", onDisconnect);
      client.off("connect_error", onConnectError);
      client.io.off("reconnect_attempt", onReconnectAttempt);
      client.io.off("reconnect", onReconnect);
      client.io.off("reconnect_failed", onReconnectFailed);
      client.disconnect();
      setSocket(null);
      setConnectionStatus("idle");
      setConnectionError(null);
    };
  }, [userId]);

  const connected = isSocketConnected(connectionStatus);

  return { socket, connected, connectionStatus, connectionError };
}
