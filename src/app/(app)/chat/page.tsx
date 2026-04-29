"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { GeneratedAvatar, SafeAvatar } from "@/components/GeneratedAvatar";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface ConversationItem {
  id: string;
  participants: string[];
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
}

interface ChatUser {
  id: string;
  nickname: string;
  avatar: string | null;
  status: string;
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

export default function ChatListPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [contacts, setContacts] = useState<Record<string, ChatUser>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) { router.push("/login"); return; }
    setCurrentUser(JSON.parse(userStr));
  }, []);

  const { socket, connected } = useSocket(currentUser?.id || null);

  // 获取会话列表
  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch("/api/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations);
      // 加载所有联系人信息
      const userIds = new Set<string>();
      data.conversations.forEach((c: ConversationItem) => c.participants.forEach((p) => userIds.add(p)));
      userIds.delete(currentUser?.id);
      // 批量获取用户信息
      const token = localStorage.getItem(TOKEN_KEY);
      for (const uid of userIds) {
        try {
          const ur = await fetch(`/api/users?id=${uid}`, { headers: { Authorization: `Bearer ${token}` } });
          if (ur.ok) {
            const ud = await ur.json();
            if (ud.users?.[0]) setContacts((prev) => ({ ...prev, [uid]: ud.users[0] }));
          }
        } catch {}
      }
    }
  }, [currentUser?.id]);

  // 获取消息
  const fetchMessages = useCallback(async (convId: string) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`/api/conversations/${convId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages.map((m: any) => ({ ...m, isMine: m.fromId === currentUser?.id })));
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) fetchConversations();
  }, [currentUser?.id]);

  // Socket 监听新消息
  useEffect(() => {
    if (!socket || !currentUser?.id) return;
    socket.on("new_message", (msg: any) => {
      if (selectedId) {
        setMessages((prev) => [...prev, { ...msg, isMine: msg.fromId === currentUser.id }]);
      }
      fetchConversations();
    });
  }, [socket, selectedId, currentUser?.id]);

  const handleSelectConv = (convId: string) => {
    setSelectedId(convId);
    fetchMessages(convId);
    // 加入 Socket 房间
    socket?.emit("join_chat", convId);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedId) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`/api/conversations/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: input.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, { ...data.message, isMine: true }]);
      // 通过 Socket 广播给对面
      socket?.emit("private_message", {
        roomId: selectedId,
        message: { ...data.message, isMine: false },
      });
      setInput("");
      setShowEmoji(false);
      fetchConversations();
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
  const contact = otherUserId ? (contacts[otherUserId] || { id: otherUserId, nickname: "用户", avatar: null, status: "offline" }) : null;

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* 左侧会话列表 */}
      <div className="w-full max-w-xs border-r border-white/10 bg-[#0f0f1a]/50 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">💬 消息</h1>
          <p className="text-sm text-gray-500 mt-1">{conversations.length} 条会话 {connected && "🟢"}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const otherId = getOtherParticipantId(conv);
            const u = contacts[otherId];
            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConv(conv.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 ${
                  selectedId === conv.id ? "bg-white/10" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <SafeAvatar src={u?.avatar} seed={otherId} size={48} className="rounded-xl" alt={u?.nickname || "用户"} />
                  {u?.status === "online" && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f1a]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white truncate">{u?.nickname || "用户"}</h3>
                    <span className="text-xs text-gray-500 shrink-0">
                      {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate mt-0.5">{conv.lastMessage || "暂无消息"}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      {selectedConv && contact ? (
        <div className="flex-1 flex flex-col">
          <div className="glass border-b border-white/10 px-4 py-3 flex items-center gap-3">
            <SafeAvatar src={contact.avatar} seed={contact.id} size={40} className="rounded-xl" alt={contact.nickname} />
            <div>
              <h2 className="font-bold text-white">{contact.nickname}</h2>
              <p className="text-xs text-gray-400">ID: {contact.id.slice(-6)}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                {!msg.isMine && (
                  <SafeAvatar src={contact.avatar} seed={contact.id} size={32} className="rounded-lg mr-2 mt-1" />
                )}
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  msg.isMine
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-md"
                    : "bg-white/10 text-gray-200 rounded-bl-md"
                }`}>
                  <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.isMine ? "text-pink-200/60 text-right" : "text-gray-500"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {msg.isMine && (
                  <GeneratedAvatar seed={currentUser?.id || "me"} size={32} className="rounded-lg ml-2 mt-1" />
                )}
              </div>
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
              <button onClick={() => setShowEmoji((v) => !v)}
                className="shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl hover:bg-white/10 transition">
                😊
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="输入消息..."
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 resize-none text-sm"
              />
              <button onClick={handleSend} disabled={!input.trim()}
                className="btn-gradient shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-30">
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
            <p className="text-gray-500 text-sm mt-2">从左侧列表中选择一个陪玩师</p>
          </div>
        </div>
      )}
    </div>
  );
}