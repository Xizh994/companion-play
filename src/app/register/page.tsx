"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Store, Crown, Camera, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "SHOP", label: "店铺", icon: Store, color: "violet", gradient: "from-violet-500 to-purple-500", glow: "shadow-purple-500/25", emoji: "🏪", desc: "经营店铺，接待老板" },
  { value: "BOSS", label: "老板", icon: Crown, color: "amber", gradient: "from-amber-500 to-orange-500", glow: "shadow-amber-500/25", emoji: "👑", desc: "找陪玩店，轻松上分" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState("SHOP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 手机验证
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState("");

  // 基本信息
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 邮箱验证
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerifiedToken, setEmailVerifiedToken] = useState("");

  // 店铺信息
  const [shopName, setShopName] = useState("");
  const [shopBio, setShopBio] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactName, setContactName] = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const activeRole = ROLES.find((r) => r.value === role)!;

  const startCooldown = (setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter(60);
    const timer = setInterval(() => {
      setter((prev: number) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("头像大小不能超过 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // 发送手机验证码
  const handleSendPhoneCode = async () => {
    if (!/^1\d{10}$/.test(phone)) { setError("请输入正确的手机号"); return; }
    setError("");
    setPhoneSending(true);
    try {
      const res = await fetch("/api/auth/send-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "register" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      startCooldown(setPhoneCooldown);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneCode) { setError("请输入验证码"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: phoneCode, purpose: "register" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhoneVerified(true);
      setPhoneVerifiedToken(data.verifiedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    if (!email) { setError("请输入邮箱地址"); return; }
    setError("");
    setEmailSending(true);
    try {
      const res = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "bind" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      startCooldown(setEmailCooldown);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailCode) { setError("请输入验证码"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: emailCode, purpose: "bind" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailVerified(true);
      setEmailVerifiedToken(data.verifiedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phoneVerified) { setError("请先完成手机验证"); return; }
    if (!nickname) { setError("请输入昵称"); return; }
    if (password && password.length < 6) { setError("密码至少6位"); return; }

    setLoading(true);
    try {
      await register({
        phone,
        password: password || undefined,
        role,
        nickname,
        avatar: avatarPreview,
        phoneVerifiedToken,
        email: email || undefined,
        emailVerifiedToken: email ? emailVerifiedToken : undefined,
        shopName: role === "SHOP" ? shopName : undefined,
        shopBio: role === "SHOP" ? shopBio : undefined,
        contactPhone: role === "SHOP" ? contactPhone : undefined,
        contactName: role === "SHOP" ? contactName : undefined,
      });
      router.push("/discover");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = phoneVerified && nickname && (!password || password.length >= 6);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
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
            <p className="text-gray-400 text-sm mt-1">创建你的账号</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* ====== 手机验证 ====== */}
          <div className={cn("mb-5 pb-5 border-b border-white/[0.08]", phoneVerified && "opacity-60 pointer-events-none")}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📱</span>
              <span className="text-sm font-medium text-gray-300">手机验证</span>
              {phoneVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> 已验证
                </span>
              )}
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  placeholder="请输入短信验证码"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                />
                <button
                  type="button"
                  onClick={handleSendPhoneCode}
                  disabled={phoneSending || phoneCooldown > 0 || phoneVerified}
                  className="shrink-0 px-3 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-xs font-medium hover:bg-pink-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {phoneCooldown > 0 ? `${phoneCooldown}s` : phoneSending ? "发送中" : "获取验证码"}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyPhone}
                  disabled={loading || phoneVerified}
                  className={cn(
                    "shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium transition",
                    phoneVerified
                      ? "bg-green-500/20 text-green-400 cursor-default"
                      : "border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-40"
                  )}
                >
                  {phoneVerified ? "已验证" : "验证"}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">验证码 5 分钟有效，收到后请立即验证</p>
            </div>
          </div>

          {/* ====== 选择角色 ====== */}
          <div className="mb-5 pb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">👤</span>
              <span className="text-sm font-medium text-gray-300">选择角色</span>
            </div>
            <div className="flex bg-white/[0.06] border border-white/[0.08] rounded-xl p-1">
              {ROLES.map((r) => {
                const isActive = role === r.value;
                const Icon = r.icon;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all duration-300",
                      isActive
                        ? `bg-gradient-to-r ${r.gradient} text-white shadow-lg ${r.glow}`
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ====== 基本信息 ====== */}
          <div className="mb-5 pb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📝</span>
              <span className="text-sm font-medium text-gray-300">基本信息</span>
            </div>

            <div className="flex flex-col items-center mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative"
              >
                <div
                  className={cn(
                    "w-20 h-20 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-300",
                    avatarPreview
                      ? "border-white/20 ring-2 ring-pink-500/20"
                      : "border-dashed border-white/15 bg-white/5 group-hover:border-pink-400/40 group-hover:bg-white/[0.08]"
                  )}
                >
                  {avatarPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <Camera className="w-6 h-6 text-gray-500 group-hover:text-pink-400 transition-colors" />
                      <span className="text-[9px] text-gray-500">上传头像</span>
                    </div>
                  )}
                </div>
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => setAvatarPreview(null)}
                  className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                  移除头像
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="给自己取个名字"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  设置密码 <span className="font-normal text-gray-500">（可选）</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setShowPassword(!showPassword); if (!showPassword) setPassword(""); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition border mb-2",
                    showPassword
                      ? "border-white/15 bg-white/[0.06] text-gray-300"
                      : "border-dashed border-white/10 text-gray-500 hover:border-pink-500/30 hover:text-pink-400"
                  )}
                >
                  <span>📝</span>
                  {showPassword ? "已设置密码（点击可清除）" : "未设置密码则只能通过短信/邮箱验证码登录"}
                </button>
                {showPassword && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码（至少6位）"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* ====== 绑定邮箱 ====== */}
          <div className={cn("mb-5 pb-5 border-b border-white/[0.08]", emailVerified && "opacity-60 pointer-events-none")}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📧</span>
              <span className="text-sm font-medium text-gray-300">绑定邮箱</span>
              {emailVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> 已验证
                </span>
              )}
            </div>
            <div className="p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg text-xs text-gray-400 mb-3">
              <span className="text-amber-400">⚠️</span> 一个邮箱只能绑定一个账号，获取验证码时会自动检查是否已被占用。
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
              />
              <p className="text-[10px] text-gray-500 mt-1">用于账号找回、紧急登录和接收重要通知</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">邮箱验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  placeholder="请输入验证码"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                />
                <button
                  type="button"
                  onClick={handleSendEmailCode}
                  disabled={emailSending || emailCooldown > 0 || emailVerified || !email}
                  className="shrink-0 px-3 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-xs font-medium hover:bg-pink-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {emailCooldown > 0 ? `${emailCooldown}s` : emailSending ? "发送中" : "获取验证码"}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={loading || emailVerified || !email}
                  className={cn(
                    "shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium transition",
                    emailVerified
                      ? "bg-green-500/20 text-green-400 cursor-default"
                      : "border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-40"
                  )}
                >
                  {emailVerified ? "已验证" : "验证"}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">验证码 5 分钟有效，收到后请立即验证</p>
            </div>
          </div>

          {/* ====== 店铺资质（仅 SHOP） ====== */}
          {role === "SHOP" && (
            <div className="mb-5 pb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📋</span>
                <span className="text-sm font-medium text-gray-300">
                  资质材料 <span className="font-normal text-xs text-gray-500">· 仅店铺需要</span>
                </span>
              </div>
              <div className="p-2.5 bg-blue-500/5 border border-blue-500/15 rounded-lg text-xs text-gray-400 mb-3">
                <span className="text-blue-400">📋</span> 店铺账号需提交营业执照及负责人身份信息供系统初步校验。
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">店铺名称</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="给你的店铺取个名字"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">店铺简介</label>
                  <textarea
                    value={shopBio}
                    onChange={(e) => setShopBio(e.target.value)}
                    placeholder="介绍一下你的店铺，展示你的特色~"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">联系电话</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="店铺联系电话"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">负责人姓名</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="负责人真实姓名"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ====== 提交按钮 ====== */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={cn(
              "w-full py-3 rounded-xl font-medium text-white transition-all duration-300",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "hover:brightness-110 active:scale-[0.98]",
              role === "BOSS"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25"
                : "bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg shadow-purple-500/25"
            )}
          >
            {loading ? "提交中..." : !phoneVerified ? "请先完成手机验证" : `${activeRole.emoji} 立即注册`}
          </button>

          <p className="mt-5 text-center text-sm text-gray-400">
            已有账号？{" "}
            <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">
              立即登录 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
