export type VerificationNotesPhase = "submitted" | "verifying" | "done";

export interface ShopVerificationNotes {
  phase: VerificationNotesPhase;
  reason?: string;
  aliyunRequestId?: string;
  bizCode?: string;
  ocr?: {
    creditCode?: string;
    companyName?: string;
    legalPerson?: string;
  };
}

export function parseShopVerificationNotes(
  raw: string | null | undefined
): ShopVerificationNotes | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as ShopVerificationNotes;
    if (parsed && typeof parsed.phase === "string") return parsed;
  } catch {
    // 兼容旧版纯文本 notes
    return { phase: "submitted", reason: raw };
  }
  return null;
}

export function stringifyShopVerificationNotes(notes: ShopVerificationNotes): string {
  return JSON.stringify(notes);
}

export function buildSubmittedNotes(reason?: string): string {
  return stringifyShopVerificationNotes({
    phase: "submitted",
    reason: reason || "资料已提交，待企业要素核验",
  });
}

export function buildVerifyingNotes(): string {
  return stringifyShopVerificationNotes({
    phase: "verifying",
    reason: "正在核验企业信息…",
  });
}
