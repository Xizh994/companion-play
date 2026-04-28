"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: 调用后端 API
    setTimeout(() => {
      setLoading(false);
      toast.success("登录成功！");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-full blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 glow-card">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-4xl">🎮</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mt-2">
              欢迎回来
            </h1>
            <p className="text-gray-400 text-sm mt-1">登录搭子星</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                手机号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-white/5 text-pink-500 focus:ring-pink-500" />
                <span className="text-gray-400">记住我</span>
              </label>
              <Link href="/forgot-password" className="text-pink-400 hover:text-pink-300">
                忘记密码？
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full py-3 rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            还没有账号？{" "}
            <Link href="/register" className="text-pink-400 hover:text-pink-300 font-medium">
              立即入驻
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}