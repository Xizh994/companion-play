"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface Message {
  id: string;
  content: string;
  isMine: boolean;
  time: string;
}

const CONTACTS: Record<string, { nickname: string; avatar: string }> = {
  "1": { nickname: "糖糖不甜", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sugar" },
  "2": { nickname: "夜落星河", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=star" },
  "7": { nickname: "小鱼干", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fish" },
  "10": { nickname: "月牙儿", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=crescent" },
  "11": { nickname: "夜精灵", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=elf" },
};

function generateMessages(contactId: string): Message[] {
  const base: Message[] = [
    { id: "m1", content: "你好呀！我是你的专属陪玩师~", isMine: false, time: "14:00" },
    { id: "m2", content: "你好！想打什么游戏呢？", isMine: true, time: "14:01" },
    { id: "m3", content: "王者荣耀怎么样？我打野特别厉害哦", isMine: false, time: "14:02" },
    { id: "m4", content: "好啊，我最近正想上分", isMine: true, time: "14:03" },
    { id: "m5", content: "那没问题！今晚什么时间方便？", isMine: false, time: "14:05" },
    { id: "m6", content: "晚上8点可以吗？", isMine: true, time: "14:06" },
    { id: "m7", content: "可以的，到时候我在大厅等你，记得提前预约哦", isMine: false, time: "14:08" },
    { id: "m8", content: "好的，我现在就下单", isMine: true, time: "14:10" },
    { id: "m9", content: "收到！今晚带你飞，保证上王者 👑", isMine: false, time: "14:11" },
    { id: "m10", content: "好的，今晚见！准备上王者了~", isMine: true, time: "14:12" },
  ];
  return base;
}

export default function ChatWindowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const contact = CONTACTS[id] ?? { nickname: "未知用户", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=default" };
  const [messages, setMessages] = useState<Message[]>(() => generateMessages(id));
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      content: input.trim(),
      isMine: true,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setShowEmoji(false);
  };

  const onEmojiClick = (emojiData: { emoji: string }) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部信息栏 */}
      <div className="glass sticky top-0 z-50 border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          ←
        </button>
        <img src={contact.avatar} alt={contact.nickname} className="w-10 h-10 rounded-xl object-cover" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white">{contact.nickname}</h2>
          <p className="text-xs text-green-400">在线</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-3xl mx-auto w-full">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
            {!msg.isMine && (
              <img src={contact.avatar} alt="" className="w-8 h-8 rounded-lg object-cover mr-2 mt-1 shrink-0" />
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
              msg.isMine
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-md"
                : "bg-white/10 text-gray-200 rounded-bl-md"
            }`}>
              <p className="text-sm leading-relaxed break-words">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.isMine ? "text-pink-200/60 text-right" : "text-gray-500"}`}>{msg.time}</p>
            </div>
            {msg.isMine && (
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=me"
                alt=""
                className="w-8 h-8 rounded-lg object-cover ml-2 mt-1 shrink-0"
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-2">
          <div className="glass rounded-xl overflow-hidden">
            <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={320} searchDisabled skinTonesDisabled />
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="glass sticky bottom-0 border-t border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
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
            className="btn-gradient shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-30 disabled:transform-none disabled:shadow-none"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}