import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "搭子星 - 游戏搭子平台",
  description: "游戏搭子平台，汇聚优质陪玩师与店铺，让游戏不再孤单",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <span className="text-2xl animate-bounce">🎮</span>
          </div>
        }>
          {children}
        </Suspense>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}