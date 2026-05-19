"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUnreadMessages, notifyUnreadUpdated } from "@/contexts/UnreadMessagesContext";
import { GeneratedAvatar, SafeAvatar } from "@/components/GeneratedAvatar";
import { Trash2 } from "lucide-react";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface ConversationItem {
  id: string;
  participants: string[];
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
  unreadCount?: number;
}

interface ChatUser {
  id: string;
  nickname: string;
  avatar: string | null;
  status: string;
  role: string;
}

interface ChatMessage {
  id: string;
  content: string;
  fromId: string;
  type: string;
  createdAt: string;
  isMine: boolean;
}

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ChatListPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [contacts, setContacts] = useState<Record<string, ChatUser>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role?: string } | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const contactsRef = useRef<Record<string, ChatUser>>({});

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) {
      router.push("/login");
      return;
    }
    try {
      setCurrentUser(JSON.parse(userStr));
    } catch {
      router.push("/login");
    }
  }, [router]);

  const { socket, connected, refreshUnread, setActiveConversationId } = useUnreadMessages();
  const searchParams = useSearchParams();

  useEffect(() => {
    setActiveConversationId(selectedId);
    return () => setActiveConversationId(null);
  }, [selectedId, setActiveConversationId]);

  const loadContacts = useCallback(async (userIds: string[]) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const missing = userIds.filter((id) => !contactsRef.current[id]);
    if (!token || missing.length === 0) return;

    try {
      const res = await fetch(`/api/users?ids=${missing.join(",")}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) return;
      const data = await res.json();
      const next: Record<string, ChatUser> = {};
      for (const u of data.users || []) {
        next[u.id] = {
          id: u.id,
          nickname: u.nickname,
          avatar: u.avatar,
          status: u.status,
          role: u.role,
        };
      }
      setContacts((prev) => ({ ...prev, ...next }));
    } catch {
      // ignore
    }
  }, []);

  const markConversationRead = useCallback(async (convId: string) => {
    const token = localStorage.getItem(TOKEN_KEY);
    await fetch(`/api/conversations/${convId}/read`, {
      method: "POST",
      headers: authHeaders(token),
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
    await refreshUnread();
    notifyUnreadUpdated();
  }, [refreshUnread]);

  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch("/api/conversations", {
      headers: authHeaders(token),
    });
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations);
    const userIds = new Set<string>();
    data.conversations.forEach((c: ConversationItem) =>
      c.participants.forEach((p) => {
        if (p !== currentUser?.id) userIds.add(p);
      })
    );
    await loadContacts(Array.from(userIds));
  }, [currentUser?.id, loadContacts]);

  const fetchMessages = useCallback(
    async (convId: string) => {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        headers: authHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.messages.map((m: { id: string; content: string; fromId: string; type: string; createdAt: string }) => ({
            ...m,
            isMine: m.fromId === currentUser?.id,
          }))
        );
        await markConversationRead(convId);
      }
    },
    [currentUser?.id, markConversationRead]
  );

  useEffect(() => {
    if (currentUser?.id) fetchConversations();
  }, [currentUser?.id, fetchConversations]);

  useEffect(() => {
    const convId = searchParams.get("conv");
    if (!convId || conversations.length === 0 || selectedId === convId) return;
    if (conversations.some((c) => c.id === convId)) {
      setSelectedId(convId);
      fetchMessages(convId);
      socket?.emit("join_chat", convId);
    }
  }, [searchParams, conversations, selectedId, fetchMessages, socket]);

  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    const onNewMessage = (msg: {
      id: string;
      content: string;
      fromId: string;
      type?: string;
      createdAt: string;
    }) => {
      const activeConvId = selectedIdRef.current;
      const isMine = msg.fromId === currentUser.id;

      if (activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [
            ...prev,
            {
              id: msg.id,
              content: msg.content,
              fromId: msg.fromId,
              type: msg.type || "text",
              createdAt: msg.createdAt,
              isMine,
            },
          ];
        });
        if (!isMine) {
          markConversationRead(activeConvId);
        }
      }

      void fetchConversations();
      notifyUnreadUpdated();
    };

    socket.on("new_message", onNewMessage);
    return () => {
      socket.off("new_message", onNewMessage);
    };
  }, [socket, currentUser?.id, markConversationRead, fetchConversations]);

  const handleSelectConv = (convId: string) => {
    setSelectedId(convId);
    fetchMessages(convId);
    socket?.emit("join_chat", convId);
    router.replace(`/chat?conv=${convId}`, { scroll: false });
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedId) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`/api/conversations/${selectedId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ content: input.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      const msg = data.message;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [
          ...prev,
          {
            id: msg.id,
            content: msg.content,
            fromId: msg.fromId,
            type: msg.type,
            createdAt: msg.createdAt,
            isMine: true,
          },
        ];
      });
      setInput("");
      setShowEmoji(false);
      fetchConversations();
      notifyUnreadUpdated();
    }
  };

  const handleDeleteConv = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定删除该会话？聊天记录将保留，重新发起聊天后可查看。")) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`/api/conversations/${convId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selectedId === convId) {
        setSelectedId(null);
        setMessages([]);
        router.replace("/chat", { scroll: false });
      }
    }
  };

  const onEmojiClick = (emojiData: { emoji: string }) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const getOtherParticipantId = (conv: ConversationItem) => {
    return conv.participants.find((p) => p !== currentUser?.id) || conv.participants[0];
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);
  const otherUserId = selectedConv ? getOtherParticipantId(selectedConv) : null;
  const contact = otherUserId
    ? contacts[otherUserId] || {
        id: otherUserId,
        nickname: "用户",
        avatar: null,
        status: "offline",
        role: "BOSS",
      }
    : null;
  const isBossViewingShop = currentUser?.role === "BOSS" && contact?.role === "SHOP";
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <ChatSidebar
        conversations={conversations}
        contacts={contacts}
        selectedId={selectedId}
        connected={connected}
        totalUnread={totalUnread}
        getOtherParticipantId={getOtherParticipantId}
        onSelect={handleSelectConv}
        onDelete={handleDeleteConv}
      />

      {selectedConv && contact ? (
        <div className="flex-1 flex flex-col">
          <div className="glass border-b border-white/10 px-4 py-3 flex items-center gap-3">
            {isBossViewingShop ? (
              <button
                onClick={() => router.push(`/shop/${contact.id}`)}
                className="shrink-0 hover:opacity-80 transition-opacity"
                title="查看店铺详情"
              >
                <SafeAvatar src={contact.avatar} seed={contact.id} size={40} alt={contact.nickname} />
              </button>
            ) : (
              <SafeAvatar src={contact.avatar} seed={contact.id} size={40} alt={contact.nickname} />
            )}
            <div>
              <h2 className="font-bold text-white">{contact.nickname}</h2>
              <p className="text-xs text-gray-400">ID: {contact.id.slice(-6)}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                contact={contact}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>

          {showEmoji && (
            <div className="px-4 pb-2">
              <div className="glass rounded-xl overflow-hidden">
                <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={320} searchDisabled skinTonesDisabled />
              </div>
            </div>
          )}

          <div className="glass border-t border-white/10 px-4 py-3">
            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowEmoji((v) => !v)}
                className="shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl hover:bg-white/10 transition"
              >
                😊
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="输入消息..."
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 resize-none text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="btn-gradient shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-30"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl block mb-4">💬</span>
            <h2 className="text-xl font-bold text-gray-400">选择一个会话开始聊天</h2>
            <p className="text-gray-500 text-sm mt-2">从左侧列表中选择联系人</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageRow({
  msg,
  contact,
  currentUserId,
}: {
  msg: ChatMessage;
  contact: ChatUser;
  currentUserId?: string;
}) {
  return (
    <div className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
      {!msg.isMine && <SafeAvatar src={contact.avatar} seed={contact.id} size={32} className="mr-2 mt-1" />}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
          msg.isMine
            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-md"
            : "bg-white/10 text-gray-200 rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed break-words">{msg.content}</p>
        <p className={`text-[10px] mt-1 ${msg.isMine ? "text-pink-200/60 text-right" : "text-gray-500"}`}>
          {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {msg.isMine && <GeneratedAvatar seed={currentUserId || "me"} size={32} className="ml-2 mt-1" />}
    </div>
  );
}

function ChatSidebar({
  conversations,
  contacts,
  selectedId,
  connected,
  totalUnread,
  getOtherParticipantId,
  onSelect,
  onDelete,
}: {
  conversations: ConversationItem[];
  contacts: Record<string, ChatUser>;
  selectedId: string | null;
  connected: boolean;
  totalUnread: number;
  getOtherParticipantId: (conv: ConversationItem) => string;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <div className="w-full max-w-xs border-r border-white/10 bg-[#0f0f1a]/50 flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">💬 消息</h1>
          {totalUnread > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-pink-500 text-white text-xs font-medium flex items-center justify-center">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {conversations.length} 条会话 {connected ? "🟢" : "○ 连接中"}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const otherId = getOtherParticipantId(conv);
          const u = contacts[otherId];
          const unread = conv.unreadCount || 0;
          return (
            <div
              key={conv.id}
              className={`relative group w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 cursor-pointer ${
                selectedId === conv.id ? "bg-white/10" : ""
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="relative shrink-0">
                <SafeAvatar src={u?.avatar} seed={otherId} size={48} alt={u?.nickname || "用户"} />
                {u?.status === "online" && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f1a]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <ConvMeta conv={conv} u={u} unread={unread} />
              </div>
              <button
                onClick={(e) => onDelete(conv.id, e)}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-all"
                title="删除会话"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConvMeta({
  conv,
  u,
  unread,
}: {
  conv: ConversationItem;
  u?: ChatUser;
  unread: number;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h3 className={`font-medium truncate ${unread > 0 ? "text-white" : "text-white/90"}`}>
          {u?.nickname || "用户"}
        </h3>
        <span className="text-xs text-gray-500 shrink-0">
          {conv.lastMessageAt
            ? new Date(conv.lastMessageAt).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <p className={`text-sm truncate ${unread > 0 ? "text-gray-200 font-medium" : "text-gray-400"}`}>
          {conv.lastMessage || "暂无消息"}
        </p>
        {unread > 0 && (
          <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>
    </>
  );
}
