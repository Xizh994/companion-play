"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Store, Crown } from "lucide-react";

const GAME_CATEGORIES = ["王者荣耀", "英雄联盟", "原神", "和平精英", "蛋仔派对", "第五人格", "其他"];
const SERVICE_TAGS = ["上分", "带飞", "教学", "陪聊", "声优", "代练"];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState("PLAYER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [games, setGames] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopBio, setShopBio] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactName, setContactName] = useState("");

  const toggleGame = (g: string) => setGames((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleService = (s: string) => setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        phone, password, role, nickname, games, services, bio,
        shopName, shopBio, contactPhone, contactName,
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
      {/* 背景光晕 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="glass rounded-3xl p-8 glow-card">
          {/* 标题 */}
          <div className="text-center mb-8">
            <span className="text-4xl">🎮</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mt-2">
              入驻搭子星
            </h1>
            <p className="text-gray-400 text-sm mt-1">选择你的角色，开始你的搭子之旅</p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* 角色选择标签页 */}
          <Tabs value={role} onValueChange={setRole} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/[0.06] border border-white/[0.08] rounded-xl p-1 mb-8">
              <TabsTrigger
                value="PLAYER"
                className="relative flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all duration-300
                  text-gray-400 hover:text-gray-200
                  data-active:text-white data-active:bg-gradient-to-r data-active:from-pink-500 data-active:to-rose-500
                  data-active:shadow-lg data-active:shadow-pink-500/20"
              >
                <User className="w-4 h-4" />
                个人陪玩
              </TabsTrigger>
              <TabsTrigger
                value="SHOP"
                className="relative flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all duration-300
                  text-gray-400 hover:text-gray-200
                  data-active:text-white data-active:bg-gradient-to-r data-active:from-violet-500 data-active:to-purple-500
                  data-active:shadow-lg data-active:shadow-purple-500/20"
              >
                <Store className="w-4 h-4" />
                陪玩店
              </TabsTrigger>
              <TabsTrigger
                value="BOSS"
                className="relative flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all duration-300
                  text-gray-400 hover:text-gray-200
                  data-active:text-white data-active:bg-gradient-to-r data-active:from-amber-500 data-active:to-orange-500
                  data-active:shadow-lg data-active:shadow-amber-500/20"
              >
                <Crown className="w-4 h-4" />
                老板
              </TabsTrigger>
            </TabsList>

            {/* 个人陪玩 表单 */}
            <TabsContent value="PLAYER">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="手机号" value={phone} onChange={setPhone} type="tel" placeholder="请输入手机号" />
                <Field label="密码" value={password} onChange={setPassword} type="password" placeholder="请输入密码（至少6位）" />
                <Field label="昵称" value={nickname} onChange={setNickname} placeholder="给自己取个名字" />
                <TagGroup label="游戏品类（多选）" items={GAME_CATEGORIES} selected={games} onToggle={toggleGame} activeClass="border-pink-500 bg-pink-500/20 text-pink-300" />
                <TagGroup label="服务标签（多选）" items={SERVICE_TAGS} selected={services} onToggle={toggleService} activeClass="border-purple-500 bg-purple-500/20 text-purple-300" />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">自我介绍</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="介绍一下自己，让老板更了解你~" rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition resize-none" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "提交中..." : "🎯 立即入驻"}
                </button>
              </form>
            </TabsContent>

            {/* 陪玩店 表单 */}
            <TabsContent value="SHOP">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="手机号" value={phone} onChange={setPhone} type="tel" placeholder="请输入手机号" />
                <Field label="密码" value={password} onChange={setPassword} type="password" placeholder="请输入密码（至少6位）" />
                <Field label="店铺名称" value={shopName} onChange={setShopName} placeholder="给你的店铺取个名字" />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">店铺简介</label>
                  <textarea value={shopBio} onChange={(e) => setShopBio(e.target.value)} placeholder="介绍一下你的店铺，展示你的特色~" rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition resize-none" />
                </div>
                <Field label="联系电话" value={contactPhone} onChange={setContactPhone} type="tel" placeholder="店铺联系电话" />
                <Field label="负责人姓名" value={contactName} onChange={setContactName} placeholder="负责人真实姓名" />
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-medium text-white bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "提交中..." : "🏪 店铺入驻"}
                </button>
              </form>
            </TabsContent>

            {/* 老板 表单 */}
            <TabsContent value="BOSS">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="手机号" value={phone} onChange={setPhone} type="tel" placeholder="请输入手机号" />
                <Field label="密码" value={password} onChange={setPassword} type="password" placeholder="请输入密码（至少6位）" />
                <Field label="昵称" value={nickname} onChange={setNickname} placeholder="给自己取个名字" />
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "提交中..." : "👑 老板入驻"}
                </button>
              </form>
            </TabsContent>
          </Tabs>

          {/* 底部链接 */}
          <div className="mt-6 text-center text-sm text-gray-400">
            已有账号？{" "}
            <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">去登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====== 子组件 ====== */

function Field({ label, value, onChange, type = "text", placeholder, required = true }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition" />
    </div>
  );
}

function TagGroup({ label, items, selected, onToggle, activeClass }: {
  label: string; items: string[]; selected: string[]; onToggle: (item: string) => void; activeClass: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button key={item} type="button" onClick={() => onToggle(item)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 ${
              selected.includes(item)
                ? activeClass
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-gray-300"
            }`}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
