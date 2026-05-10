"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, Shield, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type VerifyMethod = "sms" | "email";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const isFirstTime = !user?.hasPassword;

  const [method, setMethod] = useState<VerifyMethod>("sms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Step 1: 身份验证
  const [verified, setVerified] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState("");
  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // 首次设置密码时，自动填充当前用户的手机号和邮箱
  useEffect(() => {
    if (isFirstTime && user) {
      if (method === "sms" && user.phone) {
        setTarget(user.phone);
      } else if (method === "email" && user.email) {
        setTarget(user.email);
      }
    }
  }, [isFirstTime, user, method]);

  // Step 2: 新密码
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (method === "sms" && !/^1\d{10}$/.test(target)) { setError("请输入正确的手机号"); return; }
    if (method === "email" && !target) { setError("请输入邮箱地址"); return; }
    setError("");
    setSending(true);
    try {
      const endpoint = method === "sms" ? "/api/auth/send-sms-code" : "/api/auth/send-email-code";
      const body = method === "sms"
        ? { phone: target, purpose: "login" }
        : { email: target, purpose: "change_pwd" };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!code) { setError("请输入验证码"); return; }
    setError("");
    setLoading(true);
    try {
      const endpoint = method === "sms" ? "/api/auth/verify-sms-code" : "/api/auth/verify-email-code";
      const body = method === "sms"
        ? { phone: target, code, purpose: "change_pwd" }
        : { email: target, code, purpose: "change_pwd" };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerified(true);
      setVerifiedToken(data.verifiedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) { setError("新密码至少6位"); return; }
    if (newPassword !== confirmPassword) { setError("两次输入的密码不一致"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword,
          emailVerifiedToken: method === "email" ? verifiedToken : undefined,
          smsVerifiedToken: method === "sms" ? verifiedToken : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

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
          <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h1 className="text-xl font-bold text-white mt-2">修改密码</h1>
            <p className="text-gray-400 text-sm mt-1">
              {user?.hasPassword ? "需要验证身份后才能修改密码" : "首次设置密码，无需验证旧密码"}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">密码修改成功</h2>
              <p className="text-gray-400 text-sm mb-6">请使用新密码重新登录</p>
              <button
                onClick={() => router.push("/login")}
                className="btn-gradient w-full py-3 rounded-xl font-medium"
              >
                返回登录
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: 身份验证 */}
              {!verified && (
                <div className="mb-6 pb-6 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium text-gray-300">身份验证</span>
                  </div>

                  <div className="flex bg-white/[0.06] border border-white/[0.08] rounded-xl p-1 mb-4">
                    <button
                      type="button"
                      onClick={() => { setMethod("sms"); setTarget(""); setCode(""); setError(""); }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                        method === "sms"
                          ? "bg-pink-500/20 text-pink-400"
                          : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      📱 短信验证
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMethod("email"); setTarget(""); setCode(""); setError(""); }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                        method === "email"
                          ? "bg-pink-500/20 text-pink-400"
                          : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      📧 邮箱验证
                    </button>
                  </div>

                  <div className="space-y-3">
                    {!isFirstTime && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          {method === "sms" ? "手机号" : "绑定邮箱"}
                        </label>
                        <input
                          type={method === "sms" ? "tel" : "email"}
                          value={target}
                          onChange={(e) => setTarget(e.target.value)}
                          placeholder={method === "sms" ? "请输入手机号" : "请输入绑定的邮箱"}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                        />
                      </div>
                    )}
                    {isFirstTime && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          {method === "sms" ? "手机号" : "绑定邮箱"}
                        </label>
                        <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-gray-400 text-sm">
                          {method === "sms" ? (
                            user?.phone ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}` : ""
                          ) : (
                            user?.email || ""
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">验证码</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="请输入验证码"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={sending || cooldown > 0 || !target}
                          className="shrink-0 px-3 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-xs font-medium hover:bg-pink-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {cooldown > 0 ? `${cooldown}s` : sending ? "发送中" : "获取验证码"}
                        </button>
                        <button
                          type="button"
                          onClick={handleVerify}
                          disabled={loading || !target}
                          className="shrink-0 px-4 py-2.5 rounded-xl border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/10 transition disabled:opacity-40"
                        >
                          验证
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: 新密码 */}
              <div className={cn(!verified && "opacity-40 pointer-events-none")}>
                <div className="flex items-center gap-2 mb-4">
                  {verified ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-600 flex items-center justify-center text-[8px] text-gray-600">2</span>
                  )}
                  <span className="text-sm font-medium text-gray-300">设置新密码</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">新密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="至少6位"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">确认新密码</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入新密码"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !verified}
                    className="btn-gradient w-full py-3 rounded-xl font-medium disabled:opacity-50"
                  >
                    {loading ? "提交中..." : "确认修改"}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
