"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(userId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const client = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });

    client.on("connect", () => {
      client.emit("auth", userId);
      setConnected(true);
    });

    client.on("disconnect", () => {
      setConnected(false);
    });

    setSocket(client);

    return () => {
      client.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [userId]);

  return { socket, connected };
}
