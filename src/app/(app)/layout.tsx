"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("dazistar_token");
    setLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dazistar_token");
    localStorage.removeItem("dazistar_user");
    setLoggedIn(false);
    router.push("/login");
  };

  const navItems = [
    { href: "/discover", label: "发现", icon: "🔍" },
    { href: "/lobby", label: "大厅", icon: "🎯" },
    { href: "/chat", label: "消息", icon: "💬" },
    { href: "/profile", label: "我的", icon: "👤" },
  ];

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

          {!loggedIn ? (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-300 hover:text-white transition">登录</Link>
              <Link href="/register" className="btn-gradient px-4 py-2 rounded-full text-sm font-medium">入驻</Link>
            </div>
          ) : (
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">退出</button>
          )}
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}