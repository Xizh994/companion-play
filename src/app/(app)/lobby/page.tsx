"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeAvatar } from "@/components/GeneratedAvatar";
import { Input } from "@/components/ui/input";
import { useUnreadMessages } from "@/contexts/UnreadMessagesContext";
import { RealtimeConnectionStatus } from "@/components/RealtimeConnectionStatus";
import { MessageCircle, Search, Sparkles, Store, Crown, ShieldAlert } from "lucide-react";
import { ShopGameFilterChips } from "@/components/ShopGameFilterChips";
import { LobbyHotShopsSection, type HotShopItem } from "@/components/LobbyHotShopsSection";

interface UserItem {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  status: string;
  role: string;
  shopName?: string | null;
  shopDesc?: string | null;
  shopGames?: string[];
  playerCount?: number;
  rating?: number | null;
  orderCount?: number;
  reviewCount?: number;
}

interface LobbyMeta {
  bossVerified?: boolean;
  shopVerified?: boolean;
  previewLimit: number | null;
  chatRestricted: boolean;
  restrictionMessage: string | null;
  hotRankingDate?: string | null;
}

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";

export default function LobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopVerifyPending = searchParams.get("shopVerifyPending") === "1";
  const initialGame = searchParams.get("game") || "";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [hotShops, setHotShops] = useState<HotShopItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState(initialGame);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lobbyMeta, setLobbyMeta] = useState<LobbyMeta | null>(null);
  const [chatError, setChatError] = useState("");
  const [dismissShopVerifyBanner, setDismissShopVerifyBanner] = useState(false);

  const isBoss = currentUser?.role === "BOSS";
  const isShop = currentUser?.role === "SHOP";

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

  useEffect(() => {
    if (!isBoss) return;
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, isBoss]);

  const { socket, connected, connectionStatus, connectionError } = useUnreadMessages();

  const fetchUsers = useCallback(
    async (silent = false) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || !currentUser?.id) return;
      if (!silent) setLoading(true);
      try {
        const role = isBoss ? "SHOP" : "BOSS";
        const params = new URLSearchParams({ role });
        if (isBoss) {
          if (debouncedSearch) params.set("search", debouncedSearch);
          if (selectedGame) params.set("game", selectedGame);
        }
        const res = await fetch(`/api/users?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
          setHotShops(Array.isArray(data.hotShops) ? data.hotShops : []);
          if (data.meta) setLobbyMeta(data.meta);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [currentUser?.id, isBoss, debouncedSearch, selectedGame]
  );

  useEffect(() => {
    if (currentUser?.id) fetchUsers();
  }, [currentUser?.id, fetchUsers]);

  useEffect(() => {
    if (connected && currentUser?.id) fetchUsers(true);
  }, [connected, currentUser?.id, fetchUsers]);

  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    socket.emit("join_lobby");
    const onLobbyChange = () => fetchUsers(true);
    socket.on("lobby_users", onLobbyChange);

    return () => {
      socket.off("lobby_users", onLobbyChange);
      socket.emit("leave_lobby");
    };
  }, [socket, currentUser?.id, fetchUsers]);

  const setGameFilter = (game: string) => {
    const next = selectedGame === game ? "" : game;
    setSelectedGame(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("game", next);
    else params.delete("game");
    const qs = params.toString();
    router.replace(qs ? `/lobby?${qs}` : "/lobby", { scroll: false });
  };

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

  const shopFiltered = useMemo(() => {
    if (isBoss || !search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      return (
        u.nickname.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
      );
    });
  }, [users, search, isBoss]);

  const displayUsers = isBoss ? users : shopFiltered;

  const bossPreviewMode = isBoss && lobbyMeta?.chatRestricted;
  const shopRestrictedMode = isShop && lobbyMeta?.chatRestricted;
  const showShopVerifyBanner =
    isShop && shopVerifyPending && !dismissShopVerifyBanner && shopRestrictedMode;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-2xl">⏳</span>
      </div>
    );
  }

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
              : shopRestrictedMode
                ? "完成店铺认证并通过核验后，方可在大厅展示并与老板聊天"
                : "当前在线的老板，主动发起对话"}
            <RealtimeConnectionStatus
              status={connectionStatus}
              className="ml-2"
              title={connectionError ?? undefined}
            />
          </p>
          <div className="max-w-3xl mx-auto w-full px-2 space-y-4">
            <div className="relative max-w-xl mx-auto w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={isBoss ? "搜索店名、简介、游戏…" : "搜索老板昵称..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 bg-white/5 border-white/10 rounded-xl py-6"
              />
            </div>
            {isBoss && (
              <ShopGameFilterChips
                selectedGame={selectedGame}
                onSelect={setGameFilter}
                className="pt-1"
              />
            )}
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

        {showShopVerifyBanner && (
          <div className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 flex gap-3 items-start">
            <ShieldAlert className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-violet-100 space-y-2">
              <p>
                注册成功！请前往「我的」→「店铺认证」手动点击「开始核验」。核验通过后店铺才会在大厅展示并可与老板聊天（注册时不会自动核验）。
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <Link href="/profile" className="text-pink-400 hover:text-pink-300 font-medium underline">
                  前往店铺认证 →
                </Link>
                <button
                  type="button"
                  onClick={() => setDismissShopVerifyBanner(true)}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  知道了
                </button>
              </div>
            </div>
          </div>
        )}

        {shopRestrictedMode && !showShopVerifyBanner && (
          <div className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 flex gap-3 items-start">
            <ShieldAlert className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="text-sm text-violet-100 space-y-2">
              <p>{lobbyMeta?.restrictionMessage}</p>
              <Link href="/profile" className="text-pink-400 hover:text-pink-300 font-medium underline">
                前往店铺认证并发起核验 →
              </Link>
            </div>
          </div>
        )}

        {chatError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {chatError}
          </div>
        )}

        {isBoss && !loading && (
          <LobbyHotShopsSection
            shops={hotShops}
            rankingDate={lobbyMeta?.hotRankingDate ?? null}
            hasFilters={Boolean(selectedGame || debouncedSearch)}
          />
        )}

        <div className="flex items-center gap-2 mb-6">
          {isBoss ? (
            <Store className="h-6 w-6 text-purple-400" />
          ) : (
            <Crown className="h-6 w-6 text-amber-400" />
          )}
          <h2 className="text-2xl font-bold">
            {isBoss ? "陪玩店" : "老板"} ({displayUsers.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <span className="text-4xl animate-bounce block mb-4">⏳</span>
            <p className="text-gray-400">加载中...</p>
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🎮</span>
            <p className="text-lg text-muted-foreground">
              {isBoss
                ? selectedGame || debouncedSearch
                  ? "没有符合条件的在线店铺"
                  : "暂无陪玩店"
                : "暂无在线老板"}
            </p>
            {isBoss && (selectedGame || debouncedSearch) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setSelectedGame("");
                  router.replace("/lobby", { scroll: false });
                }}
                className="mt-4 text-sm text-purple-400 hover:text-purple-300"
              >
                清除筛选
              </button>
            )}
          </div>
        ) : isBoss ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayUsers.map((user) => (
              <Link
                key={user.id}
                href={`/shop/${user.id}`}
                className="glass rounded-xl p-5 flex flex-col items-center gap-3 text-center hover:border-purple-500/30 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer"
              >
                <SafeAvatar src={user.avatar} seed={user.shopName || user.nickname} size={56} />
                <span className="text-sm font-medium text-white line-clamp-1 w-full">
                  {user.shopName || user.nickname}
                </span>
                {(user.rating != null || (user.reviewCount ?? 0) > 0) && (
                  <span className="text-xs text-yellow-400/90">
                    {user.rating != null ? `★ ${Number(user.rating).toFixed(1)}` : "★ —"}
                    {(user.reviewCount ?? 0) > 0 && (
                      <span className="text-gray-500 ml-1">{user.reviewCount} 评</span>
                    )}
                  </span>
                )}
                {user.shopGames && user.shopGames.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 w-full">
                    {user.shopGames.slice(0, 2).map((g) => (
                      <span
                        key={g}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/15 text-purple-300 border border-purple-500/20"
                      >
                        {g}
                      </span>
                    ))}
                    {user.shopGames.length > 2 && (
                      <span className="text-[10px] text-gray-500">+{user.shopGames.length - 2}</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayUsers.map((user) => (
              <Card key={user.id} className="group hover:border-purple-500/50 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative shrink-0">
                      <SafeAvatar src={user.avatar} seed={user.shopName || user.nickname} size={48} />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                          user.status === "online" ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {user.shopName || user.nickname}
                      </h3>
                      <Badge
                        className={`mt-1 text-xs ${
                          user.role === "SHOP"
                            ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        }`}
                      >
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
                    {lobbyMeta?.chatRestricted
                      ? isShop
                        ? "需认证后聊天"
                        : "需实名后聊天"
                      : "发起聊天"}
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
