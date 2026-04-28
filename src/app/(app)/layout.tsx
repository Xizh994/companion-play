"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn] = useState(true); // 模拟已登录

  const navItems = [
    { href: "/discover", label: "发现", icon: "🔍" },
    { href: "/chat", label: "消息", icon: "💬" },
    { href: "/profile", label: "我的", icon: "👤" },
  ];

  return (
    <div className="min-h-screen">
      {/* 顶部导航栏 */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/discover" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent hidden sm:inline">
              搭子星
            </span>
          </Link>

          {/* 导航链接 */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-pink-500/20 text-pink-400"
                    : "text-gray-300 hover:text-pink-300 hover:bg-white/5"
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 用户头像下拉菜单 */}
          {loggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="w-9 h-9 rounded-xl overflow-hidden border-2 border-pink-500/50 hover:border-pink-500 transition cursor-pointer bg-transparent p-0"
              >
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=me"
                  alt="我"
                  className="w-full h-full object-cover"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-white/10 bg-[#1a1a2e]/95 min-w-[160px]">
                <DropdownMenuItem className="text-gray-200 cursor-pointer" onClick={() => router.push("/profile")}>
                  👤 个人中心
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-200 cursor-pointer" onClick={() => router.push("/chat")}>
                  💬 我的消息
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="text-red-400 cursor-pointer"
                  onClick={() => router.push("/login")}
                >
                  🚪 退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-300 hover:text-white transition">
                登录
              </Link>
              <Link href="/register" className="btn-gradient px-4 py-2 rounded-full text-sm font-medium">
                入驻
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 页面内容 */}
      <main>{children}</main>
    </div>
  );
}