"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import type { ShopReviewInviteState } from "@/lib/shop-review-constants";

const INVITE_LABELS: Record<ShopReviewInviteState, string> = {
  not_mutual_chat: "需与老板互发过消息后可邀请评价",
  can_invite: "",
  pending: "已发送邀请，等待对方评价",
  expired_can_reinvite: "",
  boss_reviewed_today: "对方今日已评价，明日可再次邀请",
  invited_today: "今日已向该老板发送过邀请",
};

interface ShopInviteReviewBarProps {
  shopId: string;
  bossUserId: string;
  conversationId: string;
  token: string | null;
  onInvited: () => void;
}

export function ShopInviteReviewBar({
  shopId,
  bossUserId,
  conversationId,
  token,
  onInvited,
}: ShopInviteReviewBarProps) {
  const [state, setState] = useState<ShopReviewInviteState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchState = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/shops/${shopId}/review-eligibility?bossUserId=${encodeURIComponent(bossUserId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) setState(data.state);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [shopId, bossUserId, token]);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  const handleInvite = async () => {
    if (!token) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/review-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bossUserId, conversationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "邀请失败");
        return;
      }
      await fetchState();
      onInvited();
    } catch {
      setError("邀请失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        加载评价邀请状态…
      </div>
    );
  }

  if (!state) return null;

  const canInvite = state === "can_invite" || state === "expired_can_reinvite";
  const hint = INVITE_LABELS[state];

  return (
    <div className="px-4 py-2.5 border-t border-white/5 bg-violet-500/5">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-violet-400 shrink-0" />
        <div className="flex-1 min-w-0">
          {hint ? (
            <p className="text-xs text-gray-400">{hint}</p>
          ) : (
            <p className="text-xs text-gray-400">服务结束后可邀请老板评价</p>
          )}
          {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
        </div>
        {canInvite && (
          <button
            type="button"
            onClick={handleInvite}
            disabled={submitting}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 disabled:opacity-50 flex items-center gap-1"
          >
            {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
            邀请评价
          </button>
        )}
      </div>
    </div>
  );
}
