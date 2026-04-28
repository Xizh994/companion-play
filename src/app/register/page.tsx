"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GAME_CATEGORIES = ["王者荣耀", "英雄联盟", "原神", "和平精英", "蛋仔派对", "第五人格", "其他"];
const SERVICE_TAGS = ["上分", "带飞", "教学", "陪聊", "声优", "代练"];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("player");
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // 个人陪玩字段
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [games, setGames] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  // 陪玩店字段
  const [shopName, setShopName] = useState("");
  const [shopBio, setShopBio] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [managerName, setManagerName] = useState("");

  const toggleGame = (g: string) => setGames((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleService = (s: string) => setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("申请已提交，请等待审核");
      router.push("/login");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="glass rounded-3xl p-8 glow-card">
          {/* Logo */}
          <div className="text-center mb-6">
            <span className="text-4xl">🎮</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mt-2">
              入驻搭子星
            </h1>
            <p className="text-gray-400 text-sm mt-1">选择你的角色，开始你的搭子之旅</p>
          </div>

          {/* 角色选择 Tabs */}
          <Tabs value={role} onValueChange={setRole} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 h-11 rounded-xl mb-6">
              <TabsTrigger
                value="player"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-gray-400 text-sm transition-all"
              >
                个人陪玩
              </TabsTrigger>
              <TabsTrigger
                value="shop"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-gray-400 text-sm transition-all"
              >
                陪玩店
              </TabsTrigger>
              <TabsTrigger
                value="boss"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-gray-400 text-sm transition-all"
              >
                老板
              </TabsTrigger>
            </TabsList>

            {/* ---- 个人陪玩 ---- */}
            <TabsContent value="player">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="手机号" value={phone} onChange={setPhone} type="tel" placeholder="请输入手机号" />
                <Field label="密码" value={password} onChange={setPassword} type="password" placeholder="请输入密码" />
                <Field label="昵称" value={nickname} onChange={setNickname} placeholder="给自己取个名字" />

                {/* 游戏品类 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">游戏品类（多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {GAME_CATEGORIES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGame(g)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                          games.includes(g)
                            ? "border-pink-500 bg-pink-500/20 text-pink-300"
                            : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 服务标签 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">服务标签（多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_TAGS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleService(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                          services.includes(s)
                            ? "border-purple-500 bg-purple-500/20 text-purple-300"
                            : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 自我介绍 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">自我介绍</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="介绍一下自己，让老板更了解你~"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition resize-none"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-gradient w-full py-3 rounded-xl font-medium disabled:opacity-50">
                  {loading ? "提交中..." : "提交入驻"}
                </button>
              </form>
            </TabsContent>

            {/* ---- 陪玩店 ---- */}
            <TabsContent value="shop">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="手机号" value={phone} onChange={setPhone} type="tel" placeholder="请输入手机号" />
                <Field label="密码" value={password} onChange={setPassword} type="password" placeholder="请输入密码" />
                <Field label="店铺名称" value={shopName} onChange={setShopName} placeholder="给你的店铺取个名字" />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">店铺简介</label>
                  <textarea
                    value={shopBio}
                    onChange={(e) => setShopBio(e.target.value)}
                    placeholder="介绍一下你的店铺~"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition resize-none"
                  />
                </div>

                {/* 封面图上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">封面图</label>
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-pink-500/50 transition group">
                    {coverPreview ? (
                      <img src={coverPreview} alt="封面预览" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="text-center text-gray-500 group-hover:text-pink-400 transition">
                        <span className="text-2xl block">📷</span>
                        <span className="text-sm">点击上传封面图</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  </label>
                </div>

                <Field label="联系电话" value={contactPhone} onChange={setContactPhone} type="tel" placeholder="店铺联系电话" />
                <Field label="负责人姓名" value={managerName} onChange={setManagerName} placeholder="负责人真实姓名" />

                <button type="submit" disabled={loading} className="btn-gradient w-full py-3 rounded-xl font-medium disabled:opacity-50">
                  {loading ? "提交中..." : "提交入驻"}
                </button>
              </form>
            </TabsContent>

            {/* ---- 老板 ---- */}
            <TabsContent value="boss">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="手机号" value={phone} onChange={setPhone} type="tel" placeholder="请输入手机号" />
                <Field label="密码" value={password} onChange={setPassword} type="password" placeholder="请输入密码" />
                <Field label="昵称" value={nickname} onChange={setNickname} placeholder="给自己取个名字" />

                <button type="submit" disabled={loading} className="btn-gradient w-full py-3 rounded-xl font-medium disabled:opacity-50">
                  {loading ? "提交中..." : "提交入驻"}
                </button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-400">
            已有账号？{" "}
            <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium">
              去登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- 可复用输入字段组件 ---- */
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition"
        required
      />
    </div>
  );
}