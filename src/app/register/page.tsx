"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Store, Crown, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "SHOP", label: "陪玩店", icon: Store, color: "violet", gradient: "from-violet-500 to-purple-500", glow: "shadow-purple-500/25", ring: "ring-purple-500/30", emoji: "🏪", desc: "经营店铺，接待老板" },
  { value: "BOSS", label: "老板", icon: Crown, color: "amber", gradient: "from-amber-500 to-orange-500", glow: "shadow-amber-500/25", ring: "ring-amber-500/30", emoji: "👑", desc: "找陪玩店，轻松上分" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState("SHOP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopBio, setShopBio] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactName, setContactName] = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const activeRole = ROLES.find((r) => r.value === role)!;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("头像大小不能超过 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        phone, password, role, nickname,
        shopName, shopBio, contactPhone, contactName,
        avatar: avatarPreview,
      });
      router.push("/discover");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-6 sm:p-8 glow-card">
          <div className="text-center mb-6">
            <span className="text-4xl">🎮</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mt-2">
              入驻搭子星
            </h1>
            <p className="text-gray-400 text-sm mt-1">{activeRole.desc}</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex bg-white/[0.06] border border-white/[0.08] rounded-xl p-1 mb-6">
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

          <div className="flex flex-col items-center mb-6">
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
                  "w-24 h-24 border-2 flex items-center justify-center overflow-hidden transition-all duration-300",
                  avatarPreview
                    ? "border-white/20 ring-4 ring-pink-500/20"
                    : "border-dashed border-white/15 bg-white/5 group-hover:border-pink-400/40 group-hover:bg-white/[0.08]"
                )}
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <Camera className="w-7 h-7 text-gray-500 group-hover:text-pink-400 transition-colors" />
                    <span className="text-[10px] text-gray-500">上传头像</span>
                  </div>
                )}
              </div>
            </button>
            {avatarPreview && (
              <button
                type="button"
                onClick={() => setAvatarPreview(null)}
                className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
                移除头像
              </button>
            )}
          </div>

          {role === "SHOP" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="手机号" value={phone} onChange={setPhone} type="tel" placeholder="请输入手机号" />
              <Field label="密码" value={password} onChange={setPassword} type="password" placeholder="请输入密码（至少6位）" />
              <Field label="店铺名称" value={shopName} onChange={setShopName} placeholder="给你的店铺取个名字" />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">店铺简介</label>
                <textarea value={shopBio} onChange={(e) => setShopBio(e.target.value)} placeholder="介绍一下你的店铺，展示你的特色~" rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition resize-none" />
              </div>
              <Field label="联系电话" value={contactPhone} onChange={setContactPhone} type="tel" placeholder="店铺联系电话" />
              <Field label="负责人姓名" value={contactName} onChange={setContactName} placeholder="负责人真实姓名" />
              <SubmitButton loading={loading} gradient={activeRole.gradient} glow={activeRole.glow} emoji={activeRole.emoji} text="店铺入驻" />
            </form>
          )}

          {role === "BOSS" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="手机号" value={phone} onChange={setPhone} type="tel" placeholder="请输入手机号" />
              <Field label="密码" value={password} onChange={setPassword} type="password" placeholder="请输入密码（至少6位）" />
              <Field label="昵称" value={nickname} onChange={setNickname} placeholder="给自己取个名字" />
              <SubmitButton loading={loading} gradient={activeRole.gradient} glow={activeRole.glow} emoji={activeRole.emoji} text="老板入驻" />
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-400">
            已有账号？{" "}
            <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">去登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required = true }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition"
      />
    </div>
  );
}

function SubmitButton({ loading, gradient, glow, emoji, text }: {
  loading: boolean; gradient: string; glow: string; emoji: string; text: string;
}) {
  return (
    <button
      type="submit" disabled={loading}
      className={cn(
        "w-full py-3 rounded-xl font-medium text-white bg-gradient-to-r shadow-lg transition-all duration-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:brightness-110 active:scale-[0.98]",
        gradient, glow
      )}
    >
      {loading ? "提交中..." : `${emoji} ${text}`}
    </button>
  );
}
