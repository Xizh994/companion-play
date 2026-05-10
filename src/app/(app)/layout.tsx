"use client";

import Link from "next/link";
import { usePathname, useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { Crown, Store, User as UserIcon } from "lucide-react";
import { AuthUser } from "@/hooks/useAuth";

const USER_KEY = "dazistar_user";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  iconComponent?: React.ComponentType<{ className?: string }>;
}

const BOSS_NAV: NavItem[] = [
  { href: "/lobby", label: "大厅", icon: "🎯" },
  { href: "/chat", label: "消息", icon: "💬" },
  { href: "/profile", label: "我的", icon: "", iconComponent: UserIcon },
];

const SHOP_NAV: NavItem[] = [
  { href: "/lobby", label: "大厅", icon: "🎯" },
  { href: "/chat", label: "消息", icon: "💬" },
  { href: "/profile", label: "我的", icon: "", iconComponent: UserIcon },
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
  const segment = useSelectedLayoutSegment();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  });

  useEffect(() => {
    const handleStorage = () => {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        try { setUser(JSON.parse(userStr)); } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dazistar_token");
    localStorage.removeItem(USER_KEY);
    document.cookie = "dazistar_token=; path=/; max-age=0";
    router.push("/login");
  };

  const isBoss = user?.role === "BOSS";
  const navItems = isBoss ? BOSS_NAV : SHOP_NAV;

  const getIsActive = (href: string) => {
    if (pathname) {
      return pathname === href || pathname.startsWith(href + "/");
    }
    if (segment) {
      return "/" + segment === href;
    }
    return href === "/lobby";
  };

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/lobby" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent hidden sm:inline">
              搭子星
            </span>
          </Link>

          <nav className="flex items-center gap-1 bg-white/5 rounded-full p-1">
            {navItems.map((item) => {
              const isActive = getIsActive(item.href);
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
                  {item.iconComponent ? <item.iconComponent className="w-4 h-4" /> : <span>{item.icon}</span>}
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
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
