"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopManageLayoutProps {
  title: string;
  subtitle?: string;
  activeTab?: "stats" | "reviews" | "homepage";
  children: React.ReactNode;
}

export function ShopManageLayout({ title, subtitle, activeTab, children }: ShopManageLayoutProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        返回我的
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {activeTab && (
        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-white/10">
          <TabLink href="/profile/shop/stats" active={activeTab === "stats"}>
            经营数据
          </TabLink>
          <TabLink href="/profile/shop/homepage" active={activeTab === "homepage"}>
            主页装修
          </TabLink>
          <TabLink href="/profile/shop/reviews" active={activeTab === "reviews"}>
            评价详情
          </TabLink>
        </div>
      )}

      {children}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex-1 text-center py-2 rounded-lg text-sm font-medium transition",
        active
          ? "bg-gradient-to-r from-violet-600/80 to-purple-600/80 text-white"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      )}
    >
      {children}
    </Link>
  );
}
