"use client";

import Link from "next/link";
import { useState } from "react";

interface Conversation {
  id: string;
  nickname: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "1", nickname: "糖糖不甜", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sugar", lastMessage: "好的，今晚见！准备上王者了~", time: "刚刚", unread: 2, online: true },
  { id: "2", nickname: "夜落星河", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=star", lastMessage: "深渊12层我带你打，放心", time: "10分钟前", unread: 0, online: true },
  { id: "7", nickname: "小鱼干", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fish", lastMessage: "和平精英一起吗？三缺一", time: "1小时前", unread: 1, online: true },
  { id: "10", nickname: "月牙儿", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=crescent", lastMessage: "今天状态不太好，改天吧", time: "昨天", unread: 0, online: false },
  { id: "11", nickname: "夜精灵", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=elf", lastMessage: "英雄联盟排位开了，来不来", time: "昨天", unread: 0, online: false },
];

export default function ChatListPage() {
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 左侧会话列表 */}
      <div className="w-full lg:w-80 lg:border-r border-white/10 bg-[#0f0f1a]/50">
        <div className="p-4 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">💬 消息</h1>
          <p className="text-sm text-gray-500 mt-1">{conversations.length} 条会话</p>
        </div>
        <div className="overflow-y-auto">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 ${
                selectedId === conv.id ? "bg-white/10" : ""
              }`}
            >
              <div className="relative shrink-0">
                <img src={conv.avatar} alt={conv.nickname} className="w-12 h-12 rounded-xl object-cover" />
                {conv.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f1a]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">{conv.nickname}</h3>
                  <span className="text-xs text-gray-500 shrink-0">{conv.time}</span>
                </div>
                <p className="text-sm text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="shrink-0 w-5 h-5 bg-pink-500 rounded-full text-white text-xs flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* 右侧空状态 */}
      <div className="flex-1 hidden lg:flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">💬</span>
          <h2 className="text-xl font-bold text-gray-400">选择一个会话开始聊天</h2>
          <p className="text-gray-500 text-sm mt-2">从左侧列表中选择一个陪玩师</p>
        </div>
      </div>
    </div>
  );
}