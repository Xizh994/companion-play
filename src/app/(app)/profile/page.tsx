"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Store, Shield, Check, Clock, XCircle, Mail, Phone, Lock, Camera, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  if (name.length <= 2) return name[0] + "***@" + domain;
  return name.slice(0, 2) + "***@" + domain;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();

  const [showRealName, setShowRealName] = useState(false);
  const [realName, setRealName] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<"enter" | "verify-phone" | "enter-new" | "verify-new">("enter");
  const [newEmail, setNewEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState("");
  const [emailVerifiedToken, setEmailVerifiedToken] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const isBinding = !user?.email;

  useEffect(() => {
    if (phoneCountdown <= 0) return;
    const t = setTimeout(() => setPhoneCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneCountdown]);

  useEffect(() => {
    if (emailCountdown <= 0) return;
    const t = setTimeout(() => setEmailCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [emailCountdown]);

  const closeEmailModal = useCallback(() => {
    setEmailModalOpen(false);
    setEmailStep("enter");
    setNewEmail("");
    setPhoneCode("");
    setEmailCode("");
    setPhoneVerifiedToken("");
    setEmailVerifiedToken("");
    setPhoneCodeSent(false);
    setEmailCodeSent(false);
    setPhoneCountdown(0);
    setEmailCountdown(0);
    setEmailError("");
  }, []);

  const handleSendPhoneCode = async () => {
    if (phoneCountdown > 0) return;
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/send-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user?.phone, purpose: "changePhone" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhoneCodeSent(true);
      setPhoneCountdown(60);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneCode) { setEmailError("请输入短信验证码"); return; }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/verify-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user?.phone, code: phoneCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhoneVerifiedToken(data.verifiedToken);
      setEmailStep("enter-new");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    if (emailCountdown > 0) return;
    if (!newEmail) { setEmailError("请输入邮箱地址"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailError("请输入有效的邮箱地址"); return; }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, purpose: "bind" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailCodeSent(true);
      setEmailCountdown(60);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailCode) { setEmailError("请输入验证码"); return; }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, code: emailCode, purpose: "bind" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailVerifiedToken(data.verifiedToken);
      setEmailStep("verify-new");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSubmitBind = async () => {
    if (!emailVerifiedToken) {
      setEmailError("邮箱验证已过期，请重新验证");
      setEmailStep("enter");
      return;
    }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/bind-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, verifiedToken: emailVerifiedToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshUser();
      closeEmailModal();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSubmitChange = async () => {
    if (!phoneVerifiedToken) {
      setEmailError("手机验证已过期，请重新验证");
      setEmailStep("verify-phone");
      return;
    }
    if (!emailVerifiedToken) {
      setEmailError("邮箱验证已过期，请重新验证");
      setEmailStep("enter-new");
      return;
    }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, phoneVerifiedToken, emailVerifiedToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshUser();
      closeEmailModal();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  if (!user) return null;

  const rn = user.realNameVerification;

  const handleRealNameSubmit = async () => {
    setVerifyError("");
    if (!realName) { setVerifyError("请输入真实姓名"); return; }
    if (!idCardNumber) { setVerifyError("请输入身份证号"); return; }
    if (!/^\d{17}[\dXx]$/.test(idCardNumber)) { setVerifyError("身份证号格式不正确"); return; }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realName, idCardNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerifySuccess(true);
      await refreshUser();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : String(err));
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = () => {
    if (!rn) {
      return { icon: null, text: "未认证", color: "text-gray-500 bg-gray-500/10" };
    }
    switch (rn.status) {
      case "APPROVED":
        return { icon: Check, text: "已认证", color: "text-green-400 bg-green-500/10" };
      case "REJECTED":
        return { icon: XCircle, text: "已拒绝", color: "text-red-400 bg-red-500/10" };
      default:
        return { icon: Clock, text: "审核中", color: "text-amber-400 bg-amber-500/10" };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]">
      <div className="max-w-md mx-auto px-4 py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回</span>
        </button>

        <div className="glass rounded-3xl p-6 sm:p-8 glow-card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <Image src={user.avatar} alt="头像" fill className="object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-gray-600" />
              )}
            </div>
            <h1 className="text-xl font-bold text-white">{user.nickname}</h1>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                user.role === "BOSS"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-violet-500/10 text-violet-400"
              )}>
                {user.role === "BOSS" ? <Crown className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                {user.role === "BOSS" ? "老板" : "店铺"}
              </span>

              {rn && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                  statusBadge.color
                )}>
                  {StatusIcon && <StatusIcon className="w-3 h-3" />}
                  {statusBadge.text}
                </span>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="mb-6 p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 mb-1">账号信息</h2>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">手机号</p>
                <p className="text-sm text-gray-200">{user.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">邮箱</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-200 truncate">
                    {user.email ? maskEmail(user.email) : "未绑定"}
                    {user.email && (
                      <span className={cn(
                        "ml-1 text-xs",
                        user.emailVerified ? "text-green-400" : "text-amber-400"
                      )}>
                        {user.emailVerified ? "✓ 已验证" : "未验证"}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => {
                      setEmailStep(isBinding ? "enter" : "enter");
                      setEmailModalOpen(true);
                    }}
                    className="text-xs text-pink-400 hover:text-pink-300 shrink-0"
                  >
                    {isBinding ? "绑定邮箱" : "更换"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-gray-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">登录密码</p>
                <p className="text-sm text-gray-200">
                  {user.hasPassword ? (
                    <button
                      onClick={() => router.push("/change-password")}
                      className="text-pink-400 hover:text-pink-300 transition"
                    >
                      修改密码 →
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/change-password")}
                      className="text-pink-400 hover:text-pink-300 transition"
                    >
                      设置密码 →
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Real Name Verification (BOSS only) */}
          {user.role === "BOSS" && (
            <div className="mb-6 p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-pink-400" />
                <h2 className="text-sm font-semibold text-gray-300">实名认证</h2>
              </div>

              {rn && (
                <div className={cn(
                  "p-3 rounded-xl text-sm mb-3",
                  rn.status === "APPROVED" ? "bg-green-500/10 border border-green-500/20" :
                  rn.status === "REJECTED" ? "bg-red-500/10 border border-red-500/20" :
                  "bg-amber-500/10 border border-amber-500/20"
                )}>
                  <p className={cn(
                    "text-xs",
                    rn.status === "APPROVED" ? "text-green-400" :
                    rn.status === "REJECTED" ? "text-red-400" :
                    "text-amber-400"
                  )}>
                    {rn.status === "APPROVED" && "✅ 实名认证已通过"}
                    {rn.status === "REJECTED" && "❌ 实名认证未通过，请重新提交"}
                    {rn.status === "PENDING" && "⏳ 实名认证审核中，请耐心等待"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">姓名：{rn.realName}</p>
                </div>
              )}

              {(!rn || rn.status === "REJECTED") && (
                <>
                  {!showRealName ? (
                    <button
                      onClick={() => setShowRealName(true)}
                      className="w-full py-2.5 rounded-xl border border-dashed border-white/15 text-gray-400 text-sm hover:border-pink-400/40 hover:text-pink-400 transition"
                    >
                      {rn ? "重新提交实名认证" : "立即实名认证"}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">真实姓名</label>
                        <input
                          type="text"
                          value={realName}
                          onChange={(e) => setRealName(e.target.value)}
                          placeholder="请输入真实姓名"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">身份证号</label>
                        <input
                          type="text"
                          value={idCardNumber}
                          onChange={(e) => setIdCardNumber(e.target.value)}
                          placeholder="请输入身份证号"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">身份证号经 AES-256 加密后存储，仅用于身份核验</p>
                      </div>

                      {verifyError && (
                        <p className="text-xs text-red-400">{verifyError}</p>
                      )}
                      {verifySuccess && (
                        <p className="text-xs text-green-400">提交成功，请等待审核</p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={handleRealNameSubmit}
                          disabled={verifying}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {verifying ? "提交中..." : "提交认证"}
                        </button>
                        <button
                          onClick={() => setShowRealName(false)}
                          className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition"
          >
            退出登录
          </button>
        </div>
      </div>

      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#12122a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">
                {isBinding ? "绑定邮箱" : "更换邮箱"}
              </h3>
              <button onClick={closeEmailModal} className="text-gray-400 hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isBinding ? (
              <div className="space-y-4">
                {emailStep === "enter" && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">新邮箱地址</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="请输入要绑定的邮箱"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                      />
                    </div>
                    {emailCodeSent && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">验证码</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={emailCode}
                            onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="6位验证码"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!emailCodeSent ? (
                        <button
                          onClick={handleSendEmailCode}
                          disabled={emailLoading || !newEmail}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {emailLoading ? "发送中..." : emailCountdown > 0 ? `${emailCountdown}秒后重发` : "发送验证码"}
                        </button>
                      ) : (
                        <button
                          onClick={handleVerifyEmail}
                          disabled={emailLoading || emailCode.length < 6}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {emailLoading ? "验证中..." : "验证邮箱"}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {emailStep === "verify-new" && (
                  <>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400">✓ 邮箱 {newEmail} 验证通过</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEmailStep("enter");
                          setEmailCode("");
                          setEmailCodeSent(false);
                          setEmailCountdown(0);
                          setEmailVerifiedToken("");
                          setEmailError("");
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                      >
                        返回修改
                      </button>
                      <button
                        onClick={handleSubmitBind}
                        disabled={emailLoading}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                      >
                        {emailLoading ? "绑定中..." : "确认绑定"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {emailStep === "enter" && (
                  <>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <p className="text-xs text-gray-400">当前邮箱</p>
                      <p className="text-sm text-gray-200 mt-0.5">{user?.email ? maskEmail(user.email) : "未绑定"}</p>
                    </div>
                    <button
                      onClick={() => setEmailStep("verify-phone")}
                      className="w-full py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition"
                    >
                      开始更换
                    </button>
                  </>
                )}

                {emailStep === "verify-phone" && (
                  <>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <p className="text-xs text-gray-400">手机号</p>
                      <p className="text-sm text-gray-200 mt-0.5">{user?.phone || ""}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">短信验证码</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="请输入短信验证码"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSendPhoneCode}
                        disabled={emailLoading || phoneCountdown > 0}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition disabled:opacity-40"
                      >
                        {phoneCodeSent ? (phoneCountdown > 0 ? `${phoneCountdown}秒后重发` : "重新发送") : "发送验证码"}
                      </button>
                      <button
                        onClick={handleVerifyPhone}
                        disabled={emailLoading || phoneCode.length < 6}
                        className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                      >
                        {emailLoading ? "验证中..." : "验证手机"}
                      </button>
                    </div>
                    <button
                      onClick={() => setEmailStep("enter")}
                      className="w-full py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                    >
                      返回
                    </button>
                  </>
                )}

                {emailStep === "enter-new" && (
                  <>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400">✓ 手机验证通过</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">新邮箱地址</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="请输入新邮箱"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                      />
                    </div>
                    {emailCodeSent && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">新邮箱验证码</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="6位验证码"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!emailCodeSent ? (
                        <button
                          onClick={handleSendEmailCode}
                          disabled={emailLoading || !newEmail}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {emailLoading ? "发送中..." : emailCountdown > 0 ? `${emailCountdown}秒后重发` : "发送验证码"}
                        </button>
                      ) : (
                        <button
                          onClick={handleVerifyEmail}
                          disabled={emailLoading || emailCode.length < 6}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {emailLoading ? "验证中..." : "验证邮箱"}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {emailStep === "verify-new" && (
                  <>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400">✓ 手机验证通过</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400">✓ 新邮箱 {newEmail} 验证通过</p>
                    </div>
                    <button
                      onClick={handleSubmitChange}
                      disabled={emailLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                    >
                      {emailLoading ? "更换中..." : "确认更换"}
                    </button>
                  </>
                )}
              </div>
            )}

            {emailError && (
              <p className="mt-3 text-xs text-red-400">{emailError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
