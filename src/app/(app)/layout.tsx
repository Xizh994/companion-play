"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { Crown, Store } from "lucide-react";

const USER_KEY = "dazistar_user";

const BOSS_NAV = [
  { href: "/discover", label: "找陪玩店", icon: "🏪" },
  { href: "/lobby", label: "在线陪玩", icon: "🎯" },
  { href: "/chat", label: "消息", icon: "💬" },
];

const SHOP_NAV = [
  { href: "/discover", label: "在线老板", icon: "👑" },
  { href: "/chat", label: "消息", icon: "💬" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-3xl animate-bounce">🎮</span>
          <p className="text-gray-400 text-sm">验证登录状态...</p>
        </div>
      </div>
    }>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AuthGuard>
  );
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dazistar_token");
    localStorage.removeItem(USER_KEY);
    document.cookie = "dazistar_token=; path=/; max-age=0";
    router.push("/login");
  };

  const isBoss = user?.role === "BOSS";
  const navItems = isBoss ? BOSS_NAV : SHOP_NAV;

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/discover" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent hidden sm:inline">
              搭子星
            </span>
          </Link>

          <nav className="flex items-center gap-1 bg-white/5 rounded-full p-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                isBoss
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              }`}>
                {isBoss ? <Crown className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                {isBoss ? "老板" : "陪玩店"}
              </span>
            )}
            <span className="text-sm text-gray-300 hidden sm:inline">{user?.nickname || ""}</span>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-500/10">
              退出
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
