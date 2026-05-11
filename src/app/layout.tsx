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
      <body className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <span className="text-2xl animate-bounce">🎮</span>
            </div>
          }>
            {children}
          </Suspense>
        </div>
        <Toaster position="top-center" richColors />
        <footer className="flex items-center justify-center py-3 border-t border-white/[0.06] bg-[#060612]/80 backdrop-blur-sm">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-gray-500 hover:text-gray-400 transition-colors no-underline"
          >
            琼ICP备2026006268号
          </a>
        </footer>
      </body>
    </html>
  );
}