"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/useSocket";
import { MessageCircle, Users, Search, Sparkles } from "lucide-react";

interface MatchUser {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  status: string;
  games: string[];
  services: string[];
  pricePerHour?: number;
}

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";

export default function LobbyPage() {
  const router = useRouter();
  const [users, setUsers] = useState<MatchUser[]>([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 从 localStorage 获取当前用户
  useEffect(() => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) { router.push("/login"); return; }
    setCurrentUser(JSON.parse(userStr));
  }, []);

  const { socket, connected } = useSocket(currentUser?.id || null);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchUsers();
      if (socket) {
        socket.emit("join_lobby");
        socket.on("lobby_users", () => fetchUsers());
        return () => { socket.emit("leave_lobby"); };
      }
    }
  }, [currentUser?.id, socket]);

  const handleChat = async (targetUser: MatchUser) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ targetUserId: targetUser.id }),
    });
    if (res.ok) {
      const { conversation } = await res.json();
      router.push(`/chat/${conversation.id}`);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nickname.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q)) ||
      u.games.some((g) => g.toLowerCase().includes(q)) ||
      u.services.some((s) => s.toLowerCase().includes(q))
    );
  });

  if (!currentUser) return <div className="min-h-screen flex items-center justify-center"><span className="text-2xl">⏳</span></div>;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 pt-24 pb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            <Sparkles className="inline h-8 w-8 mr-2" />
            匹配大厅
          </h1>
          <p className="text-lg text-gray-400 mb-6">
            发现正在寻找搭子的游戏玩家，即刻开始聊天
            {connected ? <span className="text-green-400 ml-2">● 在线</span> : <span className="text-gray-500 ml-2">● 连接中...</span>}
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="搜索陪玩、游戏、服务标签..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 rounded-xl py-6"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold">在线陪玩师 ({filtered.length})</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🎮</span>
            <p className="text-lg text-muted-foreground">暂无在线陪玩师，请稍后再来</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((user) => (
              <Card key={user.id} className="group hover:border-purple-500/50 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-purple-500/50">
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.nickname)}`}
                          alt={user.nickname}
                          className="w-full h-full object-cover"
                        />
                        <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                        user.status === "online" ? "bg-green-500" : "bg-yellow-500"
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{user.nickname}</h3>
                      {user.pricePerHour && (
                        <p className="text-sm text-purple-400">¥{Number(user.pricePerHour)}/小时</p>
                      )}
                    </div>
                  </div>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{user.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {user.games.slice(0, 3).map((g) => (
                      <Badge key={g} variant="outline" className="text-xs border-pink-500/30 text-pink-300">
                        {g}
                      </Badge>
                    ))}
                    {user.services.slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs bg-purple-500/10 text-purple-300 border-purple-500/20">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleChat(user)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="sm"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    发起聊天
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}