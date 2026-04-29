"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GeneratedAvatar } from "@/components/GeneratedAvatar";
import { Badge } from "@/components/ui/badge";
import {
  Settings, Shield, Bell, Moon, Sun, Gamepad2,
  LogOut, Trash2, AlertTriangle, MessageCircle, Star,
  Trophy, Clock, CheckCircle, User, ChevronRight, Camera,
} from "lucide-react";

const TABS = [
  { key: "orders", label: "订单记录" },
  { key: "reviews", label: "我的评价" },
  { key: "settings", label: "账号设置" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("orders");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => router.push("/login");
  const handleDeleteAccount = () => {
    console.log("注销账号");
    setShowDeleteConfirm(false);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* ──────── 个人信息卡片 ──────── */}
        <div className="glass rounded-2xl p-6 mb-6 glow-card">
          <div className="flex items-center gap-5">
            {/* 头像 */}
            <div className="relative shrink-0">
              <GeneratedAvatar seed="习朝晖" size={80} className="ring-4 ring-purple-500/20" />
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center shadow-lg hover:bg-purple-400 transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold truncate">习朝晖</h1>
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
              </div>
              <p className="text-gray-400 text-sm mb-2">游戏爱好者 · 老板</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/25 text-xs">
                  <Trophy className="w-3 h-3 mr-1" />
                  钻石会员
                </Badge>
              </div>
            </div>

            <button className="shrink-0 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors">
              编辑资料
            </button>
          </div>
        </div>

        {/* ──────── 数据统计 ──────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "订单", value: "28", icon: MessageCircle, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "评价", value: "4.9", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "时长", value: "156h", icon: Clock, color: "text-pink-400", bg: "bg-pink-500/10" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center glow-card">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ──────── 标签切换 ──────── */}
        <div className="flex bg-white/[0.06] border border-white/[0.08] rounded-xl p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-300",
                activeTab === tab.key
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ──────── 订单记录 ──────── */}
        {activeTab === "orders" && (
          <div className="glass rounded-2xl p-1 glow-card">
            {[
              { game: "王者荣耀", player: "影刃舞者", date: "2026-04-28", status: "completed", amount: 70 },
              { game: "原神", player: "星空漫步", date: "2026-04-27", status: "completed", amount: 56 },
              { game: "QQ飞车", player: "疾风少年", date: "2026-04-26", status: "pending", amount: 64 },
            ].map((order, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-4 p-4 transition-colors",
                  "hover:bg-white/[0.04] rounded-xl",
                  i !== 2 && "border-b border-white/[0.06]"
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-medium text-sm">{order.game}</p>
                    <p className="font-bold text-purple-400 text-sm">¥{order.amount}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">陪玩师: {order.player} · {order.date}</p>
                    {order.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" />已完成
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                        <Clock className="w-3 h-3" />进行中
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ──────── 我的评价 ──────── */}
        {activeTab === "reviews" && (
          <div className="glass rounded-2xl p-1 glow-card">
            {[
              { player: "影刃舞者", rating: 5, comment: "技术超好，带飞！下次还找他", date: "2026-04-28" },
              { player: "星空漫步", rating: 4, comment: "打金效率高，很满意", date: "2026-04-27" },
            ].map((review, i) => (
              <div
                key={i}
                className={cn(
                  "p-4 transition-colors hover:bg-white/[0.04] rounded-xl",
                  i !== 1 && "border-b border-white/[0.06]"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {review.player[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.player}</p>
                      <p className="text-xs text-gray-500">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className={cn(
                          "w-3.5 h-3.5",
                          j < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-300 ml-12">{review.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* ──────── 账号设置 ──────── */}
        {activeTab === "settings" && (
          <div className="space-y-3">
            {/* 偏好设置 */}
            <div className="glass rounded-2xl p-1 glow-card">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-medium text-gray-300">偏好设置</p>
              </div>
              <SettingRow
                icon={isDarkMode ? Moon : Sun}
                label="深色模式"
                active={isDarkMode}
                onClick={() => setIsDarkMode(!isDarkMode)}
              />
              <SettingRow
                icon={Bell}
                label="消息通知"
                active={notifications}
                onClick={() => setNotifications(!notifications)}
              />
            </div>

            {/* 安全设置 */}
            <div className="glass rounded-2xl p-1 glow-card">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-medium text-gray-300">安全设置</p>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">修改密码</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] rounded-xl transition-colors border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">实名认证</span>
                </div>
                <span className="text-xs text-orange-400">未认证</span>
              </button>
            </div>
          </div>
        )}

        {/* ──────── 退出 & 注销 ──────── */}
        <div className="mt-10 pt-6 border-t border-white/[0.08] space-y-3">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-purple-500/20 text-purple-300 text-sm font-medium hover:bg-purple-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 inline mr-2" />
            退出登录
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-xl border border-red-500/15 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              注销账号
            </button>
          ) : (
            <div className="glass rounded-2xl p-5 border-red-500/20 glow-card">
              <div className="flex gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-300 text-sm mb-1">确认注销账号？</p>
                  <p className="text-xs text-gray-400">
                    此操作不可逆，所有数据将被永久删除，包括订单记录、评价、余额等。
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  确认注销
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====== 设置行组件 ====== */
function SettingRow({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">{label}</span>
      </div>
      <button
        onClick={onClick}
        className={cn(
          "w-11 h-6 rounded-full transition-colors relative",
          active ? "bg-purple-500" : "bg-white/10"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
            active ? "left-[22px]" : "left-[2px]"
          )}
        />
      </button>
    </div>
  );
}
