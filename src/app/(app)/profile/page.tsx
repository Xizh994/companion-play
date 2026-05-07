"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Store, Shield, Check, Clock, XCircle, Mail, Phone, Lock, Camera, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();

  const [showRealName, setShowRealName] = useState(false);
  const [realName, setRealName] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);

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
              <div>
                <p className="text-xs text-gray-500">邮箱</p>
                <p className="text-sm text-gray-200">
                  {user.email || "未绑定"}
                  {user.email && (
                    <span className={cn(
                      "ml-1 text-xs",
                      user.emailVerified ? "text-green-400" : "text-amber-400"
                    )}>
                      {user.emailVerified ? "✓ 已验证" : "未验证"}
                    </span>
                  )}
                </p>
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
    </div>
  );
}
