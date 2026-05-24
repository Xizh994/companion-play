const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

/** 上海自然日 [start, end) UTC Date，用于「每天一次」限制 */
export function getShanghaiDayBounds(at: Date = new Date()): { start: Date; end: Date } {
  const shanghaiMs = at.getTime() + SHANGHAI_OFFSET_MS;
  const shanghaiDate = new Date(shanghaiMs);
  const y = shanghaiDate.getUTCFullYear();
  const m = shanghaiDate.getUTCMonth();
  const d = shanghaiDate.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - SHANGHAI_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function formatShanghaiDateKey(at: Date = new Date()): string {
  const shanghaiMs = at.getTime() + SHANGHAI_OFFSET_MS;
  const shanghaiDate = new Date(shanghaiMs);
  const y = shanghaiDate.getUTCFullYear();
  const m = String(shanghaiDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shanghaiDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
