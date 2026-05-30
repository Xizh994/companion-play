"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ShopManageLayout } from "@/components/ShopManageLayout";
import { GameCategoryPicker } from "@/components/GameCategoryPicker";
import { SafeAvatar } from "@/components/GeneratedAvatar";
import {
  SHOP_PRICE_UNITS,
  SHOP_PROMO_MAX,
  SHOP_THEME_KEYS,
  SHOP_THEME_STYLES,
  type ShopHomepagePayload,
  type ShopHomepageShowcasePlayer,
} from "@/lib/shop-homepage";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

export default function ShopHomepageEditPage() {
  const { token, user } = useAuth();
  const [homepage, setHomepage] = useState<ShopHomepagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newPlayer, setNewPlayer] = useState({
    displayName: "",
    pricePerHour: "",
    highlight: "",
    gameTags: [] as string[],
    avatarUrl: null as string | null,
  });
  const [addingPlayer, setAddingPlayer] = useState(false);

  const bannerRef = useRef<HTMLInputElement>(null);
  const promoRef = useRef<HTMLInputElement>(null);
  const playerAvatarRef = useRef<HTMLInputElement>(null);
  const newPlayerAvatarRef = useRef<HTMLInputElement>(null);
  const [avatarTargetPlayerId, setAvatarTargetPlayerId] = useState<string | null>(null);

  const loadHomepage = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shops/me/homepage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载失败");
      setHomepage(data.homepage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHomepage();
  }, [loadHomepage]);

  const patchHomepage = async (body: Record<string, unknown>) => {
    if (!token) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/shops/me/homepage", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      setHomepage(data.homepage);
      setMessage("已保存");
      setTimeout(() => setMessage(""), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const uploadShopImage = async (file: File) => {
    if (!token) throw new Error("未登录");
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/uploads/shop", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "上传失败");
    return data.url as string;
  };

  const handleBannerUpload = async (file: File) => {
    try {
      const url = await uploadShopImage(file);
      await patchHomepage({ shopBanner: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    }
  };

  const handlePromoUpload = async (file: File) => {
    try {
      const url = await uploadShopImage(file);
      await patchHomepage({ addPromoImageUrl: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    }
  };

  const addShowcasePlayer = async () => {
    if (!token || !newPlayer.displayName.trim()) return;
    setAddingPlayer(true);
    setError("");
    try {
      const res = await fetch("/api/shops/me/showcase-players", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: newPlayer.displayName.trim(),
          highlight: newPlayer.highlight.trim() || null,
          pricePerHour: newPlayer.pricePerHour ? Number(newPlayer.pricePerHour) : null,
          gameTags: newPlayer.gameTags,
          avatar: newPlayer.avatarUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "添加失败");
      setNewPlayer({ displayName: "", pricePerHour: "", highlight: "", gameTags: [], avatarUrl: null });
      await loadHomepage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setAddingPlayer(false);
    }
  };

  const updatePlayer = async (id: string, body: Record<string, unknown>) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/shops/me/showcase-players/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新失败");
      await loadHomepage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失败");
    }
  };

  const deletePlayer = async (id: string) => {
    if (!token || !confirm("确定删除这位主打陪玩？")) return;
    try {
      const res = await fetch(`/api/shops/me/showcase-players/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除失败");
      await loadHomepage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  };

  const uploadPlayerAvatar = async (playerId: string, file: File) => {
    try {
      const url = await uploadShopImage(file);
      await updatePlayer(playerId, { avatar: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    }
  };

  if (loading) {
    return (
      <ShopManageLayout title="主页装修" activeTab="homepage">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </ShopManageLayout>
    );
  }

  if (error && !homepage) {
    return (
      <ShopManageLayout title="主页装修" activeTab="homepage">
        <p className="text-red-400 text-sm text-center py-10">{error}</p>
      </ShopManageLayout>
    );
  }

  if (!homepage || !user) return null;

  return (
    <ShopManageLayout
      title="主页装修"
      subtitle="打造你的店铺橱窗，老板浏览后可直接发起咨询"
      activeTab="homepage"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-xs text-gray-500">
          {saving ? "保存中…" : message || "修改后自动保存或点击保存"}
        </div>
        <Link
          href={`/shop/${user.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          预览主页（新标签）
        </Link>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="space-y-5">
          <Section title="横幅背景">
            <input
              ref={bannerRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleBannerUpload(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="w-full aspect-[16/7] rounded-2xl border-2 border-dashed border-white/10 overflow-hidden relative group"
            >
              {homepage.shopBanner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={homepage.shopBanner} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs">上传横幅（建议 1200×525）</span>
                </div>
              )}
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition">
                点击更换
              </span>
            </button>
            {homepage.shopBanner && (
              <button
                type="button"
                onClick={() => patchHomepage({ shopBanner: null })}
                className="text-xs text-red-400 mt-2"
              >
                移除横幅
              </button>
            )}
          </Section>

          <Section title="品牌文案">
            <Field label="标语（店名下方）">
              <input
                className="input-field"
                value={homepage.slogan ?? ""}
                onChange={(e) => setHomepage({ ...homepage, slogan: e.target.value })}
                onBlur={() => patchHomepage({ slogan: homepage.slogan ?? "" })}
                placeholder="例：五年老店 · 金牌团队"
                maxLength={40}
              />
            </Field>
            <Field label="店铺介绍">
              <textarea
                className="input-field min-h-[100px] resize-y"
                value={homepage.shopDesc ?? ""}
                onChange={(e) => setHomepage({ ...homepage, shopDesc: e.target.value })}
                onBlur={() => patchHomepage({ shopDesc: homepage.shopDesc ?? "" })}
                placeholder="介绍团队特色、服务承诺…"
                maxLength={800}
              />
            </Field>
          </Section>

          <Section title="价格展示">
            <div className="grid grid-cols-2 gap-3">
              <Field label="起步价（元）">
                <input
                  type="number"
                  min={0}
                  className="input-field"
                  value={homepage.priceFrom ?? ""}
                  onChange={(e) =>
                    setHomepage({
                      ...homepage,
                      priceFrom: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  onBlur={() =>
                    patchHomepage({ priceFrom: homepage.priceFrom ?? null })
                  }
                  placeholder="30"
                />
              </Field>
              <Field label="计价单位">
                <select
                  className="input-field"
                  value={homepage.priceUnit}
                  onChange={(e) => {
                    const v = e.target.value;
                    setHomepage({ ...homepage, priceUnit: v });
                    patchHomepage({ priceUnit: v });
                  }}
                >
                  {SHOP_PRICE_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      按{u.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="价格备注">
              <input
                className="input-field"
                value={homepage.priceNote ?? ""}
                onChange={(e) => setHomepage({ ...homepage, priceNote: e.target.value })}
                onBlur={() => patchHomepage({ priceNote: homepage.priceNote ?? "" })}
                placeholder="例：新客首单详聊优惠"
                maxLength={60}
              />
            </Field>
          </Section>

          <Section title="主打游戏">
            <GameCategoryPicker
              value={homepage.shopGames}
              onChange={(games) => {
                setHomepage({ ...homepage, shopGames: games });
                patchHomepage({ gameCategories: games });
              }}
            />
          </Section>

          <Section title="主题色">
            <div className="grid grid-cols-4 gap-2">
              {SHOP_THEME_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setHomepage({ ...homepage, themeKey: key });
                    patchHomepage({ themeKey: key });
                  }}
                  className={cn(
                    "h-12 rounded-xl bg-gradient-to-br border-2 transition",
                    SHOP_THEME_STYLES[key].gradient,
                    homepage.themeKey === key ? "border-white" : "border-transparent opacity-70"
                  )}
                  title={key}
                />
              ))}
            </div>
          </Section>

          <Section title="宣传图片">
            <input
              ref={promoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handlePromoUpload(f);
                e.target.value = "";
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {homepage.promoImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => patchHomepage({ removePromoImageId: img.id })}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {homepage.promoImages.length < SHOP_PROMO_MAX && (
                <button
                  type="button"
                  onClick={() => promoRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 gap-1 hover:border-violet-500/40 transition"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px]">添加</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-600 mt-2">最多 {SHOP_PROMO_MAX} 张，横向滑动展示</p>
          </Section>

          <Section title="区块显示">
            <ToggleRow
              label="展示宣传图"
              checked={homepage.showPromoImages}
              onChange={(v) => {
                setHomepage({ ...homepage, showPromoImages: v });
                patchHomepage({ showPromoImages: v });
              }}
            />
            <ToggleRow
              label="展示主打陪玩"
              checked={homepage.showShowcasePlayers}
              onChange={(v) => {
                setHomepage({ ...homepage, showShowcasePlayers: v });
                patchHomepage({ showShowcasePlayers: v });
              }}
            />
            <ToggleRow
              label="展示顾客评价"
              checked={homepage.showReviews}
              onChange={(v) => {
                setHomepage({ ...homepage, showReviews: v });
                patchHomepage({ showReviews: v });
              }}
            />
          </Section>

          <Section title="主打陪玩">
            <input
              ref={playerAvatarRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && avatarTargetPlayerId) void uploadPlayerAvatar(avatarTargetPlayerId, f);
                e.target.value = "";
                setAvatarTargetPlayerId(null);
              }}
            />
            <div className="space-y-3">
              {homepage.showcasePlayers.map((p) => (
                <PlayerEditRow
                  key={p.id}
                  player={p}
                  onDelete={() => deletePlayer(p.id)}
                  onAvatar={() => {
                    setAvatarTargetPlayerId(p.id);
                    playerAvatarRef.current?.click();
                  }}
                />
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <p className="text-xs text-gray-500">添加主打陪玩</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => newPlayerAvatarRef.current?.click()}
                  className="relative shrink-0 group"
                  title="上传头像"
                >
                  <SafeAvatar
                    src={newPlayer.avatarUrl}
                    seed={newPlayer.displayName || "新陪玩"}
                    size={48}
                  />
                  <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white transition">
                    上传
                  </span>
                </button>
                <input
                  ref={newPlayerAvatarRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const url = await uploadShopImage(f);
                      setNewPlayer((prev) => ({ ...prev, avatarUrl: url }));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "上传失败");
                    }
                    e.target.value = "";
                  }}
                />
                <p className="text-[11px] text-gray-500">点击左侧头像上传（可选）</p>
              </div>
              <input
                className="input-field"
                placeholder="昵称"
                value={newPlayer.displayName}
                onChange={(e) => setNewPlayer({ ...newPlayer, displayName: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="亮点（可选）"
                value={newPlayer.highlight}
                onChange={(e) => setNewPlayer({ ...newPlayer, highlight: e.target.value })}
              />
              <input
                className="input-field"
                type="number"
                placeholder="价格/小时（可选）"
                value={newPlayer.pricePerHour}
                onChange={(e) => setNewPlayer({ ...newPlayer, pricePerHour: e.target.value })}
              />
              <GameCategoryPicker
                value={newPlayer.gameTags}
                onChange={(gameTags) => setNewPlayer({ ...newPlayer, gameTags })}
              />
              <button
                type="button"
                disabled={addingPlayer || !newPlayer.displayName.trim()}
                onClick={addShowcasePlayer}
                className="w-full py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingPlayer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                添加陪玩
              </button>
            </div>
          </Section>
      </div>

      <style jsx global>{`
        .input-field {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 0.875rem;
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </ShopManageLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-gray-300">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-violet-500"
      />
    </label>
  );
}

function PlayerEditRow({
  player,
  onDelete,
  onAvatar,
}: {
  player: ShopHomepageShowcasePlayer;
  onDelete: () => void;
  onAvatar: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
      <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
      <button
        type="button"
        onClick={onAvatar}
        className="shrink-0 relative group"
        title="点击上传头像"
      >
        <SafeAvatar src={player.avatar} seed={player.displayName} size={40} />
        <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white transition">
          上传
        </span>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{player.displayName}</p>
        <p className="text-[11px] text-gray-500">
          {player.pricePerHour != null ? `¥${player.pricePerHour}/时` : "点击头像可上传照片"}
          {player.highlight ? ` · ${player.highlight}` : ""}
        </p>
      </div>
      <button type="button" onClick={onDelete} className="text-red-400 p-1">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
