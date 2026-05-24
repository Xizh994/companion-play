"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { REVIEW_CONTENT_MIN } from "@/lib/shop-review-constants";

interface ShopReviewFormDialogProps {
  open: boolean;
  shopName: string;
  requestId: string;
  token: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ShopReviewFormDialog({
  open,
  shopName,
  requestId,
  token,
  onClose,
  onSubmitted,
}: ShopReviewFormDialogProps) {
  const [score, setScore] = useState(5);
  const [hoverScore, setHoverScore] = useState(0);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async () => {
    if (content.trim().length < REVIEW_CONTENT_MIN) {
      setError(`评价内容至少 ${REVIEW_CONTENT_MIN} 个字`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/review-requests/${requestId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score, content: content.trim(), isAnonymous }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "提交失败");
        return;
      }
      onSubmitted();
      onClose();
      setContent("");
      setScore(5);
      setIsAnonymous(false);
    } catch {
      setError("提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const displayScore = hoverScore || score;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md bg-[#12122a] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-1">评价 {shopName}</h3>
        <p className="text-xs text-gray-500 mb-5">你的评价将展示在店铺主页，请客观填写</p>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHoverScore(n)}
              onMouseLeave={() => setHoverScore(0)}
              onClick={() => setScore(n)}
              className="p-0.5"
            >
              <Star
                className={`w-8 h-8 transition ${
                  n <= displayScore ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`写下你的体验（至少 ${REVIEW_CONTENT_MIN} 字）`}
          rows={4}
          maxLength={500}
          className="w-full mt-4 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-pink-500/50 resize-none"
        />
        <p className="text-[10px] text-gray-600 mt-1 text-right">{content.trim().length}/500</p>

        <label className="flex items-center gap-2 mt-3 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-white/20"
          />
          匿名评价（对外不显示昵称）
        </label>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            提交评价
          </button>
        </div>
      </div>
    </div>
  );
}
