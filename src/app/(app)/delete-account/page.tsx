"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [step, setStep] = useState<"confirm" | "final">("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      logout();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注销失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-4">
      <button
        onClick={() => router.back()}
        className="self-start flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回</span>
      </button>

      <div className="glass rounded-3xl p-6 sm:p-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">注销账号</h1>
          <p className="text-gray-400 text-sm mt-2">此操作不可撤销，请谨慎决定</p>
        </div>

        {step === "confirm" ? (
          <>
            <div className="glass-card rounded-2xl p-5 mb-6 border border-white/[0.04]">
              <h3 className="text-white font-medium mb-3 text-sm">注销账号后，以下数据将被永久删除：</h3>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">•</span>
                  <span>您的账号信息（手机号、昵称、头像等）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">•</span>
                  <span>实名认证和店铺资质信息</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">•</span>
                  <span>聊天记录和订单数据</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">•</span>
                  <span>所有与您账号关联的数据将无法恢复</span>
                </li>
              </ul>
            </div>

            <div className="glass-card rounded-2xl p-5 mb-6 border border-white/[0.04]">
              <h3 className="text-white font-medium mb-2 text-sm">温馨提示：</h3>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li>• 注销后无法登录和使用本平台</li>
                <li>• 根据法律法规要求，部分交易记录可能依法保留</li>
                <li>• 建议您在注销前备份重要信息</li>
              </ul>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 h-11 rounded-xl border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/5 transition"
              >
                取消
              </button>
              <button
                onClick={() => setStep("final")}
                className="flex-1 h-11 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/30 transition"
              >
                继续注销
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-gray-300 text-sm mb-1">确定要永久注销您的账号吗？</p>
              <p className="text-gray-500 text-xs">注销后将无法找回任何数据</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("confirm")}
                disabled={loading}
                className="flex-1 h-11 rounded-xl border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/5 transition disabled:opacity-50"
              >
                再想想
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "确认注销"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
