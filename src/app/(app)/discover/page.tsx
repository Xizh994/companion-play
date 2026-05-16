"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeAvatar } from "@/components/GeneratedAvatar";
import { Search, MessageCircle, Store, Crown, X } from "lucide-react";

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";

interface ShopUser {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  status: string;
  role: string;
  shopName: string | null;
  shopDesc: string | null;
  playerCount: number;
  rating: number | null;
  orderCount: number;
  createdAt: string;
}

interface BossUser {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  status: string;
  role: string;
  createdAt: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [shops, setShops] = useState<ShopUser[]>([]);
  const [bossUsers, setBossUsers] = useState<BossUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return;
    try {
      setCurrentUser(JSON.parse(userStr));
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const role = currentUser.role === "BOSS" ? "SHOP" : "BOSS";
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?role=${role}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (currentUser.role === "BOSS") {
            setShops(data.users);
          } else {
            setBossUsers(data.users);
          }
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUser]);

  const filteredShops = useMemo(() => {
    if (!searchQuery) return shops;
    const q = searchQuery.toLowerCase();
    return shops.filter(
      (s) =>
        (s.shopName && s.shopName.toLowerCase().includes(q)) ||
        (s.shopDesc && s.shopDesc.toLowerCase().includes(q)) ||
        s.nickname.toLowerCase().includes(q)
    );
  }, [shops, searchQuery]);

  const filteredBosses = useMemo(() => {
    if (!searchQuery) return bossUsers;
    const q = searchQuery.toLowerCase();
    return bossUsers.filter(
      (b) =>
        b.nickname.toLowerCase().includes(q) ||
        (b.bio && b.bio.toLowerCase().includes(q))
    );
  }, [bossUsers, searchQuery]);

  const handleChat = async (targetUser: { id: string }) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUserId: targetUser.id }),
    });
    if (res.ok) {
      const { conversation } = await res.json();
      router.push(`/chat/${conversation.id}`);
    }
  };

  const isBoss = currentUser?.role === "BOSS";

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-2xl animate-bounce">🎮</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 pt-32 pb-20">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)",
          }}
        />

        <div className="container relative mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            {isBoss ? "找到靠谱陪玩店" : "发现在线老板"}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            {isBoss
              ? "浏览优质陪玩店，找到最适合你的游戏搭子"
              : "查看当前在线的老板用户，主动联系开启对话"}
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
              <Input
                type="text"
                placeholder={isBoss ? "搜索陪玩店名称、简介..." : "搜索老板昵称、简介..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 py-6 text-lg bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-purple-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {isBoss ? (
        <section className="px-4 py-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Store className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl font-bold">
              陪玩店列表 ({filteredShops.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <span className="text-4xl animate-bounce block mb-4">⏳</span>
              <p className="text-gray-400">加载中...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-20">
              <Store className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <p className="text-lg text-gray-500">
                {searchQuery ? "未找到匹配的陪玩店" : "暂无陪玩店入驻"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredShops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.id}`}
                  className="glass rounded-xl p-5 flex flex-col items-center gap-3 text-center hover:border-purple-500/30 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer"
                >
                  <SafeAvatar
                    src={shop.avatar}
                    seed={shop.shopName || shop.nickname}
                    size={56}
                  />
                  <span className="text-sm font-medium text-white line-clamp-1 w-full">
                    {shop.shopName || shop.nickname}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="px-4 py-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-bold">
              在线老板 ({filteredBosses.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <span className="text-4xl animate-bounce block mb-4">⏳</span>
              <p className="text-gray-400">加载中...</p>
            </div>
          ) : filteredBosses.length === 0 ? (
            <div className="text-center py-20">
              <Crown className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <p className="text-lg text-gray-500">
                {searchQuery ? "未找到匹配的老板" : "暂无在线老板"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBosses.map((boss) => (
                <Card
                  key={boss.id}
                  className="group hover:border-amber-500/50 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <SafeAvatar
                          src={boss.avatar}
                          seed={boss.nickname}
                          size={48}
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg group-hover:text-amber-400 transition-colors truncate">
                          {boss.nickname}
                        </CardTitle>
                        <Badge className="mt-1 bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          老板
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {boss.bio || "这位老板很神秘，什么都没写~"}
                    </p>
                    <Button
                      onClick={() => handleChat(boss)}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      size="sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      联系老板
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
