"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeAvatar } from "@/components/GeneratedAvatar";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/useSocket";
import { MessageCircle, Search, Sparkles, Store, Crown, ShieldAlert } from "lucide-react";

interface UserItem {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  status: string;
  role: string;
  shopName?: string | null;
  shopDesc?: string | null;
  playerCount?: number;
  rating?: number | null;
  orderCount?: number;
}

interface LobbyMeta {
  bossVerified: boolean;
  previewLimit: number | null;
  chatRestricted: boolean;
  restrictionMessage: string | null;
}

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";

export default function LobbyPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lobbyMeta, setLobbyMeta] = useState<LobbyMeta | null>(null);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) { router.push("/login"); return; }
    try {
      setCurrentUser(JSON.parse(userStr));
    } catch {}
  }, []);

  const { socket, connected } = useSocket(currentUser?.id || null);

  const fetchUsers = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setLoading(true);
    try {
      const role = currentUser?.role === "BOSS" ? "SHOP" : "BOSS";
      const res = await fetch(`/api/users?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        if (data.meta) setLobbyMeta(data.meta);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleChat = async (targetUser: UserItem) => {
    if (lobbyMeta?.chatRestricted) {
      setChatError(lobbyMeta.restrictionMessage || "请先完成实名认证后再发起聊天");
      return;
    }
    setChatError("");
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId: targetUser.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const { conversation } = data;
      router.push(`/chat/${conversation.id}`);
    } else {
      setChatError(data.error || "发起聊天失败");
    }
  };

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      return (
        u.nickname.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q)) ||
        (u.shopName && u.shopName.toLowerCase().includes(q)) ||
        (u.shopDesc && u.shopDesc.toLowerCase().includes(q))
      );
    });
  }, [users, search]);

  const isBoss = currentUser?.role === "BOSS";
  const bossPreviewMode = isBoss && lobbyMeta?.chatRestricted;

  if (!currentUser) return <div className="min-h-screen flex items-center justify-center"><span className="text-2xl">⏳</span></div>;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 pt-24 pb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            <Sparkles className="inline h-8 w-8 mr-2" />
            {isBoss ? (bossPreviewMode ? "陪玩店预览" : "在线陪玩店") : "在线老板"}
          </h1>
          <p className="text-lg text-gray-400 mb-6">
            {isBoss
              ? bossPreviewMode
                ? "完成实名认证后可浏览全部店铺并发起聊天"
                : "当前在线的陪玩店，即刻联系"
              : "当前已实名的在线老板，主动发起对话"}
            {connected ? <span className="text-green-400 ml-2">● 在线</span> : <span className="text-gray-500 ml-2">● 连接中...</span>}
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={isBoss ? "搜索陪玩店名称..." : "搜索老板昵称..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 rounded-xl py-6"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-8 max-w-7xl mx-auto">
        {bossPreviewMode && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex gap-3 items-start">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-100 space-y-2">
              <p>
                你当前为预览模式，仅展示 {lobbyMeta?.previewLimit ?? 2} 家店铺，且无法发起聊天；店铺用户也无法在大厅看到你。
              </p>
              <Link href="/profile" className="text-pink-400 hover:text-pink-300 font-medium underline">
                前往完成实名认证 →
              </Link>
            </div>
          </div>
        )}

        {chatError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {chatError}
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          {isBoss ? (
            <Store className="h-6 w-6 text-purple-400" />
          ) : (
            <Crown className="h-6 w-6 text-amber-400" />
          )}
          <h2 className="text-2xl font-bold">
            {isBoss ? "陪玩店" : "老板"} ({filtered.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <span className="text-4xl animate-bounce block mb-4">⏳</span>
            <p className="text-gray-400">加载中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🎮</span>
            <p className="text-lg text-muted-foreground">
              {isBoss ? "暂无陪玩店" : "暂无已实名的在线老板"}
            </p>
          </div>
        ) : isBoss ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((user) => (
              <Link
                key={user.id}
                href={`/shop/${user.id}`}
                className="glass rounded-xl p-5 flex flex-col items-center gap-3 text-center hover:border-purple-500/30 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer"
              >
                <SafeAvatar src={user.avatar} seed={user.shopName || user.nickname} size={56} />
                <span className="text-sm font-medium text-white line-clamp-1 w-full">
                  {user.shopName || user.nickname}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((user) => (
              <Card key={user.id} className="group hover:border-purple-500/50 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative shrink-0">
                      <SafeAvatar src={user.avatar} seed={user.shopName || user.nickname} size={48} />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                        user.status === "online" ? "bg-green-500" : "bg-yellow-500"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {user.shopName || user.nickname}
                      </h3>
                      <Badge className={`mt-1 text-xs ${
                        user.role === "SHOP"
                          ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      }`}>
                        {user.role === "SHOP" ? "陪玩店" : "老板"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {user.shopDesc || user.bio || "暂无简介"}
                  </p>
                  <Button
                    onClick={() => handleChat(user)}
                    disabled={lobbyMeta?.chatRestricted}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {lobbyMeta?.chatRestricted ? "需实名后聊天" : isBoss ? "联系店铺" : "发起聊天"}
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
