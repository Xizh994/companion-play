"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "sms", label: "短信登录" },
  { key: "password", label: "密码登录" },
  { key: "emergency", label: "紧急登录" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const LAST_LOGIN_PHONE_KEY = "dazistar_last_login_phone";
const LAST_LOGIN_EMAIL_KEY = "dazistar_last_login_email";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("sms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  const [smsCooldown, setSmsCooldown] = useState(0);

  const [email, setEmail] = useState("");
  const [sendingMagic, setSendingMagic] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  // 从 localStorage 读取上次登录的手机号和邮箱
  useEffect(() => {
    const lastPhone = localStorage.getItem(LAST_LOGIN_PHONE_KEY);
    const lastEmail = localStorage.getItem(LAST_LOGIN_EMAIL_KEY);
    if (lastPhone) setPhone(lastPhone);
    if (lastEmail) setEmail(lastEmail);
  }, []);

  const startCooldown = () => {
    setSmsCooldown(60);
    const timer = setInterval(() => {
      setSmsCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendSms = async () => {
    if (!/^1\d{10}$/.test(phone)) { setError("请输入正确的手机号"); return; }
    setError("");
    setSendingSms(true);
    try {
      const res = await fetch("/api/auth/send-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSendingSms(false);
    }
  };

  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode) { setError("请输入验证码"); return; }
    setError("");
    setLoading(true);
    try {
      const verifyRes = await fetch("/api/auth/verify-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: smsCode, purpose: "login" }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error);

      await login({ phone, loginType: "sms", smsVerifiedToken: verifyData.verifiedToken });
      // 保存手机号到 localStorage
      localStorage.setItem(LAST_LOGIN_PHONE_KEY, phone);
      const redirect = searchParams.get("redirect");
      router.push(redirect || "/lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ phone, password, loginType: "password" });
      // 保存手机号到 localStorage
      localStorage.setItem(LAST_LOGIN_PHONE_KEY, phone);
      const redirect = searchParams.get("redirect");
      router.push(redirect || "/lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!email) { setError("请输入邮箱地址"); return; }
    setError("");
    setSendingMagic(true);
    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMagicSent(true);
      // 保存邮箱到 localStorage
      localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSendingMagic(false);
    }
  };

  const handleSendEmergencyCode = async () => {
    if (!email) { setError("请输入邮箱地址"); return; }
    setError("");
    setSendingMagic(true);
    try {
      const res = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "recovery" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMagicSent(true);
      // 保存邮箱到 localStorage
      localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSendingMagic(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-6 sm:p-8 glow-card">
          <div className="text-center mb-6">
            <span className="text-4xl">🚀</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mt-2">
              搭子星
            </h1>
            <p className="text-gray-400 text-sm mt-1">找到你的最佳游戏搭子</p>
          </div>

          <div className="flex border-b border-white/10 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setError(""); setMagicSent(false); }}
                className={cn(
                  "flex-1 pb-2.5 text-sm font-medium transition-all border-b-2 -mb-[1px]",
                  activeTab === tab.key
                    ? "text-pink-400 border-pink-400"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {activeTab === "sms" && (
            <form onSubmit={handleSmsLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">手机号</label>
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="请输入短信验证码"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendSms}
                    disabled={sendingSms || smsCooldown > 0}
                    className="shrink-0 px-4 py-3 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {smsCooldown > 0 ? `${smsCooldown}s` : sendingSms ? "发送中" : "获取验证码"}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full py-3 rounded-xl font-medium disabled:opacity-50"
              >
                {loading ? "登录中..." : "登录"}
              </button>
              <p className="text-center text-sm text-gray-400">
                没有账号？{" "}
                <Link href="/register" className="text-pink-400 hover:text-pink-300 font-medium">立即注册 →</Link>
              </p>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">手机号</label>
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  密码 <span className="font-normal text-xs text-gray-500">· 如已设置</span>
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
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full py-3 rounded-xl font-medium disabled:opacity-50"
              >
                {loading ? "登录中..." : "登录"}
              </button>
              <div className="text-center text-sm text-gray-400">
                <button
                  type="button"
                  onClick={() => setActiveTab("emergency")}
                  className="text-pink-400 hover:text-pink-300 font-medium"
                >
                  忘记密码？使用紧急登录 →
                </button>
              </div>
              <p className="text-center text-sm text-gray-400">
                没有账号？{" "}
                <Link href="/register" className="text-pink-400 hover:text-pink-300 font-medium">立即注册 →</Link>
              </p>
            </form>
          )}

          {activeTab === "emergency" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-gray-300">
                <strong className="text-amber-400">⚡ 紧急登录</strong> 当手机无法接收短信时使用。输入绑定的邮箱验证身份后登录。
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">绑定邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入注册时绑定的邮箱"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSendEmergencyCode}
                  disabled={sendingMagic}
                  className="flex-1 py-3 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                >
                  {sendingMagic ? "发送中..." : "发送验证码"}
                </button>
                <button
                  type="button"
                  onClick={handleSendMagicLink}
                  disabled={sendingMagic}
                  className="flex-1 btn-gradient py-3 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {sendingMagic ? "发送中..." : "发送 Magic Link"}
                </button>
              </div>
              {magicSent && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center">
                  ✅ 已发送，请查收邮件并点击链接登录
                </div>
              )}
              <p className="text-xs text-gray-500 text-center">
                💡 Magic Link：点击邮件中的链接即可直接登录，更安全便捷
              </p>
              <div className="flex items-center gap-3 my-2">
                <span className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-500">或</span>
                <span className="flex-1 h-px bg-white/10" />
              </div>
              <p className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab("sms")}
                  className="text-gray-400 hover:text-gray-200 transition"
                >
                  ← 返回短信登录
                </button>
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-white/[0.06]">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition">隐私政策</Link>
            <span className="text-gray-600 text-xs">|</span>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition">用户服务协议</Link>
            <span className="text-gray-600 text-xs">|</span>
            <Link href="/minors-protection" className="text-xs text-gray-500 hover:text-gray-300 transition">未成年人保护</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
