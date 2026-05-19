import type { ShopVerificationNotes } from "@/lib/verification-notes";
import { parseShopVerificationNotes } from "@/lib/verification-notes";

export type VerifyBadge = "none" | "pending" | "verifying" | "approved" | "rejected";

export interface VerifyBadgeView {
  badge: VerifyBadge;
  label: string;
  message: string;
  canSubmit: boolean;
  canResubmit: boolean;
}

const BADGE_CLASS: Record<VerifyBadge, string> = {
  none: "bg-gray-500/10 text-gray-500",
  pending: "bg-amber-500/10 text-amber-400",
  verifying: "bg-amber-500/10 text-amber-400",
  approved: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
};

const PANEL_CLASS: Record<VerifyBadge, string> = {
  none: "bg-white/[0.03] border-white/[0.08]",
  pending: "bg-amber-500/10 border-amber-500/20",
  verifying: "bg-amber-500/10 border-amber-500/20",
  approved: "bg-green-500/10 border-green-500/20",
  rejected: "bg-red-500/10 border-red-500/20",
};

const TEXT_CLASS: Record<VerifyBadge, string> = {
  none: "text-gray-400",
  pending: "text-amber-400",
  verifying: "text-amber-400",
  approved: "text-green-400",
  rejected: "text-red-400",
};

export function getVerifyBadgeClass(badge: VerifyBadge): string {
  return BADGE_CLASS[badge];
}

export function getVerifyPanelClass(badge: VerifyBadge): string {
  return PANEL_CLASS[badge];
}

export function getVerifyTextClass(badge: VerifyBadge): string {
  return TEXT_CLASS[badge];
}

export function getBossVerifyView(
  rn: { status: string; realName?: string; notes?: string | null } | null | undefined
): VerifyBadgeView {
  if (!rn) {
    return {
      badge: "none",
      label: "未认证",
      message: "完成实名认证后可浏览全部店铺并发起聊天",
      canSubmit: true,
      canResubmit: false,
    };
  }
  switch (rn.status) {
    case "APPROVED":
      return {
        badge: "approved",
        label: "已认证",
        message: "实名认证已通过",
        canSubmit: false,
        canResubmit: false,
      };
    case "REJECTED":
      return {
        badge: "rejected",
        label: "未通过",
        message: rn.notes || "实名认证未通过，请核对信息后重新提交",
        canSubmit: true,
        canResubmit: true,
      };
    default:
      return {
        badge: "verifying",
        label: "核验中",
        message: "实名信息核验中，请稍后刷新页面查看结果",
        canSubmit: false,
        canResubmit: false,
      };
  }
}

export function getShopVerifyView(sp: {
  verificationStatus?: string;
  verificationNotes?: string | null;
} | null | undefined): VerifyBadgeView {
  if (!sp) {
    return {
      badge: "none",
      label: "未提交",
      message: "请先完善店铺资料",
      canSubmit: false,
      canResubmit: false,
    };
  }

  const notes = parseShopVerificationNotes(
    typeof sp.verificationNotes === "string" ? sp.verificationNotes : null
  );
  const phase = notes?.phase;

  if (sp.verificationStatus === "APPROVED") {
    return {
      badge: "approved",
      label: "已认证",
      message: notes?.reason || "店铺企业认证已通过",
      canSubmit: false,
      canResubmit: false,
    };
  }

  if (sp.verificationStatus === "REJECTED") {
    return {
      badge: "rejected",
      label: "未通过",
      message: notes?.reason || "企业认证未通过，请核实后重新提交",
      canSubmit: false,
      canResubmit: true,
    };
  }

  if (phase === "verifying") {
    return {
      badge: "verifying",
      label: "核验中",
      message: notes?.reason || "正在核验企业信息，请稍候…",
      canSubmit: false,
      canResubmit: false,
    };
  }

  return {
    badge: "pending",
    label: "待核验",
    message: notes?.reason || "资料已提交，可发起企业要素核验",
    canSubmit: true,
    canResubmit: false,
  };
}

export function formatVerificationNotesForDisplay(
  raw: string | null | undefined
): string | null {
  const notes = parseShopVerificationNotes(raw);
  if (!notes?.reason) return null;
  return notes.reason;
}
