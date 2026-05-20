"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import type { SocketConnectionStatus } from "@/lib/socket-connection";
import {
  clearBrowserNotifyEffects,
  getDefaultTitle,
  requestNotificationPermission,
  showDesktopNotification,
  startTitleBlink,
  stopTitleBlink,
  setFaviconBadge,
} from "@/lib/browser-notify";
import type { Socket } from "socket.io-client";
import { formatMessagePreview } from "@/lib/chat-message";

const TOKEN_KEY = "dazistar_token";
export interface IncomingMessage {
  id: string;
  content: string;
  fromId: string;
  toId?: string;
  type?: string;
  createdAt: string;
  conversationId?: string;
}

interface UnreadMessagesContextValue {
  totalUnread: number;
  refreshUnread: () => Promise<void>;
  setActiveConversationId: (id: string | null) => void;
  socket: Socket | null;
  /** @deprecated 请优先使用 connectionStatus */
  connected: boolean;
  connectionStatus: SocketConnectionStatus;
  connectionError: string | null;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | null>(null);

export function useUnreadMessages() {
  const ctx = useContext(UnreadMessagesContext);
  if (!ctx) {
    throw new Error("useUnreadMessages must be used within UnreadMessagesProvider");
  }
  return ctx;
}

export function useUnreadMessagesOptional() {
  return useContext(UnreadMessagesContext);
}

export function UnreadMessagesProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [totalUnread, setTotalUnread] = useState(0);
  const activeConvIdRef = useRef<string | null>(null);
  const totalUnreadRef = useRef(0);
  const contactsCacheRef = useRef<Record<string, string>>({});
  const notifiedPermissionRef = useRef(false);

  const { socket, connected, connectionStatus, connectionError } = useSocket(userId);

  useEffect(() => {
    totalUnreadRef.current = totalUnread;
  }, [totalUnread]);

  const refreshUnread = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch("/api/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const total = (data.conversations || []).reduce(
        (sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount || 0),
        0
      );
      setTotalUnread(total);

      if (total === 0) {
        clearBrowserNotifyEffects();
        if (typeof document !== "undefined") {
          document.title = getDefaultTitle();
        }
      } else if (document.visibilityState === "hidden") {
        startTitleBlink(total);
        setFaviconBadge(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const setActiveConversationId = useCallback((id: string | null) => {
    activeConvIdRef.current = id;
  }, []);

  const resolveSenderName = useCallback(async (fromId: string) => {
    if (contactsCacheRef.current[fromId]) {
      return contactsCacheRef.current[fromId];
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return "新消息";
    try {
      const res = await fetch(`/api/users?id=${fromId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const name = data.users?.[0]?.nickname || "新消息";
        contactsCacheRef.current[fromId] = name;
        return name;
      }
    } catch {
      // ignore
    }
    return "新消息";
  }, []);

  const shouldNotifyForMessage = useCallback(
    (msg: IncomingMessage, conversationId?: string) => {
      if (!userId || msg.fromId === userId) return false;

      const convId = conversationId || msg.conversationId;
      const onChatPage = pathname?.startsWith("/chat");
      const viewingThisConv =
        onChatPage && convId && activeConvIdRef.current === convId && document.visibilityState === "visible";

      if (viewingThisConv) return false;
      return true;
    },
    [pathname, userId]
  );

  const handleIncomingMessage = useCallback(
    async (msg: IncomingMessage, conversationId?: string) => {
      const convId = conversationId || msg.conversationId;
      await refreshUnread();

      if (!shouldNotifyForMessage(msg, convId)) return;

      const senderName = await resolveSenderName(msg.fromId);
      const preview = formatMessagePreview(msg.type || "text", msg.content);

      if (document.visibilityState === "hidden") {
        startTitleBlink(totalUnreadRef.current + 1);
        setFaviconBadge(true);

        if (!notifiedPermissionRef.current && "Notification" in window) {
          notifiedPermissionRef.current = true;
          if (Notification.permission === "default") {
            await requestNotificationPermission();
          }
        }

        showDesktopNotification(`${senderName} 发来消息`, preview, () => {
          if (convId) {
            router.push(`/chat?conv=${convId}`);
          } else {
            router.push("/chat");
          }
        });
      }
    },
    [refreshUnread, shouldNotifyForMessage, resolveSenderName, router]
  );

  useEffect(() => {
    if (userId) {
      void refreshUnread();
    }
  }, [userId, refreshUnread]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        stopTitleBlink();
        setFaviconBadge(false);
        if (typeof document !== "undefined") {
          document.title = getDefaultTitle();
        }
        void refreshUnread();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshUnread]);

  useEffect(() => {
    if (!socket || !userId) return;

    const onNewMessage = (msg: IncomingMessage) => {
      void handleIncomingMessage(msg, msg.conversationId);
    };

    socket.on("new_message", onNewMessage);
    return () => {
      socket.off("new_message", onNewMessage);
    };
  }, [socket, userId, handleIncomingMessage]);

  useEffect(() => {
    const onUpdated = () => {
      void refreshUnread();
    };
    window.addEventListener("dazistar:unread-updated", onUpdated);
    return () => window.removeEventListener("dazistar:unread-updated", onUpdated);
  }, [refreshUnread]);

  const value: UnreadMessagesContextValue = {
    totalUnread,
    refreshUnread,
    setActiveConversationId,
    socket,
    connected,
    connectionStatus,
    connectionError,
  };

  return (
    <UnreadMessagesContext.Provider value={value}>{children}</UnreadMessagesContext.Provider>
  );
}

export function notifyUnreadUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dazistar:unread-updated"));
  }
}
