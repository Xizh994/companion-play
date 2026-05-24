"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ShopManageLayout } from "@/components/ShopManageLayout";
import { Loader2, TrendingUp } from "lucide-react";

interface DashboardData {
  summary: {
    pageViewsToday: number;
    uniqueVisitorsToday: number;
    consultationsTotal: number;
    reviewsTotal: number;
    avgRating: number | null;
    reviewsToday: number;
    pageViewsTotal: number;
  };
  trend: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
    reviews: number;
  }>;
}

export default function ShopStatsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/shops/me/dashboard?rangeDays=7", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "加载失败");
        setData(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <ShopManageLayout title="经营数据" activeTab="stats">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </ShopManageLayout>
    );
  }

  if (error || !data) {
    return (
      <ShopManageLayout title="经营数据" activeTab="stats">
        <p className="text-red-400 text-sm text-center py-10">{error || "加载失败"}</p>
      </ShopManageLayout>
    );
  }

  const { summary, trend } = data;
  const maxPv = Math.max(1, ...trend.map((t) => t.pageViews));

  return (
    <ShopManageLayout title="经营数据" subtitle="了解店铺曝光与咨询情况" activeTab="stats">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard label="今日浏览" value={summary.pageViewsToday} sub={`访客 ${summary.uniqueVisitorsToday}`} />
        <MetricCard label="累计咨询" value={summary.consultationsTotal} sub="互聊过的老板" />
        <MetricCard
          label="累计评价"
          value={summary.reviewsTotal}
          sub={summary.avgRating != null ? `均分 ${summary.avgRating.toFixed(1)}` : "暂无均分"}
        />
        <MetricCard
          label="今日新增评价"
          value={summary.reviewsToday}
          sub="点击查看详情"
          href="/profile/shop/reviews"
        />
      </div>

      <div className="glass rounded-2xl p-5 border border-white/10 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-gray-200">近 7 日趋势</h2>
        </div>
        <div className="space-y-3">
          {trend.map((row) => (
            <div key={row.date} className="flex items-center gap-3 text-xs">
              <span className="w-20 text-gray-500 shrink-0">{row.date.slice(5)}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                  style={{ width: `${(row.pageViews / maxPv) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right text-gray-400 shrink-0">{row.pageViews} 浏览</span>
              <span className="w-12 text-right text-gray-500 shrink-0">{row.reviews} 评</span>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/profile/shop/reviews"
        className="block w-full py-3 rounded-xl border border-violet-500/30 text-violet-300 text-sm text-center hover:bg-violet-500/10 transition"
      >
        查看全部评价 →
      </Link>

      <p className="text-[10px] text-gray-600 text-center mt-4">活跃度排名功能即将上线</p>
    </ShopManageLayout>
  );
}

function MetricCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: number;
  sub: string;
  href?: string;
}) {
  const inner = (
    <div className="glass rounded-2xl p-4 border border-white/10 h-full">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition">
        {inner}
      </Link>
    );
  }
  return inner;
}
