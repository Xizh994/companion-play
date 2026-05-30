"use client";

import { ShopHomepageView } from "@/components/ShopHomepageView";
import type { ShopHomepagePayload } from "@/lib/shop-homepage";

interface ShopHomepagePreviewFrameProps {
  homepage: ShopHomepagePayload;
}

/** 编辑页右侧：手机 mock 实时预览 */
export function ShopHomepagePreviewFrame({ homepage }: ShopHomepagePreviewFrameProps) {
  return (
    <div className="hidden lg:flex flex-col items-center sticky top-24 self-start">
      <p className="text-xs text-gray-500 mb-3 text-center">实时预览 · 手机效果</p>
      <div className="rounded-[2rem] border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-2 shadow-2xl shadow-black/40">
        <div className="relative rounded-[1.5rem] overflow-hidden bg-[#0f0f1a] ring-1 ring-white/10">
          {/* 状态栏装饰 */}
          <div className="h-6 bg-[#0f0f1a] flex items-center justify-center shrink-0">
            <div className="w-16 h-1 rounded-full bg-white/20" />
          </div>
          <div className="w-[375px] h-[min(72vh,680px)] overflow-y-auto overflow-x-hidden overscroll-contain">
            <ShopHomepageView homepage={homepage} mode="preview" embedded />
          </div>
        </div>
      </div>
      <p className="text-[10px] text-gray-600 mt-3 text-center max-w-[375px]">
        滚动预览完整主页 · 全屏效果请点「预览主页」
      </p>
    </div>
  );
}
