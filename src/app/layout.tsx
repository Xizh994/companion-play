import type { Metadata } from "next";
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
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}